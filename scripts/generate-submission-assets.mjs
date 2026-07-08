import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

const palette = {
  ink: "#2F2032",
  soft: "#FFF9F2",
  sand: "#F3E7D8",
  rust: "#B4654A",
  calm: "#7CC6A4",
  sharp: "#F06C54",
  bright: "#F4C44E",
  dreamy: "#B586F8",
  steady: "#4E88E8",
  wild: "#EC6FBC",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F8F0E5"/>
        <stop offset="100%" stop-color="#F3E6D4"/>
      </linearGradient>
      <pattern id="weave" width="96" height="96" patternUnits="userSpaceOnUse">
        <rect width="96" height="96" fill="rgba(255,255,255,0)"/>
        <path d="M0 24H96M0 72H96M24 0V96M72 0V96" stroke="#EADBCB" stroke-width="6" opacity="0.7"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#weave)" opacity="0.6"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 35);
  return `
    <text x="74" y="116" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${palette.rust}">BASE MOOD LOOM</text>
    <text x="74" y="224" font-family="Arial, sans-serif" font-size="88" font-weight="900" fill="${palette.ink}">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="78" y="${296 + index * 42}" font-family="Arial, sans-serif" font-size="33" font-weight="700" fill="#755F58">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, fg = palette.ink) {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 78}" height="58" fill="${fill}"/>
    <text x="${x + 28}" y="${y + 38}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function card(x, y, width, height, title, lines, bg = palette.soft) {
  const wrapped = lines.flatMap((line, index) => (index === 0 ? [line] : wrap(line, Math.floor((width - 70) / 12))));
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="30" fill="${bg}"/>
      <text x="${x + 28}" y="${y + 48}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${palette.rust}">${esc(title)}</text>
      ${wrapped.map((line, index) => `<text x="${x + 28}" y="${y + 108 + index * 36}" font-family="Arial, sans-serif" font-size="${index === 0 ? 36 : 28}" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? palette.ink : "#755F58"}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function loom(x, y, width, strandLabels) {
  const colors = [palette.calm, palette.sharp, palette.bright, palette.dreamy, palette.steady, palette.wild];
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="760" rx="34" fill="#F8EFE5"/>
      ${colors.map((color, index) => `
        <rect x="${x + 36 + (index % 2) * 16}" y="${y + 50 + index * 108}" width="${width - 72 - (index % 2) * 32}" height="82" rx="28" fill="${color}"/>
        <text x="${x + 68}" y="${y + 100 + index * 108}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${palette.ink}" opacity="0.75">${esc(strandLabels[index])}</text>
      `).join("")}
    </g>
  `;
}

function screenshot1() {
  const content = `
    ${header("Weave today's mood onchain.", "Choose a feeling, pair it with a strand color, and leave one honest line behind it.")}
    ${pill(74, 396, "Color-first", "#F4E2D4")}
    ${pill(266, 396, "Feels personal", "#EFE7FF")}
    ${card(74, 520, 1136, 320, "Compose strand", ["Calm", "Reset the day with a quiet hour and wanted that tone to stay visible."], "#FFF9F2")}
    ${card(74, 878, 548, 244, "Palette", ["6 moods", "Calm / Sharp / Bright"], "#F7E9DE")}
    ${card(662, 878, 548, 244, "Why it works", ["One feeling", "One line of context"], "#F7E9DE")}
    ${loom(74, 1166, 1136, ["Lead strand", "Dreamy", "Bright", "Steady", "Wild", "Calm"])}
    <rect x="74" y="2520" width="1136" height="118" rx="59" fill="${palette.ink}"/>
    <text x="642" y="2594" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#FFF9F2">Weave mood on Base</text>
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("Your mood archive becomes visual.", "Each strand sits in a woven board so the pattern of your week is easy to scan at a glance.")}
    ${pill(74, 396, "Board view", "#F8DCCF")}
    ${pill(250, 396, "Latest strand", "#DCE8FF")}
    ${loom(74, 520, 700, ["Calm", "Dreamy", "Sharp", "Bright", "Steady", "Wild"])}
    ${card(814, 520, 396, 276, "Latest strand", ["Dreamy", "Color: #B586F8", "Count: 4"], "#FFF9F2")}
    ${card(814, 832, 396, 290, "Note", ["Wanted to stay soft and imaginative after a long work block."], "#FFF9F2")}
    ${card(814, 1158, 396, 204, "Date", ["May 14, 2026"], "#F7E9DE")}
    ${card(74, 2320, 1136, 220, "What changes", ["The app feels less like a ledger and more like a living textile of how the week moved."], "#FFF9F2")}
  `;
  return frame(content);
}

function screenshot3() {
  const content = `
    ${header("Look up any strand by ID.", "Open a past mood entry and inspect the label, note, strand count, color, and timestamp.")}
    ${pill(74, 396, "Lookup mode", "#F4E2D4")}
    ${pill(268, 396, "Strand #8", "#FFF1C7")}
    ${card(74, 520, 1136, 254, "Lookup result", ["Steady", "Date: May 14, 2026", "Count: 8"], "#FFF9F2")}
    ${card(74, 812, 1136, 256, "Stored reason", ["Needed structure, fewer tabs, and a calmer rhythm across the afternoon."], "#FFF9F2")}
    ${card(74, 1108, 548, 246, "Author", ["0x9936...9652", "Public strand"], "#F7E9DE")}
    ${card(662, 1108, 548, 246, "Color", ["#4E88E8", "Steady blue"], "#DCE8FF")}
    ${loom(74, 1398, 1136, ["Steady", "Calm", "Bright", "Wild", "Sharp", "Dreamy"])}
    <rect x="74" y="2520" width="1136" height="118" rx="59" fill="${palette.bright}"/>
    <text x="642" y="2594" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${palette.ink}">Load another strand</text>
  `;
  return frame(content);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#F7ECDD"/>
    <rect x="154" y="182" width="716" height="660" rx="72" fill="#FFF9F2"/>
    <rect x="214" y="278" width="596" height="86" rx="32" fill="${palette.calm}"/>
    <rect x="246" y="392" width="532" height="86" rx="32" fill="${palette.dreamy}"/>
    <rect x="214" y="506" width="596" height="86" rx="32" fill="${palette.bright}"/>
    <rect x="246" y="620" width="532" height="86" rx="32" fill="${palette.steady}"/>
    <circle cx="512" cy="512" r="44" fill="${palette.ink}"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="#F7ECDD"/>
    <text x="96" y="190" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="${palette.ink}">Base Mood Loom</text>
    <text x="100" y="286" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#755F58">Turn a daily feeling into a woven color strand and keep the pattern on Base.</text>
    ${pill(100, 342, "Calm", "#D8F1E4")}
    ${pill(242, 342, "Dreamy", "#F0E3FF")}
    ${pill(416, 342, "Bright", "#FFF1C7")}
    ${card(100, 440, 700, 252, "Latest strand", ["Dreamy", "Wanted a softer pace after a long work block."], "#FFF9F2")}
    ${loom(1040, 148, 720, ["Calm", "Dreamy", "Bright", "Steady", "Wild", "Sharp"])}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

for (const file of files) {
  console.log(file);
}
