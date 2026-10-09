// 離線逐幀渲染：node render/run.mjs --project input/project.json --fps 30 --width 1920 --height 1080 [--srt 檔] [--config 檔] [--blur N] [--seconds N] [--audio 音樂檔] [--video 背景影片] [--fonts 字體資料夾] [--alpha] [--layers] [--chroma [顏色]] [--webm] [--png] [--frames-dir DIR] [--selftest]
//   分層：--layers＝同一輪渲染輸出 text_alpha.mov（透明文字層）＋ambient.mp4（背景＋氛圍特效，無文字）；兩層疊回去≈一般 preview.mp4，見 README
//   綠幕：--chroma [#rrggbb，預設 #00ff00]＝純色背景＋只留文字，輸出一般 preview.mp4；會忽略 --video 背景與後製參數，見 README
//   預覽 MP4 後製（只影響 preview.mp4）：[--glow [量]] [--glow-radius %] [--glow-threshold 0-254] [--aberration [px]] [--grade warm|cool|film] [--grade-contrast/-saturation/-brightness/-gamma N]；也可寫在 config.post，見 README
// 沒給 --project 時使用內建範例。需要：Node.js、ffmpeg（在 PATH）、npx playwright install chromium
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { analyzeAudio } from './audio.mjs';
import { parseKey, applyChroma } from './chroma.mjs';
import { resolvePost, postFilter, missingFilters, describe as describePost } from './post.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => {
  if (x.startsWith('--')) a.push([x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return a; }, []));
const fps = Number(args.fps) || 30, blur = Math.max(1, Math.min(16, Math.round(Number(args.blur)) || 1)), rfps = fps * blur, W = Number(args.width || args.w) || 1920, H = Number(args.height || args.h) || 1080;
const outDir = resolve(args.out || 'output');
// 專案來源：--project（{srt, config}）；或直接用網頁版匯出的兩個檔案：--srt lyrics_tagged.srt --config lyrics_config.json
function need(label, f) {
  if (!f || f === true) die(`${label} 後面要接檔案路徑`);
  if (!existsSync(resolve(f))) {
    const d = dirname(resolve(f)), list = existsSync(d) ? readdirSync(d).slice(0, 20) : [];
    die(`找不到${label}：${resolve(f)}\n` + (list.length ? `該資料夾實際有這些檔案：\n  ${list.join('\n  ')}\n請對照檔名（注意 (1)、副檔名是否被隱藏成 .txt 等）。` : `資料夾 ${d} 不存在。`));
  }
}
function die(msg) { console.error('錯誤：' + msg); process.exit(1); }
for (const [k, label] of [['srt', 'SRT 檔'], ['config', '設定檔'], ['audio', '音樂檔'], ['video', '背景影片'], ['project', '專案檔']]) if (args[k] !== undefined) need(label, args[k]);
const readText = f => readFileSync(resolve(f), 'utf8').replace(/^\uFEFF/, '');
const project = args.project ? JSON.parse(readText(args.project)) : { srt: '@demo', config: {} };
if (args.srt && args.srt !== true) project.srt = readText(args.srt);
if (args.config && args.config !== true) project.config = { ...(project.config || {}), ...JSON.parse(readText(args.config)) };
if (args.alpha) project.config = { ...(project.config || {}), alphaOnly: true };   // --alpha：只輸出字（透明）

