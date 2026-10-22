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
  // 自由落体文章配图（public/blog-images/free-fall-motion/）：标题带文章与主题关键词，描述写清装置与考点。
  // 真题题图（补画原题含图）：题目"如图所示"的真题/改编题配图，供对应文章题目处引用。
  'marble-throw-question.png': ['时间位移 · 弹珠上抛题图', '小朋友把弹珠竖直向上抛出又落回手中的示意图：抛出点＝落回点，标出最高点与总路程 4 m；时间位移文章插图，适用长沙师大附中 T12、路程位移之差'],
  'xt-segments-question.png': ['速度 · 三段 x–t 题图', 'x–t 图像三段折线：0–2 s 匀速到 4 m、2–5 s 静止、5–8 s 匀速回到 0；速度文章插图，适用分段平均速度题（枣庄期中）'],
  'bus-rst-question.png': ['速度 · 公交 RST 三点题图', '公交车沿平直道路匀减速依次经过 R、S、T 三点的示意图，标注 RS 段与 ST 段；速度/位移公式文章插图，适用 2023 山东卷 T6 及同型题'],
  'vt-segments-question.png': ['加速度 · 分段 v–t 题图', '分段 v–t 图像：0–2 s 匀加速（4 到 10 m/s）、2–5 s 匀速、5–8 s 匀变速过零反向；加速度文章插图，适用分段加速度与方向判断题'],
  'vt-2022-hebei-t3.png': ['速度公式 · 2022 河北卷 T3 题图', '短跑运动员训练前后 v–t 图像：两线均从原点出发，0–t₁ 训练前更陡，t₁ 后训练后反超，t₃ 后训练前下降、训练后继续上升；速度公式文章插图，适用读图选择题'],
  'vt-2014-triangle.png': ['位移公式 · 先加后刹大三角形', '先 3 s 匀加速至 12 m/s 再 3 s 匀减速停车的 v–t 大三角形，面积＝总位移 36 m；位移公式文章插图，适用 2014 全国卷同型题、对称结构'],
  'cart-ball-2015-beijing.png': ['自由落体 · 小车卸球题图', '2015 北京卷装置示意：高 5 m 轨道上小车匀速行进，A 处卸球自由下落，B 处细线悬挂小球（离地 h），A、B 相距 2 m；自由落体文章插图，适用多物体时间对齐'],
  'dive-10m-segments.png': ['自由落体 · 10 m 跳台分段图', '10 米跳台示意：运动员倒立下落，前 5 m 完成技术动作、后 5 m 完成姿态调整，标注 5 m 分界线；自由落体文章插图，适用 2021 湖北卷 T2 分段计算'],
  'incline-2021-jiaban-t18.png': ['自由落体 · 斜面挡板题图', '2021 全国甲卷 T18 装置示意：光滑长平板架在横杆上、下端抵挡板，夹角 θ 可调，物块从 Q 点下滑，水平距离 L 固定；自由落体文章插图，适用倾角变化时间讨论'],
  // 追及相遇文章配图（public/blog-images/chase-meet/）：标题带文章与主题关键词，描述写清装置与考点。
  // 质点参考系文章配图（public/blog-images/k001-mass-point-reference-frame/）：标题带文章与主题关键词，描述写清装置与考点。
  'train-platform-reference-frame.png': ['质点参考系 · 列车与站台情境', '老师手持列车模型与站台模型讲解：乘客相对车厢静止、相对站台运动，描述运动先选参考系；质点参考系文章插图，适用参考系引入、运动描述的相对性'],
  'point-reference-frame-concepts.png': ['质点参考系 · 概念板书讲解', '板书讲解质点与参考系两个概念：质点是用有质量的点代替物体（形状大小影响可忽略时），参考系是描述运动时选作参考的物体；质点参考系文章插图，适用概念定义、判断标准'],
  'size-vs-motion-misconception.png': ['质点参考系 · 大小与运动状态易错对照', '易错辨析板书：物体大小不是判定质点的依据，关键看形状大小对所研究问题的影响能否忽略；质点参考系文章插图，适用误区清理、判断题辨析'],
  // 加速度文章配图（public/blog-images/k004-acceleration/）：标题带课程编号与考点关键词，描述写清图形内容与适用题型。
  'K004-速度变化快慢的描述-加速度-01-情境引入-谁的速度变化更快.png': ['加速度 · 谁的速度变化更快', '情境引入图：赛车、列车与自行车起步对比，速度变化相同但用时不同，引出"速度变化的快慢"；加速度文章插图，适用新课导入、比值法引入'],
  'K004-速度变化快慢的描述-加速度-02-概念讲解-加速度的定义.png': ['加速度 · 定义与公式讲解', '板书讲解加速度定义：a = Δv/Δt，速度的变化量与所用时间之比，单位 m/s²；加速度文章插图，适用定义式、单位读写、矢量性说明'],
  'K004-速度变化快慢的描述-加速度-03-原理关系-加速度的方向.png': ['加速度 · 方向与 Δv 同向', '原理图：规定向右为正，加速时 Δv 向右加速度为正、减速时 Δv 向左加速度为负，加速度方向与速度变化量方向相同；加速度文章插图，适用方向判断、正负号含义'],
  'K004-速度变化快慢的描述-加速度-04-易错对照-速度大不等于加速度大.png': ['加速度 · 速度大不等于加速度大', '易错对照板书：高速匀速飞行客机加速度为零，缓慢起步的电动车反而有加速度；速度、速度变化量、加速度三者无必然联系；加速度文章插图，适用概念辨析、反直觉纠错'],
  'K004-速度变化快慢的描述-加速度-05-加速度方向-问题模型.png': ['加速度 · 方向判断问题模型', '题型页：汽车起步与刹车两情境，规定向右为正，判断速度变化量与加速度的正负方向；加速度文章插图，适用一维正方向约定、Δv 计算训练'],
  'K004-速度变化快慢的描述-加速度-06-加速度方向-符号与方向解析.png': ['加速度 · 方向题符号解析', '解析页：起步 Δv = v末 − v初 为正、加速度向右；刹车 Δv 为负、加速度向右为减速；符号表示方向而非大小；加速度文章插图，适用方向题型讲解、正负号辨析'],
  'K004-速度变化快慢的描述-加速度-07-速度与加速度关系-问题模型.png': ['加速度 · 速度与加速度关系问题', '题型页：判断"速度大/速度变化大/加速度大"能否互相推出，列四情境对照表；加速度文章插图，适用 v 与 a 关系辨析、选择题高频考法'],
  'K004-速度变化快慢的描述-加速度-08-速度与加速度关系-同向与反向.png': ['加速度 · 同向加速反向减速', '解析页：速度与加速度同向做加速运动、反向做减速运动，配 v-t 图线段对照；加速度文章插图，适用加速减速判断、v-a 方向关系'],
  'K004-速度变化快慢的描述-加速度-09-速度变化比较-问题模型.png': ['加速度 · 速度变化比较问题模型', '题型页：两物体速度变化量相同但用时不同，比较加速度大小，列 Δv 与 Δt 表格；加速度文章插图，适用比值法、控制变量比较'],
  'K004-速度变化快慢的描述-加速度-10-速度变化比较-比值法解析.png': ['加速度 · 比值法解析', '解析页：用 a = Δv/Δt 分别计算两物体加速度并比较大小，强调比值定义法思想；加速度文章插图，适用计算题示范、比值定义法'],
  // 匀变速速度与时间文章配图（public/blog-images/k005-velocity-time-formula/）：标题带课程编号与考点关键词。
  'K005-匀变速直线运动的速度与时间的关系-01-情境引入-等时间速度变化.png': ['匀变速速度时间 · 等时速度变化情境', '情境引入图：相同时间间隔内速度均匀增加相同数值，速度变化量与时间成正比；匀变速速度与时间文章插图，适用新课导入、匀变速判断'],
  'K005-匀变速直线运动的速度与时间的关系-02-概念讲解-速度公式.png': ['匀变速速度时间 · 速度公式板书', '板书讲解速度公式 v = v0 + at：初速度、加速度与时间如何合成末速度，标注各量含义与单位；匀变速速度与时间文章插图，适用公式推导、公式记忆'],
  'K005-匀变速直线运动的速度与时间的关系-03-原理关系-速度时间图像.png': ['匀变速速度时间 · v-t 图像原理', '原理图：v-t 图像中匀变速直线运动图线为倾斜直线，斜率即加速度，截距即初速度；匀变速速度与时间文章插图，适用图像法、斜率与截距读取'],
  'K005-匀变速直线运动的速度与时间的关系-04-易错对照-加速度正负与快慢.png': ['匀变速速度时间 · 加速度正负易错', '易错对照板书：加速度为正不代表加速，要看与速度方向关系；正负号表示方向、绝对值表示快慢；匀变速速度与时间文章插图，适用符号辨析、减速判断'],
  'K005-匀变速直线运动的速度与时间的关系-05-速度公式-问题模型.png': ['匀变速速度时间 · 公式计算问题模型', '题型页：汽车匀加速起步情境，已知初速度、加速度求某时刻末速度，标注已知量与待求量；匀变速速度与时间文章插图，适用公式代入、计算示范'],
  'K005-匀变速直线运动的速度与时间的关系-06-速度公式-解题分析.png': ['匀变速速度时间 · 公式计算解析', '解析页：代入 v = v0 + at 逐步求末速度，强调单位统一与带符号运算；匀变速速度与时间文章插图，适用解题步骤示范、规范书写'],
  'K005-匀变速直线运动的速度与时间的关系-07-刹车停止-问题模型.png': ['匀变速速度时间 · 刹车停止问题模型', '刹车到停止问题模型：汽车匀减速刹车，标注初速度、加速度与停车时间，提示停止后不再倒退；匀变速速度与时间文章插图，适用刹车陷阱、停车时间'],
  'K005-匀变速直线运动的速度与时间的关系-08-刹车停止-分段分析.png': ['匀变速速度时间 · 刹车分段分析', '刹车题分段分析：先算停车时间，停车前正常代公式、停车后按静止处理，对照正误两种解法；匀变速速度与时间文章插图，适用刹车位移、分段处理'],
  'K005-匀变速直线运动的速度与时间的关系-09-速度时间图像-问题模型.png': ['匀变速速度时间 · 图像问题模型', '题型页：给 v-t 图像读初速度、末速度、加速度并判断运动阶段，标注坐标轴与关键点；匀变速速度与时间文章插图，适用图像读图、分段运动判断'],
  'K005-匀变速直线运动的速度与时间的关系-10-速度时间图像-斜率与交点.png': ['匀变速速度时间 · 图像斜率与交点', '解析页：v-t 图像斜率是加速度、两线交点是速度相等时刻，标注各段斜率正负；匀变速速度与时间文章插图，适用图像四要点、追及临界铺垫'],
  // 匀变速位移与时间文章配图（public/blog-images/k006-displacement-time-formula/）：标题带课程编号与考点关键词。
  'K006-匀变速直线运动的位移与时间的关系-01-情境引入-等时间位移递增.png': ['匀变速位移时间 · 等时位移递增情境', '情境引入图：相同时间间隔内位移依次增大且差值相同，引出"位移随时间均匀变化"；匀变速位移与时间文章插图，适用新课导入、匀变速判断'],
  'K006-匀变速直线运动的位移与时间的关系-02-概念讲解-位移时间公式.png': ['匀变速位移时间 · 位移公式板书', '板书讲解位移公式 x = v0t + ½at²：初速度项与加速项的含义、各量单位与适用条件；匀变速位移与时间文章插图，适用公式推导、公式记忆'],
  'K006-匀变速直线运动的位移与时间的关系-03-原理关系-速度图像面积.png': ['匀变速位移时间 · v-t 图像面积即位移', '原理图：v-t 图线与时间轴围成的面积表示位移，矩形加三角形拼出位移公式；匀变速位移与时间文章插图，适用面积法推导、图像法求位移'],
  'K006-匀变速直线运动的位移与时间的关系-04-易错对照-位移与路程.png': ['匀变速位移时间 · 位移与路程易错', '易错对照板书：位移是初末位置有向线段、路程是轨迹长度，单向直线运动两者才相等；匀变速位移与时间文章插图，适用概念辨析、往返运动陷阱'],
  'K006-匀变速直线运动的位移与时间的关系-05-位移公式-问题模型.png': ['匀变速位移时间 · 位移公式问题模型', '题型页：汽车匀加速起步情境，已知初速度、加速度与时间求位移，标注已知量与待求量；匀变速位移与时间文章插图，适用公式代入、计算示范'],
  'K006-匀变速直线运动的位移与时间的关系-06-位移公式-解题分析.png': ['匀变速位移时间 · 位移公式解析', '解析页：代入 x = v0t + ½at² 分步求位移，强调单位统一与时间只代一次；匀变速位移与时间文章插图，适用解题步骤示范、规范书写'],
  'K006-匀变速直线运动的位移与时间的关系-07-平均速度法-问题模型.png': ['匀变速位移时间 · 平均速度法问题模型', '题型页：用平均速度求位移的情境，标注初末速度与中间时刻速度；匀变速位移与时间文章插图，适用平均速度法、巧算位移'],
  'K006-匀变速直线运动的位移与时间的关系-08-平均速度法-解题分析.png': ['匀变速位移时间 · 平均速度法解析', '解析页：平均速度等于初末速度平均再乘时间求位移，与位移公式结果对照；匀变速位移与时间文章插图，适用平均速度公式、多法验证'],
  'K006-匀变速直线运动的位移与时间的关系-09-逐差关系-问题模型.png': ['匀变速位移时间 · 逐差关系问题模型', '题型页：连续相等时间间隔内的位移差恒定为 aT²，标注各段位移；匀变速位移与时间文章插图，适用比例法、纸带逐差铺垫'],
  'K006-匀变速直线运动的位移与时间的关系-10-逐差关系-解题分析.png': ['匀变速位移时间 · 逐差关系解析', '解析页：用相邻相等时间位移差求加速度，初速零比例 1:3:5 对照；匀变速位移与时间文章插图，适用逐差法、比例关系计算'],
  'K006-匀变速直线运动的位移与时间的关系-11-图像面积-问题模型.png': ['匀变速位移时间 · 图像面积问题模型', '题型页：给 v-t 图像求位移，分段计算面积并判断运动方向；匀变速位移与时间文章插图，适用图像求位移、分段面积'],
  'K006-匀变速直线运动的位移与时间的关系-12-图像面积-解题分析.png': ['匀变速位移时间 · 图像面积解析', '解析页：v-t 图像分块算面积求位移，梯形与三角形面积公式对照；匀变速位移与时间文章插图，适用图像法、面积分块计算'],
  // 自由落体文章配图（public/blog-images/k007-free-fall/）：标题带课程编号与考点关键词。
  'K007-自由落体运动-01-情境引入-自由落体条件.png': ['自由落体 · 情境引入与条件', '情境引入图：重物由静止下落，标注"只受重力、初速度为零"两个自由落体条件；自由落体文章插图，适用新课导入、条件判断'],
  'K007-自由落体运动-02-概念讲解-重力加速度.png': ['自由落体 · 重力加速度概念', '板书讲解重力加速度 g：方向竖直向下、通常取 9.8 或 10 米每二次方秒；自由落体文章插图，适用概念定义、g 值使用'],
  'K007-自由落体运动-03-原理关系-速度与下落高度.png': ['自由落体 · 速度与下落高度关系', '原理图：下落速度与高度的关系，v=gt 与 h=½gt² 对照标注；自由落体文章插图，适用公式套用、速度高度互求'],
  'K007-自由落体运动-04-易错对照-下落不等于自由落体.png': ['自由落体 · 下落不等于自由落体', '易错对照板书：有空气阻力或初速度不为零的下落都不是自由落体；自由落体文章插图，适用条件辨析、概念纠错'],
  'K007-自由落体运动-05-自由落体计算-问题模型.png': ['自由落体 · 计算题问题模型', '题型页：已知下落高度求时间或落地速度的问题模型，标注已知量与待求量；自由落体文章插图，适用公式代入、计算示范'],
  'K007-自由落体运动-06-自由落体计算-解题分析.png': ['自由落体 · 计算题解析', '解析页：用 h=½gt² 与 v=gt 分步求解下落问题，强调 g 取值统一；自由落体文章插图，适用解题步骤示范、规范书写'],
  'K007-自由落体运动-07-下落末段-问题模型.png': ['自由落体 · 下落末段问题模型', '题型页：最后一段时间或最后一段高度的问题模型，标注总高度与末段；自由落体文章插图，适用末段位移、时间差法'],
  'K007-自由落体运动-08-下落末段-差量法解析.png': ['自由落体 · 下落末段差量法解析', '解析页：总位移减前段位移求末段，或用时间差联立方程的差量法对照；自由落体文章插图，适用末段计算、方程联立'],
  'K007-自由落体运动-09-竖直上抛拓展-问题模型.png': ['自由落体 · 竖直上抛拓展模型', '拓展页：竖直上抛的问题模型，上升减速与下落加速对称性标注；自由落体文章插图，适用上抛对称、逆向思维'],
  'K007-自由落体运动-10-竖直上抛拓展-分段分析.png': ['自由落体 · 竖直上抛分段分析', '解析页：竖直上抛分上升段与下落段处理，最高点速度为零、时间对称；自由落体文章插图，适用分段求解、对称性应用'],
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
