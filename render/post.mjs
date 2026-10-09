// ffmpeg 後製（只影響 preview.mp4 的整張畫面）：輝光 glow、色差 aberration、調色 grade。
// 網頁預覽看不到這些效果；透明字層（--alpha）與音訊完全不受影響。
// 與網頁版既有功能無關：@chromatic／@glow-soft／@neon 是「逐字」樣式，tone／brightness 是網頁舞台的 CSS filter。
import { spawnSync } from 'node:child_process';

// 保守預設值（只給旗標、不給數值時使用）
export const DEFAULTS = {
  glow: { amount: 0.35, radius: 1.6, threshold: 200 },   // amount＝疊回強度 0–1；radius＝模糊半徑（畫面高度的 %，1080p 約 17px）；threshold＝亮部門檻 0–254
  aberration: { px: 2 },                                  // 紅藍通道左右位移的像素（以 1080p 為準，其他解析度等比換算）
};
// 調色預設：eq（contrast／saturation／brightness／gamma）＋ 選配 colorbalance／curves 片段
export const GRADES = {
  warm: { contrast: 1.03, saturation: 1.06, extra: 'colorbalance=rs=.012:rm=.03:bs=-.012:bm=-.03' },
  cool: { contrast: 1.03, saturation: 1.04, extra: 'colorbalance=rs=-.012:rm=-.03:bs=.012:bm=.03' },
  film: { contrast: 1.06, saturation: 0.92, extra: "curves=all='0/0.03 0.5/0.5 1/0.97'" },
};
const RANGE = { amount: [0, 1], radius: [0.3, 6], threshold: [0, 254], px: [0, 20], contrast: [0.5, 2], saturation: [0, 3], brightness: [-0.3, 0.3], gamma: [0.5, 2] };

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const num = (label, v) => {
  const n = Number(v), k = label.split('.').pop(), [lo, hi] = RANGE[k];
  if (!Number.isFinite(n) || n < lo || n > hi) throw new Error(`後製參數 ${label} = ${v} 不合法（要在 ${lo} ~ ${hi} 之間）`);
  return n;
};
// true／旗標沒給值 → 用預設；物件 → 逐欄覆蓋預設
const pick = (v, def, name) => {
  if (v === undefined || v === false || v === null) return null;
  if (v === true) return { ...def };
  if (!isObj(v)) { const k = Object.keys(def)[0]; return { ...def, [k]: v }; }       // 簡寫：--glow 0.5 ＝ { amount: 0.5 }
  const o = { ...def }; for (const k of Object.keys(v)) { if (!(k in def)) throw new Error(`後製參數 post.${name}.${k} 不認得（可用：${Object.keys(def).join('、')}）`); o[k] = v[k]; }
  return o;
};

// 合併 config.post 與 CLI 旗標（CLI 優先）。沒有任何有效後製 → 回傳 null（此時 run.mjs 的 ffmpeg 指令與未加入本功能時逐字相同）
export function resolvePost(cfgPost, args = {}) {
  const c = isObj(cfgPost) ? cfgPost : {}, out = {};
  const bad = Object.keys(c).filter(k => !['glow', 'aberration', 'grade'].includes(k));
  if (bad.length) throw new Error(`config.post 不認得的欄位：${bad.join('、')}（可用：glow、aberration、grade）`);

  let g = c.glow;
  if (args.glow !== undefined || args['glow-radius'] !== undefined || args['glow-threshold'] !== undefined) {
    const base = isObj(g) ? { ...g } : g === true ? {} : g === undefined || g === false || g === null ? {} : { amount: g };
    if (args.glow !== undefined) base.amount = args.glow === true ? DEFAULTS.glow.amount : args.glow;
    if (args['glow-radius'] !== undefined) base.radius = args['glow-radius'];
    if (args['glow-threshold'] !== undefined) base.threshold = args['glow-threshold'];
    g = base;
  }
  g = pick(g, DEFAULTS.glow, 'glow');
  if (g) { for (const k of ['amount', 'radius', 'threshold']) g[k] = num('glow.' + k, g[k]); if (g.amount > 0) out.glow = g; }

  let a = c.aberration;
  if (args.aberration !== undefined) a = args.aberration === true ? true : { px: args.aberration };
  a = pick(a, DEFAULTS.aberration, 'aberration');
  if (a) { a.px = num('aberration.px', a.px); if (a.px > 0) out.aberration = a; }

  let r = c.grade;
  const gk = { contrast: 'grade-contrast', saturation: 'grade-saturation', brightness: 'grade-brightness', gamma: 'grade-gamma' };
  if (args.grade !== undefined || Object.values(gk).some(k => args[k] !== undefined)) {
    r = isObj(r) ? { ...r } : typeof r === 'string' ? { preset: r } : {};
    if (args.grade !== undefined) { if (args.grade === true) throw new Error(`--grade 後面要接預設名稱：${Object.keys(GRADES).join('、')}`); r.preset = args.grade; }
    for (const [k, f] of Object.entries(gk)) if (args[f] !== undefined) r[k] = args[f];
  }
  if (typeof r === 'string') r = { preset: r };
  if (r !== undefined && r !== null && r !== false) {
    if (!isObj(r)) throw new Error('config.post.grade 要是預設名稱或物件');
    const bad2 = Object.keys(r).filter(k => !['preset', 'contrast', 'saturation', 'brightness', 'gamma'].includes(k));
    if (bad2.length) throw new Error(`後製參數 post.grade.${bad2[0]} 不認得（可用：preset、contrast、saturation、brightness、gamma）`);
    if (r.preset !== undefined && !GRADES[r.preset]) throw new Error(`調色預設「${r.preset}」不存在（可用：${Object.keys(GRADES).join('、')}）`);
    const base = r.preset ? GRADES[r.preset] : { contrast: 1, saturation: 1 }, o = { contrast: base.contrast, saturation: base.saturation, brightness: 0, gamma: 1 };
    for (const k of ['contrast', 'saturation', 'brightness', 'gamma']) if (r[k] !== undefined) o[k] = num('grade.' + k, r[k]);
    if (r.preset && GRADES[r.preset].extra) o.extra = GRADES[r.preset].extra;
    o.preset = r.preset || '';
    if (o.contrast !== 1 || o.saturation !== 1 || o.brightness !== 0 || o.gamma !== 1 || o.extra) out.grade = o;
  }
  return Object.keys(out).length ? out : null;
}