// 分層：--layers。與 --alpha／--chroma／透明背景互相矛盾 → 忽略 --layers 並警告（沒給 --layers 時這段完全不介入）
let layers = !!args.layers;
if (layers && (args.alpha || args.chroma !== undefined || (project.config || {}).alphaOnly || (project.config || {}).chroma || (project.config || {}).bgMode === 'transparent')) {
  console.warn('警告：--layers 不能與 --alpha／--chroma／透明背景並用，已忽略 --layers。'); layers = false;
}
// 綠幕：--chroma [顏色]（或 config.chroma）。純色背景、遮罩暗度 0、關閉粒子／噪點／暗角／掃描線／色調／文字陰影與各種發光，輸出一般 MP4。
// 沒給 --chroma 時這一段完全不介入（chroma 為 null），其他程式碼的行為與指令與沒有此功能時相同。
let chroma = null;
try { if (args.chroma !== undefined || (project.config || {}).chroma) chroma = parseKey(args.chroma !== undefined ? args.chroma : project.config.chroma); } catch (e) { die(e.message); }
if (chroma && (args.alpha || (project.config || {}).alphaOnly || (project.config || {}).bgMode === 'transparent')) {
  console.warn('警告：透明字層輸出（--alpha／透明背景）與綠幕互相矛盾，已忽略 --chroma，仍輸出透明字層。');
  chroma = null; if (project.config) delete project.config.chroma;
}
if (chroma) {
  project.config = applyChroma(project.config, chroma);
  console.log(`綠幕輸出：背景純色 ${chroma}；已關閉遮罩、粒子、噪點、暗角、掃描線、色調、文字陰影、疊加特效與發光類樣式（輸出一般 preview.mp4）。`);
  console.warn('提醒：逐字樣式與版型中的發光、陰影、柔邊（如 @neon、@glow-soft）已被移除；模糊進出場、半透明文字的邊緣仍會與綠色混合，摳像時請用「去除溢色（despill）」。');
  if (args.video && args.video !== true) console.warn('警告：綠幕輸出沒有背景影片，--video 的畫面已忽略（它的音軌仍會混入）。');
}

// 自訂字體：input/fonts（或 --fonts 資料夾）內的 ttf/otf/woff/woff2；名稱 = 檔名去掉副檔名（與網頁版上傳字體時相同）
const fontsDir = args.fonts && args.fonts !== true ? resolve(args.fonts) : (existsSync(resolve('input/fonts')) ? resolve('input/fonts') : null);
if (fontsDir) {
  if (!existsSync(fontsDir)) die('找不到字體資料夾：' + fontsDir);
  const dirFonts = readdirSync(fontsDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f)).map(f => ({ name: f.replace(/\.\w+$/, ''), b64: readFileSync(join(fontsDir, f)).toString('base64') }));
  // project.json 內嵌的字體（網頁版「匯出渲染專案」）與資料夾字體合併；同名時以資料夾為準
  project.fonts = [...(project.fonts || []).filter(f => !dirFonts.some(d => d.name === f.name)), ...dirFonts];
}
if (project.fonts?.length) console.log('載入字體：' + project.fonts.map(f => f.name).join('、'));
const mediaFile = [args.audio, args.video].find(f => f && f !== true);
if (mediaFile) {          // 總長度：有音樂就跟著音樂，否則跟著影片（與網頁版載入媒體時相同）
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', resolve(mediaFile)], { encoding: 'utf8' });
  const d = parseFloat(r.stdout); if (d > 0) project.mediaDuration = d;
}
const cfg0 = project.config || {};
const bgVideo = !!(args.video && args.video !== true) && !args.alpha && !cfg0.alphaOnly && cfg0.bgMode !== 'transparent' && !chroma;
project.bgVideo = bgVideo;
if (spawnSync('ffmpeg', ['-version']).error) die('找不到 ffmpeg，請安裝並確認在 PATH 裡（終端機輸入 ffmpeg -version 能執行）。');

// ffmpeg 後製（輝光／色差／調色）：只套用在預覽 MP4；沒設定時 post 為 null，ffmpeg 指令與沒有這個功能時逐字相同
let post = null;
try { post = resolvePost(cfg0.post, args); } catch (e) { die(e.message); }
if (post && chroma) {
  console.warn(`警告：綠幕輸出會忽略後製（${describePost(post)}）：輝光、柔光、色差會把顏色混進背景，調色會讓背景偏離你指定的 ${chroma}。`); post = null;
}
if (post && (cfg0.alphaOnly || cfg0.bgMode === 'transparent')) {
  console.warn(`警告：後製（${describePost(post)}）只套用於預覽 MP4，透明字層輸出已忽略這些參數。`); post = null;
}
if (post) {
  const miss = missingFilters(post);
  if (miss.length) die(`這個 ffmpeg 缺少後製所需的濾鏡：${miss.join('、')}\n請升級 ffmpeg（終端機輸入 ffmpeg -filters 可查看）；或移除對應的後製參數。`);
  console.log('後製（只影響預覽 MP4）：' + describePost(post));
}

