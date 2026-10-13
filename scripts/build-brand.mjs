import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../site.config.mjs';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const brandDir = `${publicDir}/brand`;
await mkdir(brandDir, { recursive: true });
const source = await readFile(`${brandDir}/logo-source.png`);
// 头像原件自带圆形边框。派生 Logo 沿圆形外沿裁切透明角，原件保持不变。
const circle = Buffer.from('<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="256" fill="white"/></svg>');
const mark = await sharp(source).resize(512, 512).ensureAlpha().composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
for (const [name, size] of [['logo.png', 256], ['favicon-16.png', 16], ['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
  await sharp(mark).resize(size, size, { fit: 'contain' }).png().toFile(`${brandDir}/${name}`);
}

// ICO 内嵌多尺寸 PNG；仅派生尺寸与容器格式，保留已有角色图形。
const sizes = [16, 32, 48, 64, 128, 256];
const icons = await Promise.all(sizes.map((size) => sharp(mark).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const position = 6 + index * 16;
  header[position] = size === 256 ? 0 : size; header[position + 1] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, position + 4); header.writeUInt16LE(32, position + 6);
  header.writeUInt32LE(icons[index].length, position + 8); header.writeUInt32LE(offset, position + 12);
  offset += icons[index].length;
});
await writeFile(`${publicDir}/favicon.ico`, Buffer.concat([header, ...icons]));

const escape = (value) => value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
const text = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#eef0ed"/><rect x="72" y="100" width="8" height="420" fill="#446d59"/><text x="112" y="246" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="70" font-weight="700" fill="#1c211f">${escape(siteConfig.name)}</text><text x="116" y="321" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="30" fill="#446d59">${escape(siteConfig.role)}</text><text x="116" y="470" font-family="sans-serif" font-size="24" fill="#606963">${escape(new URL(siteConfig.url).hostname)}</text></svg>`);
const avatar = await sharp(mark).resize(330, 330).png().toBuffer();
await sharp(text).composite([{ input: avatar, left: 798, top: 145 }]).png().toFile(`${brandDir}/og-default.png`);
console.log('Logo、6 尺寸 ICO、Apple 图标与 1200×630 分享封面已更新。');
