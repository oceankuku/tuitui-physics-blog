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
  // 单位黑名单：避免把 m/s、km/h、kg/m³ 等单位的斜杠误当成分数转竖式。
  const UNIT_TOKENS = new Set(['m', 's', 'h', 'km', 'kg', 'cm', 'mm', 'nm', 'N', 'J', 'W', 'C', 'A', 'V', 'Pa', 'Hz', 'K', 'min', 'g', 'mg', 'mol', 'L', 'mL', 'Ω', 'T', 'rad', 'rev', 'dB', '°C']);
  const stripSuperSub = (t) => t.replace(/[₀-₉²³⁰¹⁴⁵⁶⁷⁸⁹]/g, '');
  // 数学原子：数字(带上下标)、单字母(带下标)、括号组、√()、√token。
  // 注意：数字重复类必须同时包含 ASCII 数字 0-9 与下标数字 ₀₉²³，否则
  // 「20/10」会被拆成 2 + 0/1 + 0（只认了 2 和 1，漏掉 ASCII 的 0），
  // 分数渲染错位。这里用 [0-9₀-₉²³]* 同时覆盖两类数字。
  const ATOM = '(?:\\d[0-9₀-₉²³]*[A-Za-zα-ωΔ]?|[A-Za-zα-ωΔ][₀-₉²³]*|√\\([^)]*\\)|√[0-9A-Za-zα-ωΔ₀-₉²³]+|\\([^)]*\\))';
  const isUnit = (tok) => UNIT_TOKENS.has(stripSuperSub(tok));

  // 内联公式统一渲染为「HTML 字符串节点」（type:'html'，交由 rehype-raw 解析
  // 为真实 <span>），而不是 mdast 节点——因为 remark 阶段处理的是 mdast，把
  // 自定义 <span> 作为「段落内的行内子节点」插回去时，mdast 没有内联元素节点
  // 类型：用 element 节点会被 mdast-util-to-hast 当成未知节点退化为 <div> 并
  // 丢 class；用 paragraph+hName 节点又会触发「Cannot compile paragraph node」
  // （块级节点不能嵌在行内上下文）。只有 html 节点 + rehype-raw 能在正文/答案/
  // 备注/公式块内任意嵌套地还原出带 class 的 <span>（含根号里套竖式分数、分数
  // 里套根号），且与 [slug].astro 复制管线按 class 抓取完全兼容。
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const spanHTML = (cls, inner) => `<span class="${cls}">${inner}</span>`;
  const SYM = '√';
  // 根号 HTML：symbol 是 √ 字符，被开方数由 formula-radical-body 承载，其 CSS
  // 上边线即根号横线（vinculum）。被开方数含竖式分数时加 formula-radical-tall
  // （高根号：复制管线切立骨画法，见 [slug].astro）。
  const radicalHTML = (radicandHTML) => {
    const tall = radicandHTML.includes('class="formula-frac"');
    const cls = tall ? 'formula-radical formula-radical-tall' : 'formula-radical';
    return spanHTML(cls, spanHTML('formula-radical-symbol', SYM) + spanHTML('formula-radical-body', radicandHTML));
  };
  // 竖式分数：分子(.num) + 分母(.den)。分子分母先经 parseMath，使 1/√6 的分母
  // 自动渲染成根号、2L/(g·sin²θ) 的分母保留括号组。
  const fracHTML = (numHTML, denHTML) => spanHTML('formula-frac', spanHTML('num', numHTML) + spanHTML('den', denHTML));

  // 递归把一段文本转成内联 HTML 字符串：√(...) → √token → {a/b} → 裸斜杠分数
  // （安全子集）。始终返回字符串，正文/答案/备注/公式块内统一生效。
  const parseSlash = (value) => {
    // 局部正则：每次调用新建一个带 g 标志的正则对象，lastIndex 互不干扰，
    // 避免嵌套递归（parseSlash→parseMath→parseSlash）共享同一 lastIndex
    // 导致复位、重复匹配同一子串、陷入死循环并耗尽内存（历史 OOM 根因）。
    const SLASH_FRAC = new RegExp('(' + ATOM + ')\\s*/\\s*(' + ATOM + ')', 'g');
    SLASH_FRAC.lastIndex = 0;
    let out = '';
    let last = 0;
    let m;
    while ((m = SLASH_FRAC.exec(value))) {
      const [full, num, den] = m;
      if (isUnit(num) || isUnit(den)) {
        // 单位斜杠（m/s、km/h、kg/m³）保留原样，仅作为文本输出并转义。
        out += esc(value.slice(last, m.index + full.length));
        last = m.index + full.length;
        continue;
      }
      out += esc(value.slice(last, m.index));
      out += fracHTML(parseMath(num), parseMath(den));
      last = m.index + full.length;
    }
    out += esc(value.slice(last));
    return out;
  };
  const parseBrace = (value) => {
    const bSplit = String(value).split(/(\{[^{}]*\/[^{}]*\})/g).filter(Boolean);
    if (bSplit.length > 1) {
      return bSplit.map((part) => {
        const m = part.match(/^\{([^{}]*?)\/([^{}]*)\}$/);
        if (m) return fracHTML(parseMath(m[1]), parseMath(m[2]));
        return parseSlash(part);
      }).join('');
    }
    return parseSlash(value);
  };
  const parseRest = (value) => {
    // 裸根号 √token（如 √2、√h、√g 这类无括号简写也渲染成根号）。
    const tokSplit = String(value).split(/(√[0-9A-Za-zα-ωΔ₀-₉²³]+)/g).filter(Boolean);
    if (tokSplit.length > 1) {
      return tokSplit.map((part) => {
        const m = part.match(/^√([0-9A-Za-zα-ωΔ₀-₉²³]+)$/);
        if (m) return radicalHTML(esc(m[1]));
        return parseBrace(part);
      }).join('');
    }
    return parseBrace(value);
  };
  const parseMath = (value) => {
    // 1) 带括号根号 √(...)
    const radSplit = String(value).split(/(√\([^()]*(?:\([^()]*\)[^()]*)*\))/g).filter(Boolean);
    if (radSplit.length > 1) {
      return radSplit.map((part) => {
        const m = part.match(/^√\(([\s\S]*)\)$/);
        if (m) return radicalHTML(parseMath(m[1]));
        return parseRest(part);
      }).join('');
    }
    return parseRest(value);
  };

  // 选择题选项自动分段（2026-10-15 原老师反馈"选项没写工整"）。
  const optionLine = /^([A-F])[.、．]\s*/;
  const splitOptionLines = (node) => {
    if (node.type !== 'paragraph' || node.data?.hName) return [node];
    const lines = node.children?.every((child) => child.type === 'text') ? node.children.flatMap((child) => String(child.value).split('\n')) : null;
    if (!lines) return [node];
    const groups = [[]];
    for (const line of lines) {
      if (optionLine.test(line.trim()) && groups.length) groups.push([]);
      groups.at(-1).push(line);
    }
    if (groups.length <= 1) return [node];
    return groups.map((group) => ({
      type: 'paragraph',
      children: [{ type: 'text', value: group.join('\n') }],
      position: node.position,
    }));
  };
  const applyOptionSplit = (node) => {
    if (!node.children?.length) return;
    node.children = node.children.flatMap(splitOptionLines);
    node.children.forEach(applyOptionSplit);
  };

  // 收集一个节点下全部文本（含后代），用于判断 :::formula 块是否为 LaTeX。
  const collectText = (node) => {
    if (node.type === 'text') return node.value;
    if (!node.children) return '';
    return node.children.map(collectText).join('');
  };

  return async (tree) => {
    // 选项分段先于数学解析：题干/答案卡与正文里的选择题选项先拆成独立段落。
    applyOptionSplit(tree);
    const visitAny = (node) => {
      // 四类围栏容器：formula 转 div.formula-block，其余转白名单 blockquote。
      if (node.type === 'containerDirective' && node.name === 'formula') {
        node.data ??= {};
        const raw = collectText(node);
        // LaTeX 判定：含反斜杠命令（\frac 等）、$ 定界符、或 LaTeX 下标
        // 标记（v_0、x_max 这类裸下标，2026-10-23 修复——全站 MathJax 化后
        // 公式块可能只有下标没有命令）。旧语法 {a/b}、√( ) 不含这些特征。
        if (/([\\$])|([A-Za-zΔα-ω]_[A-Za-z0-9{])/.test(raw)) {
          // LaTeX 公式：交给 MathJax 自动排版（文章页加载时扫描 $$...$$ / $...$）。
          // 每个公式段独立包 $$...$$：块内多段（公式间空行）各自成为独立的
          // 显示容器——若合并进同一 $$，换行只是空白，两个公式会连排成一行
          // （2026-10-23 修复，smoke-5 抓到）。
          const lines = node.children
            .map((child) => collectText(child).trim())
            .filter(Boolean);
          node.data.hName = 'div';
          node.data.hProperties = { className: ['mathjax-display'] };
          node.children = [{ type: 'paragraph', children: [{ type: 'text', value: lines.map((line) => `$$\n${line}\n$$`).join('\n\n') }] }];
        } else {
          node.data.hName = 'div';
          node.data.hProperties = { className: ['formula-block'] };
        }
      } else if (node.type === 'containerDirective' && node.name === 'problem') {
        node.data ??= {}; node.data.hName = 'blockquote'; node.data.hProperties = { className: ['problem-card'] };
      } else if (node.type === 'containerDirective' && node.name === 'answer') {
        node.data ??= {}; node.data.hName = 'blockquote'; node.data.hProperties = { className: ['answer-card'] };
      } else if (node.type === 'containerDirective' && node.name === 'note') {
        node.data ??= {}; node.data.hName = 'blockquote'; node.data.hProperties = { className: ['note-card'] };
      } else if (node.type === 'containerDirective' && node.name === 'usage') {
        // 用法与分层说明等元信息：小字号、淡色，弱于正文（2026-10-25 站主要求）。
        node.data ??= {}; node.data.hName = 'div'; node.data.hProperties = { className: ['usage-note'] };
      }
      // 每个文本子节点都做数学解析：√( )、√token、{a/b}、裸斜杠分数，
      // 正文/答案/备注/公式块内统一渲染，不再局限于 :::formula 块。
      // 仅当本段确实含公式结构时换成 html 节点（交由 rehype-raw 解析成
      // 真实 <span>）；纯文本保持原样，避免把含 < > & 的普通文字无故转成
      // html 节点（不等式 1 < t₂/t₁ < 2 里的 < 会在 html 串里被转义）。
      if (node.children) {
        node.children = node.children.map((child) => {
          if (child.type === 'text') {
            // 含 $ 的文本是 MathJax 行内公式（$...$），保留原样交给 MathJax
            // 自动排版，不走旧版 {a/b}/√( ) 解析（否则会破坏 LaTeX 语法）。
            if (child.value.includes('$')) return child;
            const html = parseMath(child.value);
            if (/class="formula-(frac|radical)/.test(html)) {
              return { type: 'html', value: html };
            }
            return child;
          }
          return child;
        });
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
// 表格工整性被破坏。站点正文使用 :::formula 与 :::problem 两种容器指令，
// 其余 text/leaf 指令一律视为误触发，按源文本（position 精确切片）原样
// 还原，保证以后写 1:2:3、1:√2:√3 这类比例不再踩坑。
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
