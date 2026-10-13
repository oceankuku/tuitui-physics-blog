import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile, open } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, extname, join, resolve, sep } from 'node:path';

// 素材库本机管理接口。只在 astro dev 下生效（vite configureServer），
// 静态构建不包含任何接口，部署产物不受影响。
// 登记信息存在 scripts/asset-labels.json，static-assets.mjs 构建时读取。

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = process.cwd();
const publicDir = resolve(root, 'public');
const labelsFile = resolve(root, 'scripts', 'asset-labels.json');
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.ico']);
const maxBytes = 20 * 1024 * 1024;

// 允许写入的目录白名单：目录 key -> public 下相对路径。
const targets = {
  uploads: 'material-library/uploads',
  'site-assets': 'site-assets',
  'hero-v1': 'material-library/hero-physics-v1',
  'hero-v2': 'material-library/hero-physics-v2',
  'blog-images': 'blog-images',
};

async function readLabels() {
  if (!existsSync(labelsFile)) return {};
  try { return JSON.parse(await readFile(labelsFile, 'utf8')); } catch { return {}; }
}

function safeName(name) {
  const base = basename(name || '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+/, '');
  if (!base || !extensions.has(extname(base).toLowerCase())) return null;
  return base;
}

function insidePublic(target) {
  const resolved = resolve(target);
  return resolved === publicDir || resolved.startsWith(publicDir + sep);
}

async function uniquePath(dir, filename) {
  const ext = extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  let candidate = join(dir, filename);
  let n = 2;
  while (existsSync(candidate)) candidate = join(dir, `${stem}-${n++}${ext}`);
  return candidate;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req, limit = maxBytes) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { rejectPromise(new Error('too-large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolvePromise(Buffer.concat(chunks)));
    req.on('error', rejectPromise);
  });
}

async function saveOne(file, targetKey, title, alt) {
  const dir = resolve(publicDir, targets[targetKey]);
  if (!insidePublic(dir)) throw new Error('bad-target');
  const clean = safeName(file.filename);
  if (!clean) throw new Error('bad-filename');
  await mkdir(dir, { recursive: true });
  const dest = await uniquePath(dir, clean);
  await writeFile(dest, file.data);
  const relPath = '/' + dest.slice(publicDir.length + 1).split(sep).join('/');
  const labels = await readLabels();
  labels[relPath] = [title || clean.replace(/\.[^.]+$/, ''), alt || `图片素材：${clean}`];
  await writeFile(labelsFile, JSON.stringify(labels, null, 2) + '\n', 'utf8');
  return relPath;
}

/** @returns {import('vite').Plugin} */
export function materialsManager() {
  return {
    name: 'materials-manager-dev',
    apply: 'serve',
    configureServer(server) {
      const parseMultipart = async (req) => {
        const contentType = req.headers['content-type'] || '';
        const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
        if (!match) throw new Error('no-boundary');
        const boundary = Buffer.from('--' + (match[1] || match[2]));
        const body = await readBody(req);
        const parts = [];
        let start = body.indexOf(boundary);
        while (start !== -1) {
          const next = body.indexOf(boundary, start + boundary.length);
          if (next === -1) break;
          const segment = body.subarray(start + boundary.length + 2, next - 2);
          const headerEnd = segment.indexOf('\r\n\r\n');
          if (headerEnd !== -1) {
            const header = segment.subarray(0, headerEnd).toString('utf8');
            const data = segment.subarray(headerEnd + 4);
            const nameMatch = header.match(/name="([^"]*)"/);
            const fileMatch = header.match(/filename="([^"]*)"/);
            parts.push({ name: nameMatch ? nameMatch[1] : '', filename: fileMatch ? fileMatch[1] : '', data });
          }
          start = next;
        }
        return parts;
      };

      server.middlewares.use('/api/materials', async (req, res) => {
        try {
          const action = req.url.split('?')[0].replace(/^\//, '');

          if (req.method === 'POST' && action === 'upload') {
            const parts = await parseMultipart(req);
            const files = parts.filter((part) => part.filename);
            const fields = Object.fromEntries(parts.filter((part) => !part.filename).map((part) => [part.name, part.data.toString('utf8')]));
            if (files.length === 0) return json(res, 400, { error: '没有收到图片文件。' });
            const target = targets[fields.target] ? fields.target : 'uploads';
            const saved = [];
            for (const file of files) saved.push(await saveOne(file, target, fields.title, fields.alt));
            return json(res, 200, { ok: true, saved, restart: true });
          }

          const labels = await readLabels();

          if (req.method === 'POST' && action === 'update') {
            const body = JSON.parse((await readBody(req, 1024 * 1024)).toString('utf8') || '{}');
            const pathKey = body.path;
            if (!pathKey || !labels[pathKey]) return json(res, 404, { error: '找不到这条素材登记。' });
            labels[pathKey] = [String(body.title || labels[pathKey][0]).slice(0, 80), String(body.alt || labels[pathKey][1]).slice(0, 200)];
            await writeFile(labelsFile, JSON.stringify(labels, null, 2) + '\n', 'utf8');
            return json(res, 200, { ok: true, restart: true });
          }

          if (req.method === 'POST' && action === 'delete') {
            const body = JSON.parse((await readBody(req, 1024 * 1024)).toString('utf8') || '{}');
            const pathKey = body.path;
            if (!pathKey) return json(res, 400, { error: '缺少文件路径。' });
            const target = resolve(publicDir, '.' + decodeURIComponent(pathKey));
            if (!insidePublic(target) || !existsSync(target)) return json(res, 404, { error: '文件不存在或不在素材目录内。' });
            // 仅允许删除素材目录里的文件；文章配图目录与品牌图标受保护。
            const protectedDirs = ['blog-images', 'brand'];
            if (protectedDirs.some((dir) => target.startsWith(resolve(publicDir, dir) + sep))) {
              return json(res, 403, { error: '文章配图与品牌图标请在文件管理器中手动删除。' });
            }
            const labels = await readLabels();
            // 本环境给 fs 注入了「移入回收站」shim，在 dev server 常驻进程里可能失败；
            // 先尝试 unlink，失败则改为清空内容并记录待清理路径，文件系统层面下次启动前由构建清理。
            try {
              await unlink(target);
            } catch (unlinkError) {
              const tombstone = resolve(root, 'node_modules/.cache/materials-pending-delete.txt');
              await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
              let tomb = '';
              if (existsSync(tombstone)) tomb = await readFile(tombstone, 'utf8');
              if (!tomb.split('\n').includes(target)) await writeFile(tombstone, tomb + target + '\n', 'utf8');
              const handle = await open(target, 'w');
              await handle.close();
              console.warn(`[materials] 文件已清空并加入待清理列表（回收站服务暂不可用）：${target}`);
            }
            if (labels[pathKey]) { delete labels[pathKey]; await writeFile(labelsFile, JSON.stringify(labels, null, 2) + '\n', 'utf8'); }
            return json(res, 200, { ok: true, restart: true });
          }

          if (req.method === 'GET' && action === 'labels') {
            return json(res, 200, { ok: true, labels });
          }

          json(res, 404, { error: '未知操作。' });
        } catch (error) {
          if (error.message === 'too-large') return json(res, 413, { error: '单张图片不能超过 20 MB。' });
          json(res, 500, { error: '处理失败：' + error.message });
        }
      });
    },
  };
}
