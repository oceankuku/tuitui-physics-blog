import { cp, mkdtemp, mkdir, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const release = resolve(root, 'release');
const temp = await mkdtemp(resolve(tmpdir(), 'physics-blog-pack-'));
const name = 'tuitui-physics-blog';
const destination = resolve(temp, name);
const output = resolve(release, `${name}.zip`);
const stagedOutput = resolve(temp, `${name}.zip`);
const entries = ['README.md', 'AGENTS.md', 'agent.md', 'WORKBUDDY.md', 'AI_WRITING_GUIDE.md', 'BLOG_TEMPLATE.md', '.env.example', '.gitignore', 'site.config.mjs', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json', 'src', 'public', 'scripts', 'docs', 'functions'];
const excluded = new Set(['node_modules', '.git', '.astro', 'dist', 'release', '.checks', '__pycache__']);
try {
  await mkdir(release, { recursive: true });
  await mkdir(destination, { recursive: true });
  for (const entry of entries) {
    await cp(resolve(root, entry), resolve(destination, entry), {
      recursive: true,
      filter(path) {
        const parts = relative(root, path).split(sep);
        return !parts.some((part) => excluded.has(part) || part === '.DS_Store' || part.endsWith('.log') || (part.startsWith('.env') && part !== '.env.example'));
      },
    });
  }
  for (const folder of ['inbox', 'image-notes']) await mkdir(resolve(destination, 'workspace', folder), { recursive: true });
  for (const file of ['hero-physics-v1.json', 'hero-physics-v2.json', 'hero-physics-all-preview.html']) {
    await cp(resolve(root, 'workspace/image-notes', file), resolve(destination, 'workspace/image-notes', file));
  }
  const result = spawnSync('zip', ['-q', '-r', stagedOutput, name], { cwd: temp, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('zip 打包失败，请确认已安装 zip 命令。');
  await rename(stagedOutput, output);
  console.log(`可交付源码包：${output}`);
} finally { await rm(temp, { recursive: true, force: true }); }
