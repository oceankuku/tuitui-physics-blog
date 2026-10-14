import { chromium } from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { staticServer } from './static-server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(resolve(tmpdir(), 'wulike-smoke-'));
const fixture = resolve(temporary, 'site');
let browser, server;
const failed = [];
try {
  await cp(root, fixture, { recursive: true, filter(path) {
    return !relative(root, path).split(sep).some((part) => ['node_modules', '.git', '.astro', 'dist', 'release', '.checks', 'workspace'].includes(part) || part.startsWith('.env') || part === '.DS_Store');
  } });
  await symlink(resolve(root, 'node_modules'), resolve(fixture, 'node_modules'), 'dir');
  const content = resolve(fixture, 'src/content/blog');
  // smoke-1 额外带一个含分数的公式（校验分数结构）和根号公式（校验根号
  // 上划线盖住被开方数、根号内分数走竖式）；
  // smoke-2 额外带表格和代码块，用于校验 table-layout 固定布局与代码选区行为。
  for (let i = 1; i <= 9; i++) {
    const body = i === 1 ? 'Fixture body 1.\n\n:::formula\nv(B) = {x₁ + x₂ / 2T′}\n\nv(x/2) = √({v₀² + v² / 2})\n:::\n'
      : i === 2 ? 'Fixture body 2.\n\n| 列甲 | 列乙 |\n| --- | --- |\n| 甲一 | 乙一 |\n\n```text\nfixture code block\n```\n'
      : `Fixture body ${i}.\n`;
    await writeFile(resolve(content, `smoke-${i}.md`), `---\ntitle: "Smoke note ${i}"\ndescription: "Pagination fixture ${i}"\npubDate: 2026-10-0${i}\ntags: ["测试"]\n---\n\n## Check\n\n${body}`);
  }
  await writeFile(resolve(content, 'private-fixture.md'), '---\ntitle: "Private fixture"\ndescription: "Must stay private"\npubDate: 2026-10-10\ndraft: true\n---\n\nPrivate body.\n');
  const env = { ...process.env, SITE_URL: 'https://physics.example' };
  // Windows 下 npm 是 npm.cmd，必须走 shell 才能解析。
  const build = spawnSync('npm', ['run', 'build'], { cwd: fixture, env, encoding: 'utf8', shell: process.platform === 'win32' });
  if (build.status !== 0 || build.error) throw new Error('smoke build failed: ' + (build.stdout || '') + (build.stderr || '') + (build.error?.message || ''));
  // Windows 下没有 python3 别名，回退到 python。
  const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
  const verify = spawnSync(pythonBin, ['scripts/verify-seo.py', 'dist'], { cwd: fixture, env, encoding: 'utf8', shell: process.platform === 'win32' });
  assert.equal(verify.status, 0, verify.stdout + verify.stderr);
  console.log(verify.stdout.trim());
  const index = JSON.parse(await readFile(resolve(fixture, 'dist/content-index.json'), 'utf8'));
  assert.equal(index.site, 'https://physics.example');
  assert(!index.entries.some((entry) => entry.id.includes('private-fixture')));
  assert(index.entries.every((entry) => entry.url.startsWith('https://physics.example/')));

  const hosting = await staticServer(resolve(fixture, 'dist')); server = hosting.server;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (error) => failed.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400 && !response.url().includes('/private-fixture') && !response.url().includes('/missing')) failed.push(`HTTP ${response.status()} ${response.url()}`); });
  // Verify the rich/plain/image payloads without changing the user's OS clipboard.
  await page.addInitScript(() => {
    window.__clipboard = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => { window.__clipboard.push({ text }); },
      write: async (items) => {
        for (const item of items) {
          const record = {};
          for (const type of item.types) { const blob = await item.getType(type); record[type] = type.startsWith('text/') ? await blob.text() : blob.size; }
          window.__clipboard.push(record);
        }
      },
    } });
  });
  await page.goto(hosting.origin + '/');
  await page.locator('.portrait-stage').click();
  assert.equal(await page.locator('.hero-character.is-active').count(), 1);
  assert((await page.locator('.portrait-stage').getAttribute('aria-label')).includes('第 2 张'));
  await page.locator('.theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.locator('.theme-toggle').click();

  await page.goto(hosting.origin + '/materials/');
  const totalAssets = await page.locator('.asset-card').count();
  assert(totalAssets >= 16);
  await page.getByRole('button', { name: /^老师立绘/ }).click();
  assert.equal(await page.locator('.asset-card:visible').count(), 12);
  await page.getByRole('searchbox', { name: '搜索素材' }).fill('lab-cart');
  assert.equal(await page.locator('.asset-card:visible').count(), 1);
  await page.getByRole('button', { name: '预览小车实验', exact: true }).click();
  const assetDialog = page.getByRole('dialog');
  await assetDialog.waitFor({ state: 'visible' });
  assert.equal(await page.locator('#asset-path').innerText(), '/site-assets/teacher-lab-cart.png');
  await page.waitForFunction(() => { const image = document.querySelector('#asset-original'); return image.complete && image.naturalWidth === 1024; });
  await page.getByRole('button', { name: '复制图片路径', exact: true }).click();
  await page.waitForFunction(() => window.__clipboard.at(-1)?.text === '/site-assets/teacher-lab-cart.png');
  await page.getByRole('button', { name: '复制 Markdown', exact: true }).click();
  assert((await page.evaluate(() => window.__clipboard.at(-1).text)).includes('](/site-assets/teacher-lab-cart.png)'));
  const downloading = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载原图' }).click();
  assert.equal((await downloading).suggestedFilename(), 'teacher-lab-cart.png');
  await page.keyboard.press('Escape');
  await assetDialog.waitFor({ state: 'hidden' });
  // Native dialog visibility changes before its queued close event runs.
  await page.waitForFunction(() => !document.body.classList.contains('asset-preview-open'));
  assert.equal(await page.evaluate(() => document.body.classList.contains('asset-preview-open')), false);
  assert.equal(await page.getByRole('button', { name: '预览小车实验', exact: true }).evaluate((element) => element === document.activeElement), true);
  await page.locator('#asset-search').fill('no-such-material');
  assert(await page.locator('.empty-assets').isVisible());
  await page.getByRole('button', { name: '清除搜索和分类' }).click();
  assert.equal(await page.locator('.asset-card:visible').count(), totalAssets);
  await page.locator('[data-open]').first().click();
  const firstAsset = await page.locator('#asset-path').innerText();
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('#asset-path').innerText(), firstAsset);
  await page.getByRole('button', { name: '关闭素材预览' }).click();

  await page.goto(hosting.origin + '/blog/');
  // 公开文章数 = 9 篇 fixture + 站点已发布文章；按 PAGE_SIZE=8 动态计算第二页数量。
  const totalPosts = await page.locator('.post-card').count();
  const expectedSecondPage = totalPosts - 8;
  assert.equal(await page.locator('.post-card:visible').count(), Math.min(8, totalPosts));
  await page.locator('#nextPage').click();
  assert.equal(await page.locator('.post-card:visible').count(), expectedSecondPage);
  assert(page.url().includes('page=2'));
  await page.reload(); assert.equal(await page.locator('#currentPage').innerText(), '2');
  await page.locator('#searchInput').fill('布满小点');
  assert.equal(await page.locator('.post-card:visible').count(), 1);
  await page.locator('#searchInput').fill('no-matching-article');
  assert(await page.locator('#emptyState').isVisible());
  await page.locator('#searchInput').fill('');
  await page.locator('.filter-button').filter({ hasText: '纸带问题' }).click();
  assert.equal(await page.locator('.post-card:visible').count(), 1);
  await page.locator('#clearTags').click();
  assert.equal(await page.locator('.post-card:visible').count(), Math.min(8, totalPosts));

  // Reader links stay on the current host and export the selected article.
  for (const [slug, expected] of [['paper-tape-analysis', '布满小点的纸'], ['smoke-1', 'Fixture body 1.']]) {
    await page.goto(`${hosting.origin}/blog/${slug}/`);
    const href = await page.getByRole('link', { name: '阅读 Markdown', exact: true }).getAttribute('href');
    assert.equal(href, `/blog/${slug}/index.md`);
    const response = await page.request.get(new URL(href, page.url()).href);
    assert.equal(response.status(), 200);
    assert((await response.text()).includes(expected));
  }
  await page.goto(hosting.origin + '/blog/paper-tape-analysis/');
  assert((await page.locator('.article-nav-link').count()) > 0);
  assert((await page.locator('.toc-link').count()) >= 3);
  const image = page.locator('.article-content img').first();
  assert(await image.evaluate((element) => element.complete && element.naturalWidth > 0));
  assert((await image.getAttribute('srcset')).includes('webp'));
  const payload = await page.evaluate(() => window.buildWechatRichText());
  // 2026-10-13 起公众号复制改为 base64 内嵌图片（data URI），不再引用
  // _content-images URL；断言跟着改为验证图片已内嵌进富文本。
  assert(payload.html.includes('data:image/') || payload.html.includes('https://physics.example/_content-images/'));
  assert(payload.html.includes('https://physics.example/blog/'));
  assert(!payload.html.includes('srcset=') && !payload.html.includes('onclick=') && !payload.html.includes('<button'));
  assert(payload.text.includes('布满小点的纸'));
  // 公式里的分数必须保留竖式结构：inline-block 容器 + 分子带分数线。
  // 公众号网页编辑器的粘贴清洗器会剥掉 flex 系样式（inline-flex /
  // flex-direction 粘贴后消失，分子分母变左右并排），所以复制实现刻意
  // 用 inline-block 方案，此处断言防止有人改回 flex（2026-10-13 修复）。
  // 另外公众号粘贴会剥掉 div 标签本身：公式块外层 div 上的居中/字体全丢，
  // 所以每个公式行必须有自带完整样式（衬线+居中）的 p 承载（2026-10-13
  // 第二次修复：公式不居中、字体不统一的根因）。
  {
    const body = await page.goto(`${hosting.origin}/blog/smoke-1/`).then(() => page.evaluate(() => window.buildWechatRichText()));
    assert(body.html.includes('x₁ + x₂'), '公式内容应进入复制结果');
    assert(body.html.includes('display:inline-block'), '分数容器必须用粘贴安全的 inline-block');
    assert(!body.html.includes('inline-flex'), '分数容器禁止用 flex 系（公众号粘贴会被洗掉）');
    assert(/border-bottom:[^;"]*solid\s+(#|rgb)/.test(body.html), '分数线必须是具体色值，禁止 currentColor');
    {
      const blocks = body.html.match(/<div[^>]*Times New Roman[^>]*>[\s\S]*?<\/div>/g) || [];
      assert(blocks.length > 0, '应存在衬线公式块');
      for (const block of blocks) {
        const inner = block.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');
        const bare = inner.replace(/<p style="[^"]*">[\s\S]*?<\/p>/g, '').replace(/<[^>]+>/g, '').trim();
        assert(!bare, `公式块内容必须全部由带样式 p 承载，发现裸露: ${bare.slice(0, 30)}`);
        const carriers = inner.match(/<p style="([^"]*)">/g) || [];
        assert(carriers.length > 0, '公式块内必须有载体 p');
        for (const carrier of carriers) {
          assert(carrier.includes('Times') || carrier.includes('Songti') || carrier.includes('SimSun'), '载体 p 必须自带衬线字体');
          assert(carrier.includes('text-align:center'), '载体 p 必须自带居中');
        }
      }
    }
    // 根号回归断言（2026-10-14 原老师反馈）：根号必须是结构化 span（符号 +
    // 上划线盖住整个被开方数），不能是裸 √ 字符 + 括号；根号下的分数与
    // 外部一致用竖式（inline-block + 块级分子分母 + 具体色值分数线）。
    assert(!body.html.includes('√('), '禁止裸 √( 括号写法，根号必须结构化');
    {
      // 富文本里 class 已摘除，改从样式签名断言：被开方数 span 带 border-top（根号上划线）
      const radicalBodies = body.html.match(/<span style="display:inline-block;border-top:2px solid [^"]*">[\s\S]*?<\/span>/g) || [];
      assert(radicalBodies.length > 0, '根号被开方数必须带 border-top 上划线（具体色值）');
      // 根号内分数：border-top（根号）内部应包含 border-bottom（分数线）的竖式分数
      const hasFracInRadical = radicalBodies.some((radicalBody) => radicalBody.includes('border-bottom'));
      assert(hasFracInRadical, '根号内的分数必须沿用竖式（分子带 border-bottom 分数线）');
    }
    await page.goto(hosting.origin + '/blog/paper-tape-analysis/');
  }
  // 表格复制校验：公众号编辑器里表格列宽必须固定，防止被粘贴清洗器压扁。
  {
    const tableBody = await page.goto(`${hosting.origin}/blog/smoke-2/`).then(() => page.evaluate(() => window.buildWechatRichText()));
    assert(tableBody.html.includes('table-layout: fixed') || tableBody.html.includes('table-layout:fixed'), '表格必须带固定布局');
    await page.goto(hosting.origin + '/blog/paper-tape-analysis/');
  }
  // 「一键复制」与「逐张复制图片」两个按钮共用 wechat-copy-button 类，需按文字精确定位。
  const wechatMainCopy = page.getByRole('button', { name: '复制到公众号' });
  await wechatMainCopy.click();
  await page.waitForFunction(() => window.__clipboard.at(-1)?.['text/html']?.includes('布满小点的纸'));
  assert((await page.evaluate(() => window.__clipboard.at(-1)['text/html'])).includes('布满小点的纸'));
  await page.locator('button.share-button').click();
  assert((await page.evaluate(() => window.__clipboard.at(-1).text)).includes('https://physics.example/blog/paper-tape-analysis/'));

  const select = async (selector) => {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    // Selection starts after scrolling settles, as it does for a reader.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate((selector) => {
      const element = document.querySelector(selector), range = document.createRange();
      range.selectNodeContents(element); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    }, selector);
    await page.locator('.selection-share-toolbar').waitFor({ state: 'visible' });
  };
  await select('.article-content p');
  await page.locator('[data-selection-action="copy"]').click();
  assert((await page.evaluate(() => window.__clipboard.at(-1).text)).includes('丢分'));
  await select('.article-content p');
  await page.locator('[data-selection-action="quote"]').click();
  await page.waitForFunction(() => window.__clipboard.at(-1)?.['text/plain']?.includes('出处：'));
  assert((await page.evaluate(() => window.__clipboard.at(-1)['text/plain'])).includes('出处：'));
  // 代码块选区不弹引用/卡片：用带代码块的 fixture 验证（站点文章当前均无代码块）。
  await page.goto(`${hosting.origin}/blog/smoke-2/`);
  await select('.article-content pre code');
  await page.locator('[data-selection-action="quote"]').waitFor({ state: 'hidden' });
  assert(await page.locator('[data-selection-action="quote"]').isHidden());
  assert(await page.locator('[data-selection-action="card"]').isHidden());
  await select('.article-content p');
  await page.locator('[data-selection-action="card"]').click();
  await page.locator('.share-card-dialog').waitFor({ state: 'visible' });
  await page.locator('[data-card-action="copy"]').click();
  await page.waitForFunction(() => window.__clipboard.at(-1)?.['image/png'] > 1000);
  assert((await page.evaluate(() => window.__clipboard.at(-1)['image/png'])) > 1000);
  const download = page.waitForEvent('download');
  await page.locator('[data-card-action="download"]').click();
  const png = await download; await png.saveAs(resolve(temporary, 'quote.png'));
  const metadata = await sharp(resolve(temporary, 'quote.png')).metadata();
  assert.equal(metadata.width, 1080); assert.equal(metadata.height, 1440);
  await mkdir(resolve(root, '.checks'), { recursive: true });
  await page.screenshot({ path: resolve(root, '.checks/quote-card.png') });
  await page.locator('[data-card-close]').click();
  await page.waitForFunction(() => document.body.style.overflow === '');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');

  // Real browser fallback path with execCommand intercepted to keep OS clipboard untouched.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    document.execCommand = (command) => { window.__fallbackUsed = command; return true; };
  });
  await wechatMainCopy.click();
  assert.equal(await page.evaluate(() => window.__fallbackUsed), 'copy');
  assert.equal(await page.locator('[contenteditable]').count(), 0);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const path of ['/', '/blog/', '/blog/paper-tape-analysis/', '/materials/']) {
      await page.goto(hosting.origin + path); await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${path} @ ${width}`);
      await page.screenshot({ path: resolve(root, `.checks/${width}-${path === '/' ? 'home' : path.includes('paper-tape') ? 'article' : path.includes('materials') ? 'materials' : 'blog'}.png`), fullPage: true });
    }
  }
  await page.locator('.menu-toggle').click(); assert(await page.locator('.site-links').isVisible());
  await page.locator('.site-links a').filter({ hasText: '首页' }).click();
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  await page.goto(hosting.origin + '/blog/private-fixture/'); assert.equal((await page.title()).includes('页面不存在'), true);
  assert.deepEqual(failed, []);
  console.log('PASS: Markdown links, draft privacy, adjacent links, search/tags/pagination, clipboard and quote PNG, theme, portraits, material search/filter/preview/download/copy, desktop/mobile and no browser errors.');
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(temporary, { recursive: true, force: true });
}
