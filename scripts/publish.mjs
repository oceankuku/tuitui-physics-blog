#!/usr/bin/env node
// 一键发文链路（2026-10-15 新增）。原老师要求"每次发文章都能快速发文，
// 发布前自动体检，不用一遍一遍改、不弹问题确认"。本脚本把发布固化成
// 四步，全部自动执行，任何一步失败即停（exit 1），成功即直接推送：
//   1. 内容体检（lint-content）：公式/表格/图片/内链/结尾三段一轮查完
//   2. 快速构建（astro build，跳过全量 astro check——纯文章改动无需
//      类型检查，省约 45 秒；改了 src 代码时手动跑 npm run build）
//   3. 发布校验（verify-seo）
//   4. git add 相关文件 + commit + push origin main，Cloudflare 自动部署
// 用法：npm run publish "可选的 commit 摘要"
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (command, args, label) => {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} 失败，发布中止。（问题已定位到上一步输出，改完重跑 npm run publish 即可）`);
    process.exit(result.status ?? 1);
  }
};

// 0. 环境预检：lock 文件与 package.json 同步（Cloudflare 用 npm ci 构建）
const pkg = JSON.parse(await import('node:fs/promises').then((m) => m.readFile(resolve(root, 'package.json'), 'utf8')));
const dryRun = spawnSync('npm', ['ci', '--dry-run'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
if (dryRun.status !== 0) {
  console.error('✗ npm ci --dry-run 失败：package.json 与 package-lock.json 不同步。');
  console.error('  先跑 npm install 更新 lock 文件再发布，否则 Cloudflare 构建必挂。');
  console.error(dryRun.stdout + dryRun.stderr);
  process.exit(1);
}

run('node', ['scripts/lint-content.mjs'], '第 1 步/4：内容体检（公式·表格·图片·内链·结尾三段）');
run('npm', ['run', 'build:fast'], '第 2 步/4：快速构建（跳过类型检查，纯内容改动无需）');
run('npm', ['run', 'verify'], '第 3 步/4：发布校验（SEO/清单/图片）');

// 4. 提交推送。消息取第一个命令行参数，缺省用默认摘要。
const message = process.argv.slice(2).join(' ').trim() || '发布文章更新（lint + build + verify 全部通过）';
console.log(`\n▶ 第 4 步/4：提交并推送（${message}）`);
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
const status = git(['status', '--porcelain']);
if (!status.stdout.trim()) {
  console.log('没有需要提交的改动。');
  process.exit(0);
}
const add = git(['add', 'src/content/blog', 'public/blog-images', 'scripts/static-assets.mjs']);
if (add.status !== 0) { console.error(add.stderr); process.exit(1); }
// spawnSync 不走 shell 时带空格的 -m 消息会被 git 拆成多个 pathspec（Windows
// 下尤其明显），必须显式 shell:false 且消息作为单个数组元素传入。
const commit = spawnSync('git', ['commit', '-m', message], { cwd: root, encoding: 'utf8', windowsVerbatimArguments: false });
if (commit.status !== 0) { console.error(commit.stdout + commit.stderr); process.exit(1); }
const push = git(['push', 'origin', 'main']);
if (push.status !== 0) { console.error(push.stdout + push.stderr); process.exit(1); }
console.log(push.stdout.trim());
console.log('\n✓ 发布完成：已推送 origin main，Cloudflare Pages 正在自动构建（约 2-3 分钟后线上生效）。');
