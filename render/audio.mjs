// 預先分析音訊：重現瀏覽器 AnalyserNode.getByteFrequencyData 的結果（fftSize=1024、Blackman 窗、
// smoothingTimeConstant=0.8、-100~-30 dB），只算網頁版節拍偵測用到的低頻 bin。
// 網頁版約每 1/60 秒分析一次；若渲染 fps 不是 60，每格內補做 round(60/fps) 次分析，使平滑特性與預覽一致。
import { spawnSync } from 'node:child_process';

export function analyzeAudio(file, fps, frames, sr = 44100) {
  const N = 1024, S = Math.max(1, Math.round(60 / fps)), R = fps * S, tau = Math.pow(0.8, 60 / R);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status || !r.stdout || r.stdout.length < 4096) return null;          // 沒有音軌或讀不到
  const buf = r.stdout, pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length - (buf.length % 4)));
  const bw = sr / N, lo = Math.max(1, Math.floor(40 / bw)), hi = Math.ceil(150 / bw), nb = hi - lo + 1;
  const win = new Float64Array(N), cs = [], sn = [];
  for (let n = 0; n < N; n++) win[n] = 0.42 - 0.5 * Math.cos(2 * Math.PI * n / N) + 0.08 * Math.cos(4 * Math.PI * n / N);
  for (let k = lo; k <= hi; k++) { cs.push(Float64Array.from({ length: N }, (_, n) => Math.cos(2 * Math.PI * k * n / N))); sn.push(Float64Array.from({ length: N }, (_, n) => Math.sin(2 * Math.PI * k * n / N))); }
  const sm = new Float64Array(nb), rows = new Uint8Array(frames * S * nb);
  for (let i = 0; i < frames; i++) for (let j = 0; j < S; j++) {
    const t = i / fps - (S - 1 - j) / R;
    const end = Math.max(0, Math.floor(t * sr / 128) * 128), start = end - N;      // 瀏覽器以 128 樣本為單位更新
    for (let b = 0; b < nb; b++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const idx = start + n; if (idx < 0 || idx >= pcm.length) continue; const v = pcm[idx] * win[n]; re += v * cs[b][n]; im -= v * sn[b][n]; }
      sm[b] = tau * sm[b] + (1 - tau) * Math.hypot(re, im) / N;
      const db = 20 * Math.log10(sm[b]);
      rows[(i * S + j) * nb + b] = sm[b] > 0 ? Math.max(0, Math.min(255, Math.floor(255 / 70 * (db + 100)))) : 0;
    }
  }
  return { lo, hi, S, R, sr, rows: Array.from(rows) };
}
