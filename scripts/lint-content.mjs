#!/usr/bin/env node
// 发布前内容体检（2026-10-15 新增）。原老师要求"发布之前都检查一下，
// 公式和表格图片是否格式正确，不用一遍一遍改"——把历次踩过的坑全部
// 前置成一轮检查：
//   error（阻断发布）：Unicode 分数、公式块外的 {a/b}、公式围栏不配平、
//                     表格列数不齐、图片文件缺失/无 alt、内链 404、
//                     正文出现 H1、frontmatter 缺项
//   warning（提示不阻断）：正文叙述里的斜杠分数、公式块外的裸 √(
// 2026-10-21 规范改版：移除「每篇至少 3 图」与「固定结尾三段」检查——
// 配图按教学需要配（主规范第八节），固定收尾改为可选（主规范第十节）。
// 用法：node scripts/lint-content.mjs [文件...]（缺省检查全部文章）
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = resolve(root, 'src/content/blog');
const publicDir = resolve(root, 'public');

const args = process.argv.slice(2);
const targets = args.length
  ? args.map((a) => resolve(process.cwd(), a))
  : (await readdir(contentDir)).filter((f) => f.endsWith('.md')).map((f) => resolve(contentDir, f));

const UNICODE_FRACTIONS = /[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/;
const problems = [];
let fileCount = 0;

const push = (file, line, level, message) => problems.push({ file, line, level, message });

// 拆 frontmatter 与正文；返回 null 表示没有合法 frontmatter。
function splitFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const meta = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const pair = raw.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (pair) meta[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: match[2], metaLines: match[1].split(/\r?\n/).length + 1 };
}

