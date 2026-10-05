# 動態歌詞字幕工具：功能手冊與 SRT 標記指南

本文件分兩部分：

- **第一部分**：功能速查，方便你快速知道工具有什麼、效果是什麼。
- **第二部分**：給 Gemini（或其他 AI）看的指令。把本文件第二部分連同你的 SRT 一起貼給它，它就會輸出帶標記、可直接載入工具的 SRT。

---

# 第一部分：功能速查

## 1. 標記語法

標記寫在每一句字幕文字的**最前面**：

```
#版型+進場動畫+退場動畫~特效1,特效2 歌詞文字
```

- 每一段都可省略，但**順序固定**：版型 → 進場 → 退場 → 特效。
- 只想指定退場、不指定進場時，進場要補 `fade`：`#neon+fade+sink`。
- 特效最多 3 個，超過會被忽略。
- `{字}` 大括號用於部分版型（見下表），其他版型**不要使用**，否則括號內的字會從畫面消失。
- 沒有標記時：句中有 `{}` 用 split，否則用 lowerleft。

範例：

```
#split+rise 你慢慢的。{靠}{近}
#neon+zoomin+blur-out~flicker 在夜色裡發光
#bounce 我承认。
```

## 2. 版型（共 35 種）

「字數」是適合的歌詞長度，超過會自動換行縮小，但效果較差。「內建進場」表示該版型有自己的進場動畫，**忽略**進場欄位。

| 版型 | 效果 | 適合字數 | 括號 | 內建進場 |
|---|---|---|---|---|
| split | 左右大字貼邊，中間小字拉開字距，兩側細線拉出 | 小字 ≤14 | `{左}{右}` 各 1 字 | 是 |
| lowerleft | 左下小字，字前有「。」，下方長線拉出 | 4–30 | 無 | 否（支援全部進場） |
| bounce | 逐字從下方彈入，帶回彈 | 2–10 | 無 | 是 |
| slam | 整句大字縮小砸下，震動加閃白 | 2–6 | 無 | 是 |
| neon | 霓虹發光字 | 2–12 | 無 | 否 |
| karaoke | 逐字由暗掃成亮，依句長分配 | 4–25 | 無 | 否 |
| typewriter | 逐字打出，尾端游標閃爍 | 4–30 | 無 | 是 |
| vertical | 直書靠右，旁邊細直線 | 2–12 | 無 | 否 |
| blurfocus | 從模糊寬字距收攏對焦 | 2–12 | 無 | 是 |
| wipe | 由左到右擦出，帶一道亮線 | 2–14 | 無 | 是 |
| glitch | RGB 色差分離加故障抖動 | 2–10 | 無 | 是 |
| stack | 大字上下堆疊（最多 3 行），左右交錯 | 3–9 | 無 | 是 |
| outline-big | 超大空心描邊字當背景（取前 3 字），小字疊前 | 3–10 | 無 | 否 |
| subtitle-box | 底部傳統字幕條，半透明底加逐字掃色 | 6–40 | 無 | 是 |
| poster | 大標加小字加細線，海報風 | 標題 2–6，副標 ≤20 | `{標題}` | 否 |
| scroll | Apple Music 式，前後句模糊，當前句發亮 | 任意 | 無 | 是 |
| orbit | 文字沿圓弧排列並緩慢旋轉 | 4–16 | 無 | 是 |
| diagonal | 文字斜 -8°，大字貼角落 | 副標 ≤16 | `{大字}` 1–2 字 | 否 |
| marquee | 一行字水平無限滾動，雙層反向 | 2–10 | 無 | 是 |
| circle-badge | 小字沿圓圈旋轉，中央一個大字 | 3–12 | `{中央字}` | 否 |
| zoom-tunnel | 文字連續放大淡出，穿梭感 | 2–8 | 無 | 是 |
| split-screen | 上下兩塊，各放半句，錯位後對齊 | 4–12 | 無 | 是 |
| flash-words | 整句拆開，一拍一組全螢幕閃現 | 用**空格**分詞，3 組以上最佳 | 無 | 是 |
| keyword | 小字帶過，`{}` 的詞放大換強調色 | 8–24 | `{關鍵詞}` 1–4 字 | 是 |
| trail | 文字左右擺動，帶殘影 | 2–10 | 無 | 是 |
| text-mask | 粗體字內是流動漸層 | 2–8 | 無 | 否 |
| danmaku | 同一句從右向左飛過三層 | 2–16 | 無 | 是 |
| longshadow | 粗字加長斜陰影，扁平海報風 | 2–8 | 無 | 否 |
| bubble | 漫畫對話框，彈出有擠壓拉伸 | 2–16 | 無 | 是 |
| border-run | 畫面外框描線繞一圈，中間放主句 | 2–14 | 無 | 否 |
| blinds | 文字被切成直條，上下交錯滑入（百葉窗） | 2–10 | 無 | 是 |
| hanko | 直書加紅色朱印，和風 | 2–14 | `{印章字}` 1 字 | 否 |
| collage | 拼貼勒索信，每字不同字體、大小、紙片 | 3–12 | 無 | 是 |
| handwrite | 手寫字體由左向右描出，底下一條線 | 4–20 | 無 | 是 |
| marker | 螢光筆掃過 `{}` 的詞，沒有 `{}` 則整句刷 | 4–24 | `{重點詞}` | 是 |