const f = n => String(+n.toFixed(4));   // 數字轉短字串，避免 0.30000000000000004

// 組出接在動態模糊之後的濾鏡字串（不含開頭逗號）。W、H＝渲染解析度
export function postFilter(post, W, H) {
  const p = [];
  if (post.glow || post.aberration) p.push('format=gbrp');      // 在 RGB 上做 screen／位移：在 YUV 上混合會把色度平面一起混而偏色
  if (post.glow) {
    const { amount, radius, threshold } = post.glow, sigma = radius / 100 * H, d = sigma >= 8 ? 4 : sigma >= 3 ? 2 : 1;   // 大半徑先降採樣再模糊再放大，1080p 才不會慢
    const k = f(255 / (255 - threshold)), e = `'clip((val-${f(threshold)})*${k},0,255)'`;
    p.push(`split=2[o][g];[g]lutrgb=r=${e}:g=${e}:b=${e}` + (d > 1 ? `,scale=iw/${d}:ih/${d}:flags=area` : '') + `,gblur=sigma=${f(sigma / d)}:steps=2` + (d > 1 ? `,scale=${W}:${H}:flags=bilinear` : '') + `[gl];[o][gl]blend=all_mode=screen:all_opacity=${f(amount)}`);
  }
  if (post.aberration) { const s = Math.max(1, Math.round(post.aberration.px * H / 1080)); p.push(`rgbashift=rh=-${s}:bh=${s}`); }
  if (post.grade) {
    const g = post.grade, eq = [];
    if (g.contrast !== 1) eq.push('contrast=' + f(g.contrast));
    if (g.saturation !== 1) eq.push('saturation=' + f(g.saturation));
    if (g.brightness !== 0) eq.push('brightness=' + f(g.brightness));
    if (g.gamma !== 1) eq.push('gamma=' + f(g.gamma));
    if (eq.length) p.push('eq=' + eq.join(':'));
    if (g.extra) p.push(g.extra);
  }
  return p.join(',');
}

export function requiredFilters(post) {
  const r = new Set();
  if (post.glow) ['format', 'split', 'lutrgb', 'scale', 'gblur', 'blend'].forEach(x => r.add(x));
  if (post.aberration) ['format', 'rgbashift'].forEach(x => r.add(x));
  if (post.grade) { r.add('eq'); if (post.grade.extra) r.add(post.grade.extra.split('=')[0]); }
  return [...r];
}

// 啟動時檢查 ffmpeg 有沒有所需濾鏡；回傳缺少的清單（空陣列＝齊全）
export function missingFilters(post, ffmpeg = 'ffmpeg') {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-filters'], { encoding: 'utf8' });
  const have = new Set((r.stdout || '').split('\n').map(l => l.trim().split(/\s+/)[1]).filter(Boolean));
  return requiredFilters(post).filter(x => !have.has(x));
}

export function describe(post) {
  const s = [];
  if (post.glow) s.push(`輝光 ${post.glow.amount}／半徑 ${post.glow.radius}%／門檻 ${post.glow.threshold}`);
  if (post.aberration) s.push(`色差 ${post.aberration.px}px`);
  if (post.grade) s.push(`調色 ${post.grade.preset || '自訂'}（對比 ${post.grade.contrast}、飽和 ${post.grade.saturation}${post.grade.brightness ? '、亮度 ' + post.grade.brightness : ''}${post.grade.gamma !== 1 ? '、gamma ' + post.grade.gamma : ''}）`);
  return s.join('；');
}
