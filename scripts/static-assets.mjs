import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { cp, mkdir, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

// Astro bundles page imports before prerendering, so import.meta.url would
// point into its temporary output. npm scripts run from the project root.
const root = process.cwd();
const publicDir = resolve(root, 'public');
const cache = resolve(root, 'node_modules/.cache/static-asset-previews');
const extensions = /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i;

// 素材库本机管理（上传/改名/删除）写入的登记表，覆盖内置 labels。
const customLabelsFile = resolve(root, 'scripts', 'asset-labels.json');
let customLabels = {};
if (existsSync(customLabelsFile)) {
  try { customLabels = JSON.parse(readFileSync(customLabelsFile, 'utf8')); } catch { customLabels = {}; }
}
const labels = {
  'teacher-desk-tired.png': ['桌前歇一会儿', '手绘物理老师坐在课桌前，一手托腮，一手拿粉笔'],
  'teacher-thinking.png': ['想一想', '手绘物理老师站立思考，一手靠近下巴'],
  'teacher-book-explain.png': ['翻开课本', '穿针织衫的手绘物理老师拿着书本讲解'],
  'teacher-board-write.png': ['板书讲解', '穿马甲的手绘物理老师抬手拿粉笔讲解'],
  'teacher-pointing-v2.png': ['指一指重点', '手绘物理老师抬起一只手指向旁边'],
  'teacher-corrective.png': ['纠错提醒', '手绘物理老师抬手提醒，另一只手叉腰'],
  'teacher-approved.png': ['答对了', '手绘物理老师抬起一只手作确认手势'],
  'teacher-lab-cart.png': ['小车实验', '穿实验服的手绘物理老师拿着实验小车'],
  'teacher-encourage.png': ['给点鼓励', '穿灰毛衣的手绘物理老师双手握拳作鼓励动作'],
  'teacher-analyze-card.png': ['审题分析', '穿连帽衫的手绘物理老师拿着分析卡片思考'],
  'teacher-stop-correct.png': ['先停一下', '穿双排扣外套的手绘物理老师举手提醒'],
  'teacher-tablet-intro.png': ['新课导入', '穿风衣的手绘物理老师拿着平板指向旁边'],
  'teacher-reference.png': ['老师角色参考', '包含九种课堂情境和老师动作的角色参考图'],
  'teacher-avatar-source.png': ['头像原图', '圆形边框内的手绘物理老师头像原图'],
  'teacher-avatar.png': ['课件头像', '手绘物理老师的圆形头像'],
  'logo-source.png': ['头像原图', '圆形边框内的手绘物理老师头像原图'],
  'logo.png': ['站点 Logo', '本站使用的圆形手绘物理老师头像'],
  'og-default.png': ['站点分享封面', '颓颓的物理碎碎念分享封面，包含站名、高中物理文字与老师头像'],
  'apple-touch-icon.png': ['Apple 图标', '用于 Apple 设备的手绘物理老师头像图标'],
  'favicon-16.png': ['16px 网站图标', '16 像素的物理老师头像网站图标'],
  'favicon-32.png': ['32px 网站图标', '32 像素的物理老师头像网站图标'],
  'favicon.ico': ['多尺寸网站图标', '包含多个尺寸的物理老师头像网站图标'],
  'course-favicon.png': ['课件网站图标', '动态课件使用的物理老师头像网站图标'],
  'atlas.png': ['铁路像素图集', '像素风格的火车、站房、树和站台组合图集'],
  'colormap.png': ['模型配色纹理', '火车模型使用的颜色纹理图'],
  "11-linear-acceleration.png": ["11 · 匀变速直线运动", "手绘物理老师调节直轨上的实验小车，桌上有打点计时器与纸带"],
  "12-momentum-collision.png": ["12 · 动量与碰撞", "手绘物理老师手持秒表观察同一轨道上的两辆实验小车"],
  "13-universal-gravitation.png": ["13 · 万有引力", "手绘物理老师坐在地球仪旁，双手拿着卫星模型演示"],
  "14-simple-harmonic-motion.png": ["14 · 简谐运动", "手绘物理老师托腮拿笔记录，桌上弹簧悬挂着砝码，旁边有刻度尺"],
  "15-resonance.png": ["15 · 共振", "手绘物理老师手持橡胶锤演示两组音叉与共鸣箱"],
  "16-gas-pressure.png": ["16 · 气体与压强", "手绘物理老师俯身侧看刻度，双手操作连接压力表的气体注射器"],
  "17-heat-transfer.png": ["17 · 热传递", "手绘物理老师侧坐在实验凳上，一手写记录，一手拿着烧杯中的温度计"],
  "18-capacitors.png": ["18 · 电容器", "手绘物理老师侧身双手调整平行金属板的支架旋钮，桌上有电表与电池"],
  "19-alternating-current.png": ["19 · 交流电与变压器", "手绘物理老师蹲在实验推车旁，拿着探头调节显示正弦波的示波器"],
  "20-photoelectric-effect.png": ["20 · 光电效应", "手绘物理老师侧身抬手讲解光电效应板书，另一手拿讲义，桌上有演示装置"],
  '01-force-analysis.png': ['01 · 受力分析', '手绘物理老师在斜面与木块装置旁讲解，完整课堂场景'],
  '02-projectile-motion.png': ['02 · 平抛运动', '手绘物理老师在小球平抛演示装置旁观察，完整课堂场景'],
  '03-circular-motion.png': ['03 · 圆周运动', '手绘物理老师托腮观察环形轨道上的小球，完整课堂场景'],
  '04-mechanical-energy.png': ['04 · 机械能', '手绘物理老师拿着单摆摆球演示运动，桌上有书本与弹簧，完整课堂场景'],
  '05-electric-field.png': ['05 · 电场', '手绘物理老师拿指示棒讲解金属球电极，背景有电场线主题板书，完整课堂场景'],
  '06-electric-circuits.png': ['06 · 电路实验', '手绘物理老师拿着书本指向电路开关，桌上小灯泡亮起，完整课堂场景'],
  '07-magnetic-field.png': ['07 · 磁场', '手绘物理老师观察条形磁铁周围的铁屑分布，桌上放着指南针，完整课堂场景'],
  '08-electromagnetic-induction.png': ['08 · 电磁感应', '手绘物理老师在接有模拟电表的线圈旁拿着条形磁铁，完整课堂场景'],
  '09-mechanical-waves.png': ['09 · 机械波', '手绘物理老师手持绳子一端演示绳上的波动，完整课堂场景'],
  '10-geometrical-optics.png': ['10 · 光学', '手绘物理老师观察光具座上的光源、透镜与屏幕，桌上有三棱镜，完整课堂场景'],
  // 文章配图（public/blog-images/）：标题带文章与主题关键词，描述写清装置与考点，方便写稿时搜索定位。
  'teacher-board-write.png': ['板书讲解 · 站点示例图', '手绘物理老师在黑板前写板书讲解；demo 示例文章插图，也可用作通用课堂开场图'],
  'equal-time-velocity-change.png': ['匀变速 · 等时速度变化情境', '情境引入图：相同时间间隔内速度变化量相同，对应匀变速"加速度恒定"的定义；匀变速直线运动文章插图，适用概念引入、匀变速判断'],
  'cart-tape-acceleration.png': ['匀变速 · 小车加速打点实验', '小车拖着纸带经打点计时器做加速运动，点间距逐渐增大；匀变速直线运动文章插图，适用匀加速判断、纸带点距分析'],
  'vt-graph-slope-intersection.png': ['匀变速 · v-t 图像斜率与交点', 'v-t 图像标注斜率与交点：斜率是加速度，交点是速度相等的时刻；匀变速直线运动文章插图，适用图像四要点、追及临界、最大距离'],
  'newton-tube-freefall.png': ['匀变速 · 牛顿管真空对比', '牛顿管演示羽毛与金属片在真空和充气两种情况下下落对比；匀变速直线运动文章插图，适用自由落体、无空气阻力条件'],
  'braking-stop-model.png': ['匀变速 · 刹车停止问题模型', '汽车刹车到停止的问题模型示意，标注初速度、加速度与停车时间；匀变速直线运动文章插图，适用刹车陷阱、停车时间、不能倒车'],
  'braking-segment-analysis.png': ['匀变速 · 刹车分段分析', '刹车题分段分析：停车时间之前正常代公式，之后按静止处理；匀变速直线运动文章插图，适用刹车位移、6 秒陷阱、错误解法对照'],
  'chase-equal-velocity.png': ['匀变速 · 同向追及条件图', '同向追及问题模型：速度相等时距离最大，位移相等时追上；匀变速直线运动文章插图，适用追及相遇、临界条件、v-t 面积法'],
  'timer-setup.png': ['纸带 · 打点计时器装置', '电磁打点计时器固定在桌上，纸带穿限位孔，黑板板书打点周期 T = 1/f = 0.02 s；纸带问题文章插图，适用打点计时器、计时器、纸带实验场景'],
  'tape-dots-closeup.png': ['纸带 · 点迹放大图', '放大看纸带上的点迹，点间距逐渐增大，标注计数点选取；纸带问题文章插图，适用数间隔、定计数点、逐差法起点讲解'],
  'freefall-setup.png': ['纸带 · 自由落体测 g 装置', '重物拖着纸带经打点计时器自由下落，铁架台固定，测重力加速度 g 的实验装置；纸带问题文章插图，适用自由落体、测 g 实验'],
  'freefall-analysis.png': ['纸带 · 点距均匀增大分析', '纸带上相邻点间距从上到下均匀增大，说明重物做匀加速直线运动；纸带问题文章插图，适用匀加速判断、点距分析'],
  'vt-graph.png': ['纸带 · v-t 图像处理数据', 'v-t 直角坐标系中描点连线成直线，斜率即加速度；纸带问题文章插图，适用数据处理、图像法、逐差法收尾'],
  'cart-passing-photogate.png': ['光电门 · 小车过门瞬间', '小车顶部装挡光片正要穿过光电门，轨道上双光电门布局；光电门文章插图，适用挡光片、测速装置讲解'],
  'timer-reading.png': ['光电门 · 计时器读数', '数字计时器显示挡光时间 0.020 秒，配合挡光片宽度求瞬时速度；光电门文章插图，适用挡光时间、测瞬时速度'],
  'double-gate-setup.png': ['光电门 · 双门测加速度装置', '轨道上前后两个光电门测同一小车速度，公式推导双门法测加速度；光电门文章插图，适用测加速度、双光电门组合'],
  'data-analysis.png': ['光电门 · v-t 数据处理', '用 v-t 图像处理两组光电门数据求斜率，与纸带数据法相通；光电门文章插图，适用数据处理、图像法、实验题收尾'],
  'two-balls-land-together.png': ['平抛 · 双球同时落地对比', '平抛小球与自由落体小球同高同时释放，同时落进沙槽，证明平抛竖直分运动是自由落体；平抛文章插图，适用对比实验、同时落地'],
  'decomposition-principle.png': ['平抛 · 运动分解原理', '平抛运动分解示意：水平方向匀速直线，竖直方向自由落体，速度矢量标注；平抛文章插图，适用运动分解、分运动合成'],
  'principle-diagram.png': ['平抛 · 同高同时释放原理图', '两球同高、被同一装置同时释放的原理示意图，对照实验设计；平抛文章插图，适用实验原理、对照实验'],
  'trajectory-observation.png': ['平抛 · 描点法轨迹观察', '用描点法记录并观察平抛运动轨迹，轨迹为抛物线；平抛文章插图，适用轨迹描绘、抛物线、描点法'],
  // 自由落体文章配图（public/blog-images/free-fall-motion/）：标题带文章与主题关键词，描述写清装置与考点。
  'coin-paper-drop.png': ['自由落体 · 硬币与纸片下落对比', '硬币与纸片在空气中同时释放下落，纸片飘落、硬币先落地的对比实验；自由落体文章插图，适用空气阻力影响、轻重物体下落快慢引入'],
  'newton-tube-vacuum.png': ['自由落体 · 牛顿管真空实验', '牛顿管演示装置：管内硬币与羽毛，抽气前后下落对比，真空中共速下落；自由落体文章插图，适用牛顿管、真空无阻力、伽利略观点'],
  'freefall-tape-measure-g.png': ['自由落体 · 纸带测 g 装置', '重物拖纸带穿过打点计时器自由下落测重力加速度 g 的实验装置；自由落体文章插图，适用测 g 实验、纸带、逐差法'],
  'freefall-timer-experiment.png': ['自由落体 · 计时实验释放瞬间', '砝码与纸带在打点计时器下准备释放的计时实验场景；自由落体文章插图，适用实验操作、释放瞬间、打点计时'],
  'basketball-jump-h-quarters.png': ['自由落体 · 起跳 H 四等分示意', '起跳扣篮重心上升最大高度 H 按 H/4 四等分的示意图，标出第一段 t₁ 与第四段 t₂；自由落体文章插图，适用 2019 全国Ⅰ卷真题、逆向思维、比例关系'],
  'cesium-clock-vt-at-options.png': ['自由落体 · 铯原子钟四选项图像', '2023 广东卷铯原子喷泉钟四选项示意：A/B 为 v-t 图、C/D 为 a-t 图，D 为横轴下方 a = −g 水平直线（正确答案）；自由落体文章插图，适用 v-t 与 a-t 图像、方向正负、恒定加速度'],
  // 追及相遇文章配图（public/blog-images/chase-meet/）：标题带文章与主题关键词，描述写清装置与考点。
  'chase-model.png': ['追及相遇 · 同向追及模型', '同向追及问题模型：后车乙追前方匀速甲车，标注初始距离 d₀ 与两条位移表达式；追及相遇文章插图，适用大位移方程、追上条件、追及建模'],
  'meet-model.png': ['追及相遇 · 反向相遇模型', '反向相遇问题模型：两车相向而行，标注初始距离与各自速度方向；追及相遇文章插图，适用相向而行、位移之和等于初始距离、相遇时间'],
  'meet-displacement.png': ['追及相遇 · 反向相遇位移关系', '反向相遇位移关系示意：两车位移之和恰好填满初始间距 d₀；追及相遇文章插图，适用位移之和方程、相遇点位置计算'],
  'twice-meet-model.png': ['追及相遇 · 二次相遇模型', '二次相遇问题模型：乙加速追上甲后刹车，甲反追，速度反转前后各相遇一次；追及相遇文章插图，适用分段列方程、第二次相遇、停车时间检验'],
  'twice-meet-gap.png': ['追及相遇 · 二次相遇位移差分析', '二次相遇位移差分析图：第一次相遇后拉开再缩小，标注两段面积关系；追及相遇文章插图，适用速度反转、相对位移、多解讨论'],
  'brake-multistage-model.png': ['追及相遇 · 多阶段刹车模型', '多阶段刹车问题模型：加速、匀速、刹车分段运动，标注各段位移与停车时间；追及相遇文章插图，适用分段处理、刹车陷阱、停车时间'],
  'brake-multistage-vt.png': ['追及相遇 · 多阶段刹车 v-t 图', '多阶段刹车的 v-t 图像：面积差即两车距离，标注速度相等时刻与面积抵平；追及相遇文章插图，适用 v-t 面积法、最大距离、图像判撞'],
  'vt-2018-options.png': ['追及相遇 · 2018 全国Ⅱ卷 v-t 真题图', '2018 全国Ⅱ卷第 19 题选项示意：甲乙两车 v-t 图像为两条交叉曲线，t₁ 与 t₂ 之间交叉一次，t₂ 时刻并排；追及相遇文章插图，适用 v-t 面积法、斜率判加速度、高考真题图像题'],
};

/** @param {string} directory @returns {Promise<string[]>} */
async function imagesIn(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await imagesIn(path));
    else if (entry.isFile() && extensions.test(entry.name)) result.push(path);
  }
  return result.sort();
}