括號補充：

- split、poster、diagonal、circle-badge、hanko 的 `{}` 內容會**從小字中移除**，另外顯示成大字或印章。
- keyword、marker 的 `{}` 內容**保留在句中原位**，只是被強調。
- split 只有一個 `{}` 時，大字只放左側。

## 3. 進場動畫（14 種）

預設約 0.6 秒。只對「無內建進場」的版型有效。

| 名稱 | 效果 | 備註 |
|---|---|---|
| fade | 淡入 | 通用 |
| rise | 由下浮起並淡入 | 通用 |
| drop | 由上掉落，帶回彈 | 通用 |
| zoomin | 由小放大 | 通用 |
| zoomout | 由大縮小，對焦感 | 通用 |
| spin | Y 軸旋轉進入 | 通用 |
| elastic | 彈性縮放，像果凍 | 通用 |
| swing | 像掛牌一樣擺動後停住 | 通用 |
| mask-up | 文字從遮罩下方升起 | 通用 |
| split-reveal | 從中線向上下展開 | 通用 |
| stagger | 逐字依序淡入 | **只有 lowerleft 是逐字，其他版型退回 fade** |
| ripple | 逐字波浪式起伏進場 | 同上 |
| flip | 逐字 3D 翻牌 | 同上 |
| scramble | 亂碼逐字定格成正確字 | 同上 |

## 4. 退場動畫（8 種）

預設約 0.4 秒，在該句結束前完成。**所有版型都有效**。

| 名稱 | 效果 | 備註 |
|---|---|---|
| fade | 淡出 | 預設 |
| sink | 下沉淡出 | |
| zoomout-fade | 放大淡出 | |
| blur-out | 模糊淡出 | 較吃效能 |
| slide-out | 向左滑出 | |
| glitch-out | 故障抖動後消失 | |
| dissolve | 逐字隨機消散 | 逐字效果只在有逐字結構的版型（lowerleft、bounce、karaoke、typewriter、subtitle-box、handwrite），其餘退回模糊淡出 |
| shatter | 逐字飛散 | 同上，其餘退回停留後淡出 |

## 5. 持續特效（11 種，可疊加，單句最多 3 個）

| 名稱 | 效果 | 備註 |
|---|---|---|
| float | 緩慢上下漂浮 | 安全 |
| shake | 隨機微震 | 安全 |
| flicker | 螢光燈式不規則閃爍 | 安全 |
| rainbow | 色相緩慢旋轉 | 安全 |
| stopmotion | 停格抖動（約每秒 7–8 格） | 安全，適合手作風 |
| wave | 逐字正弦波浮動 | 無逐字結構的版型整體浮動 |
| shimmer | 高光掃過，每數秒一次 | 安全 |
| gradient-flow | 文字漸層色流動 | **不要配 karaoke、highlight-word**（顏色衝突） |
| chromatic | 持續輕微 RGB 色差 | 會蓋掉 neon 的發光 |
| outline-pulse | 外框隨節拍亮滅 | |
| highlight-word | 逐字高亮游標，依句長推進 | 只有逐字結構的版型有效 |