let audioData = null;
async function open() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }).catch(e =>
    die('無法啟動 Chromium：' + e.message + '\n請先執行 npx playwright install chromium'));
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', e => console.error('頁面錯誤：', e.message));
  await page.goto(pathToFileURL(join(here, '..', 'index.html')).href + `?render=1&fps=${rfps}`);
  await page.evaluate(() => window.__ready);
  const meta = await page.evaluate(p => window.__loadProject(p), project);
  if (audioData) await page.evaluate(a => window.__setAudio(a), audioData);
  return { browser, page, meta };
}

// 依序渲染第 0 ~ n-1 格；必須依序（粒子等狀態會累積），不能跳格
async function renderAll(page, n, onFrame, bgOf = () => null) {
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(([t, b]) => window.__renderFrame(t, b), [i / rfps, bgOf(i)]);
    await onFrame(i, await page.screenshot({ type: fmt, omitBackground: needAlpha, ...(fmt === 'jpeg' ? { quality: 95 } : {}) }));
    if (i % 30 === 29 || i === n - 1) {
      const el = (Date.now() - t0) / 1000, per = el / (i + 1);
      process.stdout.write(`\r  ${i + 1}/${n} 格　每格 ${per.toFixed(2)} 秒　預估剩餘 ${Math.round(per * (n - i - 1))} 秒   `);
    }
  }
  process.stdout.write('\n');
}

// 分層渲染：同一格的狀態（粒子、閃電等）只推進一次，連截兩張：文字透明層（PNG）與氛圍層（無文字）
async function renderLayers(page, n, onFrame, bgOf = () => null) {
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(([t, b]) => window.__renderFrame(t, b), [i / rfps, bgOf(i)]);
    await page.evaluate(() => window.__layer('text'));
    const tx = await page.screenshot({ type: 'png', omitBackground: true });
    await page.evaluate(() => window.__layer('amb'));
    const am = await page.screenshot({ type: fmt, ...(fmt === 'jpeg' ? { quality: 95 } : {}) });
    await page.evaluate(() => window.__layer(''));
    await onFrame(i, tx, am);
    if (i % 30 === 29 || i === n - 1) {
      const el = (Date.now() - t0) / 1000, per = el / (i + 1);
      process.stdout.write(`\r  ${i + 1}/${n} 格（兩層）　每格 ${per.toFixed(2)} 秒　預估剩餘 ${Math.round(per * (n - i - 1))} 秒   `);
    }
  }
  process.stdout.write('\n');
}

const { browser, page, meta } = await open();
const needAlpha = await page.evaluate(() => !!(CONFIG.alphaOnly || CONFIG.bgMode === 'transparent'));
const fmt = needAlpha || args.png ? 'png' : 'jpeg';   // 預設 JPEG（1080p 比 PNG 快 4 倍以上）；透明必須用 PNG
const limit = args.seconds ? Math.min(meta.frames, Math.ceil(Number(args.seconds) * rfps)) : meta.frames;
const audioSrc = args.audio && args.audio !== true ? resolve(args.audio) : (args.video && args.video !== true ? resolve(args.video) : null);
if (audioSrc) {
  process.stdout.write('分析音樂節拍…');
  audioData = analyzeAudio(audioSrc, rfps, limit);
  if (audioData) { await page.evaluate(a => window.__setAudio(a), audioData); console.log(' 完成'); } else console.log(' 沒有可分析的音軌，略過');
}
const missFont = await page.evaluate(() => FONTS[CONFIG.font] ? null : CONFIG.font);
if (missFont) console.warn(`警告：設定使用字體「${missFont}」，但 input/fonts 裡沒有同名字體檔（檔名需為 ${missFont}.ttf／.otf 等），輸出會改用系統字體。`);
const bgDir = join(outDir, '_bg'); let bgCount = 0;
if (bgVideo) {
  rmSync(bgDir, { recursive: true, force: true }); mkdirSync(bgDir, { recursive: true });
  process.stdout.write('擷取背景影片的每一格…');
  const x = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', resolve(args.video), '-t', String(limit / rfps + 1), '-vf', `fps=${fps},scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    '-frames:v', String(Math.ceil(limit / blur)), '-q:v', '3', join(bgDir, '%06d.jpg')], { stdio: ['ignore', 'inherit', 'inherit'] });
  bgCount = existsSync(bgDir) ? readdirSync(bgDir).length : 0;
  if (x.status || !bgCount) die('無法讀取背景影片，請確認檔案可正常播放。');
  console.log(` ${bgCount} 格`);
}
const bgOf = i => bgVideo ? pathToFileURL(join(bgDir, String(Math.min(Math.floor(i / blur) + 1, bgCount)).padStart(6, '0') + '.jpg')).href : null;   // 背景影片比總長度短時會自動循環
console.log(`專案：${meta.subs} 句，${meta.duration.toFixed(1)} 秒，${W}×${H}，${fps}fps${blur > 1 ? `（動態模糊 ×${blur}，以 ${rfps}fps 渲染）` : ''}，共渲染 ${limit} 格`);