/**
 * @typedef {{ id: string, title: string, alt: string, category: string, path: string,
 * aliases: string[], preview: string, width: number, height: number, bytes: number, format: string }} StaticAsset
 * @returns {Promise<StaticAsset[]>}
 */
export async function staticAssets() {
  const groups = [
    ['site-assets', '老师立绘'], ['brand', '品牌图标'],
    ['material-library', '教学素材'], ['blog-images', '文章配图'],
  ];
  const assets = [];
  const byHash = new Map();
  await mkdir(cache, { recursive: true });
  for (const [directory, defaultCategory] of groups) {
    const files = await imagesIn(resolve(publicDir, directory));
    if (directory === 'brand' && existsSync(resolve(publicDir, 'favicon.ico'))) files.push(resolve(publicDir, 'favicon.ico'));
    for (const file of files) {
      const input = await readFile(file);
      const hash = createHash('sha256').update(input).digest('hex');
      const path = '/' + file.slice(publicDir.length + 1).split('\\').join('/');
      if (byHash.has(hash)) { byHash.get(hash).aliases.push(path); continue; }
      const filename = file.split(/[\\/]/).at(-1);
      // ICO is a container; use its largest embedded PNG for the preview.
      let raster = input;
      if (filename.endsWith('.ico')) {
        const count = input.readUInt16LE(4);
        let best = 6;
        for (let i = 1; i < count; i++) {
          const entry = 6 + i * 16;
          if ((input[entry] || 256) > (input[best] || 256)) best = entry;
        }
        raster = input.subarray(input.readUInt32LE(best + 12), input.readUInt32LE(best + 12) + input.readUInt32LE(best + 8));
      }
      const meta = await sharp(raster).metadata();
      if (!meta.width || !meta.height) throw new Error(`Image has no dimensions: ${path}`);
      const rotate = [5, 6, 7, 8].includes(meta.orientation);
      const previewSize = path.includes('/hero-physics-') ? 960 : 480;
      const name = `${hash.slice(0, 20)}-${previewSize}-v1.webp`;
      if (!existsSync(resolve(cache, name))) await sharp(raster).rotate().resize({ width: previewSize, height: previewSize, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(resolve(cache, name));
      const category = path.includes('/hero-physics-') ? 'Hero 横图' : path.includes('/references/') ? '角色参考' : path.includes('/material-library/brand/') ? '品牌图标' : defaultCategory;
      const [fallbackTitle, fallbackAlt] = labels[filename] || [filename.replace(/\.[^.]+$/, ''), `图片素材：${filename}`];
      const [title, alt] = customLabels[path] || [fallbackTitle, fallbackAlt];
      const asset = { id: hash.slice(0, 20), title, alt, category, path, aliases: [path], preview: `/_asset-previews/${name}`, width: rotate ? meta.height : meta.width, height: rotate ? meta.width : meta.height, bytes: input.length, format: filename.split('.').at(-1).toUpperCase() };
      assets.push(asset); byHash.set(hash, asset);
    }
  }
  return assets;
}

export function staticAssetPreviews() {
  return {
    name: 'static-asset-previews',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => updateConfig({ vite: { plugins: [{
        name: 'static-asset-preview-dev',
        configureServer(server) {
          server.middlewares.use('/_asset-previews/', (req, res, next) => {
            const name = (req.url || '').split('?')[0].replace(/^\//, '');
            if (!/^[a-f0-9]{20}-(480|960)-v1\.webp$/.test(name) || !existsSync(resolve(cache, name))) return next();
            res.setHeader('Content-Type', 'image/webp');
            createReadStream(resolve(cache, name)).pipe(res);
          });
        },
      }] } }),
      'astro:build:done': async ({ dir }) => {
        if (existsSync(cache)) await cp(cache, new URL('_asset-previews/', dir), { recursive: true });
      },
    },
  };
}