## 6. 其他功能（不寫在 SRT，用面板設定）

- **節奏**：BPM、offset、Tap 打拍子、呼吸脈衝、大字彈跳、每小節閃白、隨拍旋轉。節拍來源可選固定 BPM 或音訊低頻偵測。
- **句間轉場**：cut、flash、crossfade、wipe、zoom-through。
- **疊加層**：光斑、漏光、閃電、老電影刮痕、CRT 畫素格、VHS 抖動與追蹤線、每小節反相閃。
- **氛圍**：粒子（光點、雪、雨、櫻花、星空）、掃描線、噪點、暗角、背景暗度。
- **色彩**：原色、黑白、復古褪色、冷色調、暖色調；緩慢推近（Ken Burns）。
- **字體**：六組系統字體堆疊、可上傳字體、字重、字距、顏色、強調色。
- **畫面比例**：填滿視窗、16:9、9:16 直式。
- **預設組合（10 組）**：動畫PV、霓虹夜、簡約明體、強烈節奏、遊戲PV、復古VHS、櫻花日系、賽博龐克、極簡海報、街頭拼貼。
- **工具**：句子編輯器（逐句改標記並匯出 SRT）、隨機化、設定匯出入、錄製幀率與輕量模式。
- **錄製**：全螢幕錄製，倒數後自動播放、自動停止、自動下載；示範模式為靜音。
- **快捷鍵**：空白鍵播放或暫停，左右鍵跳轉 5 秒。

---

# 第二部分：給 Gemini 的指令（SRT 轉標記 SRT）

> 使用方式：把下面「角色與任務」之後的全部內容，加上你的 SRT 檔，一起貼給 Gemini。

## 角色與任務

你是動態歌詞字幕的導演。我會給你一份歌詞 SRT，請你替**每一句**加上標記，輸出一份可直接載入「動態歌詞字幕工具」的 SRT。

## 輸出格式（務必遵守）

1. 只輸出 SRT 內容，放在**一個程式碼區塊**裡，不要加任何說明。若需要說明，寫在程式碼區塊**之後**。
2. **不得更動**序號、時間軸。歌詞文字**不得增刪改**，唯一允許的變動是：在第一行最前面加標記，以及依規則加上 `{}`。
3. 標記格式：`#版型+進場+退場~特效1,特效2 `（標記後接一個空格再接歌詞）。
4. 標記只放在每句**第一行**的最前面；多行歌詞的第二行以後不加標記。
5. 每一句都要有標記，不要留空。
6. 只能使用下面「允許清單」裡的名稱，拼字必須完全一致，全部小寫，不可自創。

## 允許清單

版型：`split` `lowerleft` `bounce` `slam` `neon` `karaoke` `typewriter` `vertical` `blurfocus` `wipe` `glitch` `stack` `outline-big` `subtitle-box` `poster` `scroll` `orbit` `diagonal` `marquee` `circle-badge` `zoom-tunnel` `split-screen` `flash-words` `keyword` `trail` `text-mask` `danmaku` `longshadow` `bubble` `border-run` `blinds` `hanko` `collage` `handwrite` `marker`

進場：`fade` `rise` `drop` `zoomin` `zoomout` `spin` `elastic` `swing` `mask-up` `split-reveal` `stagger` `ripple` `flip` `scramble`

退場：`fade` `sink` `zoomout-fade` `blur-out` `slide-out` `glitch-out` `dissolve` `shatter`

特效：`float` `shake` `flicker` `rainbow` `stopmotion` `wave` `shimmer` `gradient-flow` `chromatic` `outline-pulse` `highlight-word`

## 語法細節（容易出錯，請仔細看）

