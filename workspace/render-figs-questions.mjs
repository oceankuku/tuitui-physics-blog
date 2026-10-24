import { chromium } from 'playwright';
import { resolve } from 'node:path';

const root = process.cwd();
const htmlPath = resolve(root, 'workspace/figs-questions.html');

const jobs = [
  // [选择器, 输出目录, 文件名]
  ['#fig-marble', 'k002-time-displacement', 'marble-throw-question.png'],
  ['#fig-xt-zaozhuang', 'k003-velocity', 'xt-segments-question.png'],
  ['#fig-rst', 'k003-velocity', 'bus-rst-question.png'],
  ['#fig-vt-seg', 'k004-acceleration', 'vt-segments-question.png'],
  ['#fig-vt-hebei', 'k005-velocity-time-formula', 'vt-2022-hebei-t3.png'],
  ['#fig-rst-2', 'k006-displacement-time-formula', 'bus-rst-question.png'],
  ['#fig-vt-2014', 'k006-displacement-time-formula', 'vt-2014-triangle.png'],
  ['#fig-cart-ball', 'k007-free-fall', 'cart-ball-2015-beijing.png'],
  ['#fig-dive', 'k007-free-fall', 'dive-10m-segments.png'],
  ['#fig-incline', 'k007-free-fall', 'incline-2021-jiaban-t18.png'],
  // 2026-10-23 图像专题与补图
  ['#fig-basketball-h4', 'k007-free-fall', 'basketball-jump-h-quarters.png'],
  ['#fig-basketball-h4', 'k006-displacement-time-formula', 'basketball-jump-h-quarters.png'],
  ['#fig-g331', 'k001-mass-point-reference-frame', 'g331-route-question.png'],
  ['#fig-g331', 'k003-velocity', 'g331-route-question.png'],
  ['#fig-graph-compare', 'motion-graphs', 'graph-compare.png'],
  ['#fig-graph-shapes', 'motion-graphs', 'graph-shapes.png'],
  ['#fig-graph-intersect', 'motion-graphs', 'graph-intersection.png'],
  ['#fig-brake-courtesy', 'motion-graphs', 'brake-courtesy-vt.png'],
  // 2026-10-24 第二章实验重构
  ['#fig-k007e-tape-mid', 'k007-experiments', 'fig-tape-midpoint.png'],
  ['#fig-k007e-tape-six', 'k007-experiments', 'fig-tape-six-segments.png'],
  ['#fig-k007e-photogate', 'k007-experiments', 'fig-photogate-double.png'],
  ['#fig-k007e-freefall', 'k007-experiments', 'fig-freefall-setup.png'],
  ['#fig-k007e-q3-direction', 'k007-experiments-practice', 'fig-q3-tape-direction.png'],
  ['#fig-k007e-q29-tilt', 'k007-experiments-practice', 'fig-q29-tilted-vane.png'],
  ['#fig-k007e-vt-fit', 'k007-experiments-methods', 'fig-vt-fit.png'],
];

// K006 的 RST 图复用 K003 同一张 SVG 源（选择器再渲染一份独立输出）
jobs[5][0] = '#fig-rst';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 });
await page.goto('file:///' + resolve(root, 'workspace/figs-questions.html').replace(/\\/g, '/'));
await page.waitForTimeout(300);

for (const [selector, dir, filename] of jobs) {
  const el = page.locator(selector);
  await el.screenshot({ path: resolve(root, 'public/blog-images', dir, filename) });
  console.log('saved', dir + '/' + filename);
}

await browser.close();
