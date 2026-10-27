// 初次使用修改这里；日常写作只维护 src/content/blog/ 和 public/blog-images/。
const url = new URL(process.env.SITE_URL || 'https://imkuku.me');
if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('SITE_URL 必须是完整站点域名，例如 https://your-domain.com，不带子路径、查询参数或锚点。');
}

export const siteConfig = {
  url: url.origin,
  name: '颓颓的物理碎碎念',
  author: '颓頹老师',
  role: '高中物理',
  description: '颓頹老师的高中物理小站。嘴上碎碎念，手上全是干货：讲模型、捋易错点、拆实验题，专治物理拖后腿。',
  language: 'zh-CN',
  blogTitle: '物理碎碎念',
  blogDescription: '物理模型怎么用，易错点怎么避，实验题怎么拆。颓頹老师把高中物理里的这些问题，一篇篇讲清楚。',
  logo: '/brand/logo.png',
  ogImage: '/brand/og-default.png',
  // 微信网页分享卡片是可选项。公众号富文本复制不依赖此配置。
  wechat: { enabled: false, signUrl: '/api/wx-sign' },
  home: {
    eyebrow: '颓頹老师 · 高中物理',
    headline: ['嘴上碎碎念，', '手上全是干货。'],
    lead: '讲模型、捋易错点、拆实验题，专治物理拖后腿。那些没想通的高中物理，咱们一道题一道题讲明白。',
    portraits: [
      { src: '/site-assets/teacher-desk-tired.png', alt: '手绘物理老师坐在桌前，手持粉笔' },
      { src: '/site-assets/teacher-thinking.png', alt: '手绘物理老师站立思考' },
      { src: '/site-assets/teacher-book-explain.png', alt: '手绘物理老师结合书本讲解' },
    ],
    aboutTitle: '我是颓頹老师，教高中物理。',
    about: ['这里是我的物理碎碎念。一个模型为什么能用，一道题为什么总错，一个实验到底在测什么，都值得多讲几句。学生看得懂，家长也看得明白，是我写每一篇的标准。', '模型讲清适用条件，易错点说明错在哪里，实验题拆开原理和步骤。文章按教材板块归了类，哪块没学好就翻哪块。希望你看完不只记住答案，也知道下次该怎么想。'],
    // 内容方向；不要填写未经确认的履历或成果。
    capabilities: [
      { title: '物理模型', items: ['看懂情境与过程', '讲清适用条件', '从例题学会用模型'] },
      { title: '易错点', items: ['分清容易混淆的概念', '找出漏掉的条件', '检查受力、符号与单位'] },
      { title: '实验题', items: ['弄懂实验原理', '理顺操作与读数', '分析数据、图像与误差'] },
    ],
    // 添加作品后首页和导航自动展示。每项：title、description、href、可选 image。
    projects: /** @type {{ title: string; description: string; href: string; image?: string }[]} */ ([]),
    // 添加真实联系方式后首页和导航自动展示。例如 { label: 'Email', href: 'mailto:you@example.com' }。
    contacts: /** @type {{ label: string; href: string }[]} */ ([]),
  },
};