- 順序固定：`#版型+進場+退場~特效`。每段可省略，但**不能跳過前面的段落**。想只指定退場，進場要填 `fade`：`#neon+fade+sink`。
- 特效用逗號分隔、不加空格，最多 3 個：`~float,shimmer`。
- 只有下列版型可以使用 `{}`，其他版型一律不得出現 `{}`：
  - `split`：`{左大字}{右大字}`，各 1 個字，取自該句歌詞；這兩個字會從小字中移除。只給一個 `{}` 時大字放左側。
  - `poster`：`{標題}`，2–6 字，取自該句，標題會從副標中移除。
  - `diagonal`：`{大字}`，1–2 字。
  - `circle-badge`：`{中央字}`，1 個字。
  - `hanko`：`{印章字}`，1 個字。
  - `keyword`：`{關鍵詞}`，1–4 字，**保留在原位**，只是被放大強調。
  - `marker`：`{重點詞}`，可 1–2 處，**保留在原位**，被螢光筆掃過。
- 若使用 `split`、`poster`、`diagonal`、`circle-badge`、`hanko`，被 `{}` 框住的字會從小字移除，請確認剩下的小字仍然通順，或接受大字與小字分開閱讀的效果。
- `flash-words` 靠**空格**分詞。若原歌詞沒有空格，可在詞語之間加空格（例如 `快 跑 不 要 停下來`），這是唯一允許新增空格的情況。
- 標記中不要出現中文標點或全形字元。

## 能力限制（避免選了沒效果的組合）

1. **內建進場的版型會忽略進場欄位**：`split`（部分）`bounce` `slam` `typewriter` `blurfocus` `wipe` `glitch` `stack` `subtitle-box` `scroll` `orbit` `marquee` `zoom-tunnel` `split-screen` `flash-words` `keyword` `trail` `danmaku` `bubble` `blinds` `collage` `handwrite` `marker`。這些版型可以只寫版型，或只寫版型加退場（進場填 `fade`）。
2. **進場欄位真正有效的版型**：`lowerleft` `neon` `karaoke` `vertical` `outline-big` `poster` `diagonal` `text-mask` `longshadow` `border-run` `hanko`。
3. **逐字進場** `stagger` `ripple` `flip` `scramble` 只有 `lowerleft` 會真的逐字，其他版型會退回淡入。要用這四種時請搭配 `lowerleft`。
4. **退場 `dissolve` `shatter`** 的逐字效果只在 `lowerleft` `bounce` `karaoke` `typewriter` `subtitle-box` `handwrite` 有效，其他版型請改用 `fade` `sink` `zoomout-fade` `blur-out` `slide-out` `glitch-out`。
5. **特效衝突**：`gradient-flow` 不要配 `karaoke`；`chromatic` 不要配 `neon`；`highlight-word` 只配 `lowerleft` `bounce` `karaoke` `typewriter` `subtitle-box` `handwrite`。
6. **時間長度**：該句長度（結束減開始）小於 1.2 秒時，只用簡單組合（如 `#neon`、`#lowerleft+fade`），不要用 `flash-words` `border-run` `karaoke` `handwrite` `typewriter` `danmaku`。進場約 0.6 秒、退場約 0.4 秒，太短會來不及看清。
7. **字數**：短句（≤6 字）可用大字衝擊類版型；長句（>15 字）請用適合長文的版型，避免文字過小。

## 選擇策略

**第一步：理解歌曲結構。** 先通讀整份歌詞，判斷哪些是主歌（安靜敘事）、預歌、副歌（高潮、重複）、橋段、尾聲。

**第二步：依情緒與位置選版型。**

| 段落或情緒 | 優先版型 | 搭配 |
|---|---|---|
| 主歌，安靜敘事 | `lowerleft` `typewriter` `handwrite` `subtitle-box` `scroll` `vertical` | 進場 `rise` `fade`；特效少用或 `float` |
| 溫柔、思念、日系 | `handwrite` `hanko` `blurfocus` `vertical` `marker` | 退場 `fade` `sink`；特效 `float` |
| 預歌，情緒堆疊 | `bounce` `keyword` `marker` `split` `karaoke` | 進場 `rise` `zoomin` |
| 副歌，高潮 | `slam` `flash-words` `split` `longshadow` `outline-big` `text-mask` `bubble` | 退場 `zoomout-fade` `glitch-out`；特效 `shimmer` `outline-pulse` |
| 夜晚、都會、霓虹 | `neon` `glitch` `circle-badge` `zoom-tunnel` | 特效 `flicker` `chromatic`（chromatic 不配 neon） |
| 憤怒、故障、緊張 | `glitch` `slam` `trail` `collage` | 退場 `glitch-out`；特效 `shake` |
| 街頭、叛逆、手作感 | `collage` `longshadow` `bubble` `diagonal` | 特效 `stopmotion` `shake` |
| 唱和、熱鬧、輕快 | `danmaku` `marquee` `bounce` `trail` | 特效 `wave` |
| 重點詞需要被看見 | `keyword` `marker` `poster` `split` | 把關鍵詞放進 `{}` |
| 橋段、轉折、夢境 | `blurfocus` `orbit` `zoom-tunnel` `split-screen` `border-run` | 進場 `zoomout`；特效 `float` `rainbow` |
| 尾聲、收束 | `poster` `hanko` `lowerleft` `blurfocus` | 退場 `fade` `sink` |

