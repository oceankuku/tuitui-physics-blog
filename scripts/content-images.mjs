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
  // 被开方数含竖式分数时加 formula-radical-tall（高根号立骨构造 2026-10-18）：
  // √ 字形只有一行高，够不到两行高的上划线，页面 CSS 与公众号复制管线
  // 都按此标记切换成「√ 沉底 + 被开方数左边线立骨」的画法。
  const radicalNode = (radicandParts) => {
    const isTall = radicandParts.some((part) => part.type === 'element' && (part.properties?.className ?? []).includes('formula-frac'));
    return {
      type: 'paragraph',
      data: {
        hName: 'span',
        hProperties: { className: isTall ? ['formula-radical', 'formula-radical-tall'] : ['formula-radical'] },
        hChildren: [
          { type: 'element', tagName: 'span', properties: { className: ['formula-radical-symbol'] }, children: [{ type: 'text', value: '√' }] },
          { type: 'element', tagName: 'span', properties: { className: ['formula-radical-body'] }, children: radicandParts },
        ],
      },
      children: [],
    };
  };
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
  // 选择题选项自动分段（2026-10-15 原老师反馈"选项没写工整"）。markdown
  // 软换行会把「A. …」到「D. …」合并进同一个 <p>，渲染成挤成一坨的一行。
  // 这里把段落文本按行扫描：以 A./B./C./D./E./F. 开头的选项行各自拆成独立
  // 段落，写作时一行一个选项即可，不依赖行尾双空格。仅处理普通文本节点，
  // 不碰加粗/链接等富文本（选项行通常是纯文本）。
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
  return async (tree) => {
    // 选项分段先于所有节点处理：题干/答案卡与正文里的选择题选项统一在
    // 此拆成独立段落（2026-10-15 原老师反馈"选项没写工整"），写一行一个
    // 选项即可，后续 formula 分数转换拿到的是已分段的结构。
    applyOptionSplit(tree);
    const visitAny = (node) => {
      if (node.type === 'containerDirective' && node.name === 'formula') {
        node.data ??= {};
        node.data.hName = 'div';
        node.data.hProperties = { className: ['formula-block'] };
        node.children = node.children.flatMap(transformNode);
        return;
      }
      // 例题/练习题干卡片（2026-10-18 原老师要求：例题字体要和正文区分）。
      // 渲染成 blockquote.problem-card：blockquote 在微信粘贴白名单里，
      // 复制管线零改动；卡片内字号缩一档、楷体，与正文视觉分离。
      if (node.type === 'containerDirective' && node.name === 'problem') {
        node.data ??= {};
        node.data.hName = 'blockquote';
        node.data.hProperties = { className: ['problem-card'] };
        return;
      }
      // 答案+解析卡片（2026-10-18 原老师要求：答案也用题目同款字体格式）。
      // 同走 blockquote 白名单载体，绿色系区分题干（答案底色偏绿、题干偏灰）。
      if (node.type === 'containerDirective' && node.name === 'answer') {
        node.data ??= {};
        node.data.hName = 'blockquote';
        node.data.hProperties = { className: ['answer-card'] };
        return;
      }
      // 备注/深度理解提示卡（2026-10-18 原老师要求：给有深度理解的内容
      // 一个醒目去处）。琥珀色左边线 + 浅底，与题干/答案三色分明。
      if (node.type === 'containerDirective' && node.name === 'note') {
        node.data ??= {};
        node.data.hName = 'blockquote';
        node.data.hProperties = { className: ['note-card'] };
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