if (args.selftest) {                       // 決定論自我測試：同一專案渲染兩次，逐格比對雜湊
  const sha = x => createHash('sha1').update(x).digest('hex');
  const run = async () => { const { browser: b, page: p } = await open(); const h = [];
    if (layers) await renderLayers(p, limit, async (i, tx, am) => h.push(sha(tx) + sha(am)), bgOf);
    else await renderAll(p, limit, async (i, buf) => h.push(sha(buf)), bgOf); await b.close(); return h; };
  const a = await run(), b = await run(), bad = a.map((x, i) => x === b[i] ? -1 : i).filter(i => i >= 0);
  await browser.close();
  console.log(bad.length ? `✗ 不一致的格：${bad.slice(0, 20).join(', ')}${bad.length > 20 ? ' …共 ' + bad.length + ' 格' : ''}` : `✓ 兩次渲染 ${limit} 格完全相同`);
  process.exit(bad.length ? 2 : 0);
}

mkdirSync(outDir, { recursive: true });
const dump = args['frames-dir'] ? resolve(args['frames-dir']) : null;
dump && mkdirSync(dump, { recursive: true });
const audio = args.audio && args.audio !== true ? resolve(args.audio) : (args.video && args.video !== true ? resolve(args.video) : null);
if (layers) {      // 分層輸出：text_alpha.mov（透明文字）＋ambient.mp4（背景與氛圍特效，含音訊）
  if (post) { console.warn(`警告：分層輸出不套用後製（${describePost(post)}），後製請在剪輯軟體疊合後處理。`); post = null; }
  const tIn = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(rfps), '-c:v', 'png', '-i', '-'];
  const aIn = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(rfps), '-c:v', fmt === 'png' ? 'png' : 'mjpeg', '-i', '-'];
  const selL = `select=eq(mod(n+1\\,${blur})\\,0),setpts=N/(${fps}*TB)`;
  const mbT = `format=gbrap16le,premultiply=inplace=1,tmix=frames=${blur},unpremultiply=inplace=1,${selL}`, mbA = `tmix=frames=${blur},${selL}`;
  const rate = blur > 1 ? ['-r', String(fps)] : [];
  const tArgs = [...tIn, '-map', '0:v', ...(blur > 1 ? ['-vf', mbT, ...rate] : []), '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-t', String(limit / rfps), join(outDir, 'text_alpha.mov')];
  const aArgs = [...aIn, ...(audio ? ['-i', audio] : []), '-map', '0:v', ...(audio ? ['-map', '1:a?', '-c:a', 'aac', '-b:a', '192k'] : []), ...(blur > 1 ? ['-vf', mbA, ...rate] : []),
    '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', String(limit / rfps), join(outDir, 'ambient.mp4')];
  if (args['debug-ffmpeg']) { console.log(tArgs.join(' ')); console.log(aArgs.join(' ')); }
  const mk = a => { const f = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] }); const o = { f, dead: false }; f.stdin.on('error', () => { o.dead = true; }); o.done = new Promise(r => f.on('close', c => { o.dead = true; r(c); })); return o; };
  const T = mk(tArgs), A = mk(aArgs);
  const wr = async (o, buf) => { if (!o.f.stdin.write(buf)) await new Promise(r => o.f.stdin.once('drain', r)); };
  await renderLayers(page, limit, async (i, tx, am) => {
    if (T.dead || A.dead) { await browser.close(); die('ffmpeg 已中止（上方應有 ffmpeg 的錯誤訊息），停止渲染。'); }
    if (dump) { writeFileSync(join(dump, 'text_' + String(i).padStart(6, '0') + '.png'), tx); writeFileSync(join(dump, 'amb_' + String(i).padStart(6, '0') + '.' + (fmt === 'png' ? 'png' : 'jpg')), am); }
    await wr(T, tx); await wr(A, am); }, bgOf);
  T.f.stdin.end(); A.f.stdin.end(); const [c1, c2] = await Promise.all([T.done, A.done]); await browser.close();
  if (bgVideo && !args['keep-bg']) rmSync(bgDir, { recursive: true, force: true });
  if (c1 || c2) die('ffmpeg 失敗（代碼 ' + (c1 || c2) + '）。分層輸出需要 prores_ks 與 libx264。');
  console.log('完成：' + join(outDir, 'text_alpha.mov') + '、' + join(outDir, 'ambient.mp4') + '\n（疊合：text_alpha.mov 放在 ambient.mp4 上方；注意依賴背景的效果如整頁反白閃光無法還原）');
  process.exit(0);
}
const inArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(rfps), '-c:v', fmt === 'png' ? 'png' : 'mjpeg', '-i', '-'];
const outs = [];
if (needAlpha) {       // 透明字層：不含音訊與背景
  outs.push({ file: join(outDir, 'text_alpha.mov'), a: ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0'] });
  if (args.webm) outs.push({ file: join(outDir, 'text_alpha.webm'), a: ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-auto-alt-ref', '0'] });
} else {
  outs.push({ file: join(outDir, 'preview.mp4'), a: ['-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'] });
}
const sel = `select=eq(mod(n+1\\,${blur})\\,0),setpts=N/(${fps}*TB)`;
const mbVF = needAlpha ? `format=gbrap16le,premultiply=inplace=1,tmix=frames=${blur},unpremultiply=inplace=1,${sel}` : `tmix=frames=${blur},${sel}`;
const postVF = post && !needAlpha ? postFilter(post, W, H) : '';   // 接在動態模糊之後，與 mbVF 合併成單一 -vf
const vf = [blur > 1 ? mbVF : '', postVF].filter(Boolean).join(',');
const ffArgs = [...inArgs, ...(audio && !needAlpha ? ['-i', audio] : [])];
for (const o of outs) ffArgs.push('-map', '0:v', ...(audio && !needAlpha ? ['-map', '1:a?', '-c:a', 'aac', '-b:a', '192k'] : []), ...(vf ? ['-vf', vf, ...(blur > 1 ? ['-r', String(fps)] : [])] : []), ...o.a, '-t', String(limit / rfps), o.file);
if (args['debug-ffmpeg']) console.log(ffArgs.join(' '));
const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
let ffDead = false; ff.stdin.on('error', () => { ffDead = true; });
const done = new Promise(r => ff.on('close', c => { ffDead = true; r(c); }));
await renderAll(page, limit, async (i, buf) => {
  if (ffDead) { await browser.close(); die('ffmpeg 已中止（上方應有 ffmpeg 的錯誤訊息），停止渲染。'); }
  if (dump) writeFileSync(join(dump, String(i).padStart(6, '0') + '.' + (fmt === 'png' ? 'png' : 'jpg')), buf);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }, bgOf);
if (args['debug-beats']) console.log('音訊節拍觸發次數：' + await page.evaluate(() => abeat));
ff.stdin.end(); const code = await done; await browser.close();
if (bgVideo && !args['keep-bg']) rmSync(bgDir, { recursive: true, force: true });
if (code) die('ffmpeg 失敗（代碼 ' + code + '）。若是透明輸出，請確認 ffmpeg 支援 prores_ks。');
console.log('完成：' + outs.map(o => o.file).join('、') + (audio && needAlpha ? '\n（透明字層不含音訊，已忽略 --audio）' : ''));