**第三步：遵守節奏與多樣性。**

1. **不得連續兩句使用相同版型。**
2. 同一首歌的版型種類盡量多樣，但副歌相同歌詞可以重複使用相同組合，製造記憶點。
3. 副歌強度要明顯高於主歌：主歌用安靜版型，副歌用衝擊版型。
4. 全曲約 30–40% 的句子加特效，不要每句都加。
5. 進場動畫在相鄰句子間輪替，避免連續相同。
6. 重型效果（`blur-out` `blurfocus` `blinds` `longshadow` `trail`）不要連續出現，也不要超過全曲 20%。
7. 單句最多 3 個特效，通常 0–2 個即可。

**第四步：挑選 `{}` 的字。** 使用 `split` 時，挑選意象最強、最適合大字展示的兩個字（例如「靠」「近」、「光」「影」）。使用 `keyword`、`marker` 時，挑選情感核心詞。

## 範例

輸入：

```
1
00:00:01,000 --> 00:00:04,000
你慢慢的靠近

2
00:00:04,500 --> 00:00:07,000
我承認

3
00:00:07,500 --> 00:00:10,000
不要回頭

4
00:00:10,500 --> 00:00:14,500
在夜色裡發光

5
00:00:15,000 --> 00:00:19,000
把最重要的話說出口
```

輸出：

```
1
00:00:01,000 --> 00:00:04,000
#split+rise 你慢慢的{靠}{近}

2
00:00:04,500 --> 00:00:07,000
#handwrite 我承認

3
00:00:07,500 --> 00:00:10,000
#slam+fade+glitch-out 不要回頭

4
00:00:10,500 --> 00:00:14,500
#neon+zoomin+blur-out~flicker 在夜色裡發光

5
00:00:15,000 --> 00:00:19,000
#marker 把最重要的話{說出口}
```

## 輸出前自我檢查（請在內部逐項確認）

- [ ] 序號與時間軸完全沒變。
- [ ] 歌詞文字完全沒變（除了加 `{}`，以及 `flash-words` 的空格）。
- [ ] 每一句都有標記，標記在第一行最前面，標記後有一個空格。
- [ ] 所有名稱都在允許清單內，拼字完全一致。
- [ ] 沒有連續兩句相同版型。
- [ ] `{}` 只出現在 `split` `poster` `diagonal` `circle-badge` `hanko` `keyword` `marker`。
- [ ] `split` 的 `{}` 是 1 個字，且取自該句。
- [ ] 每句特效不超過 3 個，沒有 `gradient-flow`+`karaoke`、`chromatic`+`neon` 這類衝突。
- [ ] 1.2 秒以內的短句沒有使用複雜版型。
- [ ] 沒有為了指定退場而漏掉進場欄位（需要時進場填 `fade`）。
- [ ] 輸出只有一個程式碼區塊。

---

# 常見問題

**Q：標記寫錯了會怎樣？**
工具遇到不認識的版型時，會退回 lowerleft；不認識的進場會退回淡入、退場退回淡出，不認識的特效會被忽略，都不會報錯。但為了效果正確，請盡量照允許清單。

**Q：為什麼我指定的進場動畫沒有效果？**
該版型有內建進場。查第一部分「版型」表的「內建進場」欄，或改用「進場欄位真正有效」的版型。

**Q：如何手動修改 AI 產生的標記？**
載入 SRT 後，點「句子編輯器」逐句用下拉選單調整，改完可以再匯出新的 SRT。
