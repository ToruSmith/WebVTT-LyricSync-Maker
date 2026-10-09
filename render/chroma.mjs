// 綠幕輸出（--chroma）：解析顏色、強制關閉會把顏色混進背景的設定。
// run.mjs 與 test/chroma.mjs 共用這份，避免兩邊各寫一份而不同步。
// 網頁端（index.html）另有 html.chroma 的 CSS 安全網：隱藏畫布／遮罩／影片、關閉整頁濾鏡與各種陰影。

export const DEFAULT_KEY = '#00ff00';

// 接受 #rrggbb、rrggbb、#rgb、rgb（大小寫皆可）；true／空字串／undefined → 預設綠。其他一律丟錯。
export function parseKey(v) {
  if (v === true || v === '' || v === undefined || v === null) return DEFAULT_KEY;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(v).trim());
  if (!m) throw new Error(`--chroma 的顏色「${v}」不合法（請寫 #rrggbb 或 #rgb，例如 #00ff00；不給值則用 ${DEFAULT_KEY}）`);
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1];
  return '#' + h.toLowerCase();
}

// 綠幕下強制關閉的設定：遮罩暗度 0、粒子／噪點／暗角／掃描線、色調與亮度、文字陰影、Ken Burns、各種疊加特效
export const CHROMA_OFF = { dim: 0, particles: 0, scan: 0, grain: 0, vignette: 0, tone: '', brightness: 100, textShadow: false, kb: false, bokeh: 0, leak: 0, lightning: 0, scratch: 0, crt: 0, vhs: 0, invBar: 0 };

// 回傳套用綠幕後的 config（不修改傳入物件）：純色背景＝key、其餘照上表關閉
export const applyChroma = (config, key) => ({ ...(config || {}), ...CHROMA_OFF, chroma: key, bgMode: 'solid', bgColor: key });
