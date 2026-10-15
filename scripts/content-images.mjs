import { createHash } from 'node:crypto';
import { existsSync, createReadStream } from 'node:fs';
import { readFile, mkdir, cp } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = resolve(root, 'public');
// Astro 4 removes its .astro staging directory before build:done. Use a
// separate persistent cache so derivatives survive until they are copied.
const cache = resolve(root, 'node_modules/.cache/blog-content-images');
const work = new Map();

async function variants(src) {
  if (!src.startsWith('/') || src.startsWith('//')) return null;
  const filename = resolve(publicDir, '.' + decodeURIComponent(src.split(/[?#]/)[0]));
  if (!filename.startsWith(publicDir + sep) || !existsSync(filename)) return null;
  if (!work.has(filename)) work.set(filename, (async () => {
    const input = await readFile(filename);
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || (meta.pages ?? 1) > 1) return null;
    // Preserve vector art and animated images. Raster derivatives are generated
    // into the build cache; neither originals nor Markdown sources are changed.
    if (!['png', 'jpeg', 'webp', 'avif'].includes(meta.format)) return { width: meta.width, height: meta.height };
    const rotate = [5, 6, 7, 8].includes(meta.orientation);
    const width = rotate ? meta.height : meta.width;
    const height = rotate ? meta.width : meta.height;
    const hash = createHash('sha256').update(input).update('webp-q85-v1').digest('hex').slice(0, 20);
    const widths = [...new Set([640, 960, 1600].map((w) => Math.min(w, width)))];
    await mkdir(cache, { recursive: true });
    const files = [];
    for (const size of widths) {
      const name = `${hash}-${size}.webp`;
      if (!existsSync(resolve(cache, name))) await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 85 }).toFile(resolve(cache, name));
      files.push({ src: `/_content-images/${name}`, width: size });
    }
    return { width, height, files };
  })());
  return work.get(filename);
}

export function contentImages() {
  return async (tree) => {
    const images = [];
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'img') images.push(node);
      node.children?.forEach(visit);
    };
    visit(tree);
    // Keep concurrency bounded: large hand-drawn illustrations can be expensive.
    for (const [index, node] of images.entries()) {
      const p = node.properties ??= {};
      p.loading = index === 0 ? 'eager' : 'lazy';
      p.decoding = 'async';
      if (index === 0) p.fetchPriority = 'high';
      const image = await variants(String(p.src ?? ''));
      if (!image) continue;
      p.width = image.width; p.height = image.height;
      if (image.files) {
        p.src = image.files.at(-1).src;
        p.srcSet = image.files.map((file) => `${file.src} ${file.width}w`).join(', ');
        p.sizes = '(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 75vw, 900px';
      }
    }
  };
}