// 正文按行分类：code fence / 围栏（formula、problem、answer、note）内外，便于做"块外"规则。
function classifyLines(body) {
  const lines = body.split(/\r?\n/);
  const state = { code: false, fenced: false };
  return lines.map((line, index) => {
    let startCode = false, endCode = false, startFenced = false, endFenced = false;
    if (/^\s*```/.test(line)) {
      if (!state.code) { startCode = true; state.code = true; } else { endCode = true; state.code = false; }
    }
    // :::formula / :::problem / :::answer / :::note 都开围栏；裸 ::: 关围栏
    if (!state.code && /^:::(formula|problem|answer|note)\s*$/.test(line)) { startFenced = true; state.fenced = true; }
    else if (!state.code && state.fenced && /^:::\s*$/.test(line)) { endFenced = true; state.fenced = false; }
    return { line, number: index + 1, inCode: state.code && !endCode, inFormula: state.fenced && !endFenced };
  });
}

// 表格列数：按未转义管道切分。
function cellCount(line) {
  const stripped = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split(/(?<!\\)\|/).length;
}

for (const file of targets) {
  if (!existsSync(file)) { push(file, 0, 'error', '文件不存在'); continue; }
  const text = await readFile(file, 'utf8');
  fileCount++;
  const rel = file.slice(root.length + 1);
  const fm = splitFrontmatter(text);
  if (!fm) { push(rel, 1, 'error', '缺少合法 frontmatter（--- 包围）'); continue; }
  const isDraft = fm.meta.draft === 'true';
  const rows = classifyLines(fm.body);

  // 容器嵌套检查（2026-10-24）：卡片内不得再开 formula/problem/answer/note，
  // 内层围栏会提前关闭外层卡片（例题五公式外溢事故的根因）。
  let openContainer = '';
  for (const { line, number, inCode } of rows) {
    if (inCode) continue;
    const open = line.match(/^:::(formula|problem|answer|note)\s*$/);
    if (open) {
      if (openContainer) push(rel, number + fm.metaLines, 'error', `容器嵌套：${openContainer} 内又开 ${open[1]}（内层会提前关闭外层卡片，把公式块移到卡片外）`);
      else openContainer = open[1];
    } else if (/^:::\s*$/.test(line) && openContainer) {
      openContainer = '';
    }
  }

  // frontmatter 必填项
  for (const key of ['title', 'description', 'pubDate']) {
    if (!fm.meta[key]) push(rel, 1, 'error', `frontmatter 缺 ${key}`);
  }
  if (fm.meta.pubDate && !/^\d{4}-\d{2}-\d{2}$/.test(fm.meta.pubDate)) {
    push(rel, 1, 'error', `pubDate 格式应为 YYYY-MM-DD，当前「${fm.meta.pubDate}」`);
  }

  // 已有文章 slug 集合（内链检查用）
  const slugs = new Set((await readdir(contentDir)).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));

  for (const { line, number, inCode, inFormula } of rows) {
    if (UNICODE_FRACTIONS.test(line)) push(rel, number + fm.metaLines, 'error', '出现 Unicode 分数字符（½ 等），应写成 1/2 或 {1/2} 竖式');
    // 自 2026-10-22 起，{a/b}、√( )、裸斜杠分数（安全子集：数字/变量/√ 组合，
    // 单位 m/s、km/h、kg/m³ 等除外）均会在正文/答案/备注/公式块内自动渲染为
    // 竖式分数与结构化根号，不再局限于 :::formula 块。故不再对公式块外的
    // {a/b} / √( / 斜杠分数报错或警告。下面只保留 URL、图片、链接等其它检查。

    if (/^#\s/.test(line)) push(rel, number + fm.metaLines, 'error', '正文出现 H1，标题由 frontmatter title 渲染，不得重复');

    // 图片：文件必须存在、alt 必须非空、禁止引用构建产物路径
    for (const img of line.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
      const [, alt, src] = img;
      if (!alt.trim()) push(rel, number + fm.metaLines, 'error', `图片缺 alt：${src}`);
      if (src.startsWith('/_content-images/')) push(rel, number + fm.metaLines, 'error', `禁止引用构建产物哈希路径：${src}`);
      if (src.startsWith('/')) {
        const target = resolve(publicDir, '.' + decodeURIComponent(src.split(/[?#]/)[0]));
        if (!existsSync(target)) push(rel, number + fm.metaLines, 'error', `图片文件不存在：${src}`);
      }
    }

    // 站内文章链接
    for (const link of line.matchAll(/\[[^\]]*\]\(\/blog\/([^/)\s]+)\/?[)]/g)) {
      if (!slugs.has(link[1])) push(rel, number + fm.metaLines, 'error', `站内链接指向不存在的文章：/blog/${link[1]}/`);
    }
  }

  // 围栏配平（formula/problem/answer/note/usage/selfcheck 六种容器都是合法围栏）
  const fences = rows.filter((r) => /^:::/.test(r.line) && !r.inCode);
  if (fences.length % 2 !== 0) push(rel, fences.at(-1).number + fm.metaLines, 'error', `::: 围栏不配平（共 ${fences.length} 个）`);
  for (let i = 0; i + 1 < fences.length; i += 2) {
    if (!/^:::(formula|problem|answer|note|usage|selfcheck)/.test(fences[i].line)) push(rel, fences[i].number + fm.metaLines, 'error', `第 ${i / 2 + 1} 个围栏不是 :::formula/:::problem/:::answer/:::note 开头`);
  }

  // 表格：每行列数必须一致
  let table = [];
  const flushTable = () => {
    if (table.length < 2) { table = []; return; }
    const expect = cellCount(table[0].line);
    const sepOk = /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(table[1].line) && table[1].line.includes('-');
    if (!sepOk) { push(rel, table[1].number + fm.metaLines, 'error', '表格缺分隔行（| --- | --- |）'); }
    for (const row of table) {
      const n = cellCount(row.line);
      if (n !== expect) push(rel, row.number + fm.metaLines, 'error', `表格列数不齐：此行 ${n} 列，表头 ${expect} 列`);
    }
    table = [];
  };
  for (const row of rows) {
    if (/^\s*\|.*\|\s*$/.test(row.line) && !row.inCode) table.push(row);
    else flushTable();
  }
  flushTable();

}

const errors = problems.filter((p) => p.level === 'error');
const warns = problems.filter((p) => p.level === 'warn');
for (const p of problems) console.log(`${p.level === 'error' ? '✗' : '⚠'} ${p.file}${p.line ? ':' + p.line : ''} [${p.level}] ${p.message}`);
console.log(`\n体检完成：${fileCount} 篇文章，${errors.length} 个错误，${warns.length} 个提示`);
if (errors.length) { console.log('有错误未清零，不进入发布。'); process.exit(1); }
console.log('内容体检通过。');