// 正式公式标记插件。Markdown 里用 :::formula ... ::: 包住公式，
// 渲染成 div.formula-block；其中的 {a/b} 转成竖式分数（上分子、
// 下分母、中间横线），符合数理排版惯例，避免斜杠分数的别扭观感。
// √(...) 转成结构化根号（span.formula-radical）：根号符号 + 上边线
// 盖住整个被开方数，内部同样支持 {a/b} 竖式分数（2026-10-14 原老师
// 反馈"根号没把根号下的内容包住、根号下分数形式要和外面一样"）。
// 注意：directive 容器必须在 remark 阶段处理（remarkRehype 会把
// containerDirective 编译成普通 div，rehype 阶段就认不出了）。
// remark 阶段生成的是 mdast 元素：用 data.hName 指定输出标签。
export function formulaBlocks() {
  const fracNode = (num, den) => ({
    type: 'paragraph',
    data: {
      hName: 'span',
      hProperties: { className: ['formula-frac'] },
      hChildren: [
        { type: 'element', tagName: 'span', properties: { className: ['num'] }, children: [{ type: 'text', value: num.trim() }] },
        { type: 'element', tagName: 'span', properties: { className: ['den'] }, children: [{ type: 'text', value: den.trim() }] },
      ],
    },
    children: [],
  });
  // 根号节点：symbol 是 √ 字符，radicand（被开方数）由 formula-radical-body
  // 承载并带 CSS 上边线，根号线自然盖住内部所有内容（含竖式分数）。
  const radicalNode = (radicandParts) => ({
    type: 'paragraph',
    data: {
      hName: 'span',
      hProperties: { className: ['formula-radical'] },
      hChildren: [
        { type: 'element', tagName: 'span', properties: { className: ['formula-radical-symbol'] }, children: [{ type: 'text', value: '√' }] },
        { type: 'element', tagName: 'span', properties: { className: ['formula-radical-body'] }, children: radicandParts },
      ],
    },
    children: [],
  });
  // 把一段文本拆成「文本 + 竖式分数」的 hChildren 序列；根号内部同样走 {a/b} 竖式。
  const fracHChildren = (num, den) => [{
    type: 'element',
    tagName: 'span',
    properties: { className: ['formula-frac'] },
    children: [
      { type: 'element', tagName: 'span', properties: { className: ['num'] }, children: [{ type: 'text', value: num.trim() }] },
      { type: 'element', tagName: 'span', properties: { className: ['den'] }, children: [{ type: 'text', value: den.trim() }] },
    ],
  }];
  const toInlineParts = (value) => String(value)
    .split(/(\{[^{}]*\/[^{}]*\})/g)
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^\{([^{}]*?)\/([^{}]*)\}$/);
      return match ? fracHChildren(match[1], match[2]) : { type: 'text', value: part };
    })
    .flat();
  const transformText = (value) => {
    // 先拆根号 √(...)：括号配平，容忍被开方数里嵌一层小括号（如 √(v₀² + (gt)²)）
    const radicalSplit = String(value).split(/(√\([^()]*(?:\([^()]*\)[^()]*)*\))/g).filter(Boolean);
    if (radicalSplit.length > 1) {
      return radicalSplit.map((part) => {
        const match = part.match(/^√\(([\s\S]*)\)$/);
        if (!match) return transformText(part) ?? [{ type: 'text', value: part }];
        return [radicalNode(toInlineParts(match[1]))];
      }).flat();
    }
    const parts = String(value).split(/(\{[^{}]*\/[^{}]*\})/g).filter(Boolean);
    if (parts.length <= 1) return null;
    return parts.map((part) => {
      const match = part.match(/^\{([^{}]*?)\/([^{}]*)\}$/);
      return match ? fracNode(match[1], match[2]) : { type: 'text', value: part };
    });
  };
  const transformNode = (node) => {
    // 文本节点：拆出分数
    if (node.type === 'text') return transformText(node.value) ?? [node];
    // 段落：若其中混有分数，拆成兄弟节点序列
    if (node.type === 'paragraph') {
      const pieces = [];
      for (const child of node.children ?? []) {
        const out = transformNode(child);
        for (const piece of (out ?? [child])) pieces.push(piece);
      }
      const hasFrac = pieces.some((piece) => piece.type === 'paragraph' && piece.data?.hName === 'span');
      if (!hasFrac) return [node];
      // 纯文本段落整体变分数时，直接替换；否则拍平为同级序列
      return pieces;
    }
    // 其他节点（emphasis 等）：递归处理子节点
    if (node.children?.length) {
      node.children = node.children.flatMap((child) => transformNode(child) ?? [child]);
    }
    return [node];
  };
  return async (tree) => {
    const visitAny = (node) => {
      if (node.type === 'containerDirective' && node.name === 'formula') {
        node.data ??= {};
        node.data.hName = 'div';
        node.data.hProperties = { className: ['formula-block'] };
        node.children = node.children.flatMap(transformNode);
        return;
      }
      node.children?.forEach(visitAny);
    };
    visitAny(tree);
  };
}

// 兜底还原未被消费的指令（2026-10-15 踩坑修复）。micromark 的指令语法
// 是「冒号 + 标识符」，正文里紧贴的时间/比例写法（如 1:3:5 里的 :5）
// 会被 remark-directive 误解析成 textDirective，而 remark-rehype 默认把
// 未处理的指令编译成空 <div></div>，导致「：5」「：9」这类文字被吞、
// 表格工整性被破坏。站点正文只使用 :::formula 容器指令，其余 text/leaf
// 指令一律视为误触发，按源文本（position 精确切片）原样还原，保证
// 以后写 1:2:3、1:√2:√3 这类比例不再踩坑。
export function plainDirectives() {
  return (tree, file) => {
    const source = String(file?.value ?? '');
    const walk = (node) => {
      if (!node.children?.length) return;
      const next = [];
      for (const child of node.children) {
        if ((child.type === 'textDirective' || child.type === 'leafDirective') && !child.data?.hName) {
          const slice = child.position && source
            ? source.slice(child.position.start.offset, child.position.end.offset)
            : ':' + child.name;
          next.push({ type: 'text', value: slice });
          continue;
        }
        walk(child);
        next.push(child);
      }
      node.children = next;
    };
    walk(tree);
  };
}

export function contentImageAssets() {
  return {
    name: 'content-image-assets',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => updateConfig({ vite: { plugins: [{
        name: 'content-image-dev',
        configureServer(server) {
          server.middlewares.use('/_content-images/', (req, res, next) => {
            const name = (req.url || '').split('?')[0].replace(/^\//, '');
            if (!/^[a-f0-9]{20}-\d+\.webp$/.test(name) || !existsSync(resolve(cache, name))) return next();
            res.setHeader('Content-Type', 'image/webp');
            createReadStream(resolve(cache, name)).pipe(res);
          });
        },
      }] } }),
      'astro:build:done': async ({ dir }) => {
        if (existsSync(cache)) await cp(cache, new URL('_content-images/', dir), { recursive: true });
      },
    },
  };
}
