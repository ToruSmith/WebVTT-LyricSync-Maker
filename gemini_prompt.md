# Gemini 提示詞：歌詞 SRT 轉動態字幕標記 SRT

> 使用方式：複製下面「===== 開始 =====」到「===== 結束 =====」之間的全部內容，貼到 Gemini 新對話。先改「我的偏好」，再把 SRT 貼到最後面的指定位置。

===== 開始 =====

# 任務

你是動態歌詞字幕的導演。我會給你一份歌詞 SRT，請替**每一句**加上標記，輸出一份可以直接載入「動態歌詞字幕工具」的 SRT。

# 我的偏好（請照做；沒填的項目由你判斷）

- 歌曲風格與情緒：（例：抒情慢歌、夜晚、帶點孤獨）
- 整體強度：（安靜 / 適中 / 強烈）
- 想多用的版型：（可留白）
- 不想用的版型：（可留白）
- 畫面比例：（16:9 / 9:16 直式）
- 特效偏好：（少 / 適中 / 多）

# 輸出規則（最重要，違反就是錯誤）

1. 輸出的第一個字元必須是序號 `1`。只輸出一個程式碼區塊，區塊內是完整 SRT；不要寫任何前言。如果需要說明，寫在程式碼區塊之後，且不超過 5 行。
2. 序號、時間軸**完全不得更動**。歌詞文字**不得增刪改**，唯一允許的變動是：
   - 在每句第一行最前面加標記。
   - 依下面規則加上 `{}`。
   - `flash-words` 版型可以在詞語間加空格。
3. 每一句都要有標記，標記後接一個**半形空格**再接歌詞。多行歌詞只在第一行加標記。
4. 只能使用「允許清單」裡的名稱，全部小寫，拼字一致，不可自創。

# 標記格式

```
#版型+進場+退場~特效1,特效2 歌詞
```

- 順序固定：版型、進場、退場、特效。每段都可省略，但**不能跳過前面的段落**。
- 只想指定退場時，進場要填 `fade`：`#neon+fade+sink`。
- 特效用逗號分隔、不加空格，單句最多 3 個。
- 標記裡不得出現中文標點或全形字元。

# 允許清單

版型（35）：`split` `lowerleft` `bounce` `slam` `neon` `karaoke` `typewriter` `vertical` `blurfocus` `wipe` `glitch` `stack` `outline-big` `subtitle-box` `poster` `scroll` `orbit` `diagonal` `marquee` `circle-badge` `zoom-tunnel` `split-screen` `flash-words` `keyword` `trail` `text-mask` `danmaku` `longshadow` `bubble` `border-run` `blinds` `hanko` `collage` `handwrite` `marker`

進場（14）：`fade` `rise` `drop` `zoomin` `zoomout` `spin` `elastic` `swing` `mask-up` `split-reveal` `stagger` `ripple` `flip` `scramble`

退場（8）：`fade` `sink` `zoomout-fade` `blur-out` `slide-out` `glitch-out` `dissolve` `shatter`

特效（11）：`float` `shake` `flicker` `rainbow` `stopmotion` `wave` `shimmer` `gradient-flow` `chromatic` `outline-pulse` `highlight-word`

# `{}` 大括號規則

只有下列版型可以使用 `{}`，其他版型**一律不得出現 `{}`**（否則括號內的字會從畫面消失）：

| 版型 | 寫法 | 說明 |
|---|---|---|
| split | `{左字}{右字}` | 各 1 字，取自該句；會從小字移除，另外變成左右大字。只寫一個 `{}` 則大字放左側 |
| poster | `{標題}` | 2–6 字，取自該句；變成大標，從副標移除 |
| diagonal | `{大字}` | 1–2 字，變成斜貼角落的大字，從小字移除 |
| circle-badge | `{中央字}` | 1 字，放圓圈中央，從環繞字移除 |
| hanko | `{印章字}` | 1 字，變成朱印，從直書字移除 |
| keyword | `{關鍵詞}` | 1–4 字，**留在原位**並放大強調 |
| marker | `{重點詞}` | 可 1–2 處，**留在原位**被螢光筆掃過 |

使用前五種（會移除括號內文字）時，請確認剩下的小字仍然通順。

# 複製即用的建議寫法

每個版型的安全寫法（括號內為可替換部分）。「無進場」表示該版型自帶進場，不要再填進場。

```
split         #split+rise 小字{靠}{近}
lowerleft     #lowerleft+rise          （也可 +stagger / +scramble / +flip / +ripple，只有它會逐字）
bounce        #bounce                  （退場可加：#bounce+fade+sink）
slam          #slam                    （退場可加：#slam+fade+glitch-out）
neon          #neon+zoomin             （也可 +fade / +elastic）
karaoke       #karaoke+fade
typewriter    #typewriter
vertical      #vertical+fade
blurfocus     #blurfocus
wipe          #wipe
glitch        #glitch
stack         #stack
outline-big   #outline-big+rise
subtitle-box  #subtitle-box
poster        #poster+mask-up 副標{大標}
scroll        #scroll
orbit         #orbit
diagonal      #diagonal+rise 小字{大}
marquee       #marquee
circle-badge  #circle-badge 環繞字{中}
zoom-tunnel   #zoom-tunnel
split-screen  #split-screen
flash-words   #flash-words 快 跑 不 要 停
keyword       #keyword 我只想{擁抱}你
trail         #trail
text-mask     #text-mask+zoomin
danmaku       #danmaku
longshadow    #longshadow+zoomin
bubble        #bubble
border-run    #border-run+fade
blinds        #blinds
hanko         #hanko+fade 直書字{印}
collage       #collage
handwrite     #handwrite
marker        #marker 把話{說出口}
```

# 能力限制（避免選了沒效果的組合）

1. 自帶進場的版型會**忽略**進場欄位：`bounce` `slam` `typewriter` `blurfocus` `wipe` `glitch` `stack` `subtitle-box` `scroll` `orbit` `marquee` `zoom-tunnel` `split-screen` `flash-words` `keyword` `trail` `danmaku` `bubble` `blinds` `collage` `handwrite` `marker`。這些版型不要填進場，需要退場時進場填 `fade`。
2. 進場欄位真正有效的版型：`lowerleft` `neon` `karaoke` `vertical` `outline-big` `poster` `diagonal` `text-mask` `longshadow` `border-run` `hanko`，`split` 只有 `rise` 以外的才會額外作用。
3. 逐字進場 `stagger` `ripple` `flip` `scramble` 只有 `lowerleft` 會真的逐字，要用請搭配 `lowerleft`。
4. 退場 `dissolve` `shatter` 的逐字效果只在 `lowerleft` `bounce` `karaoke` `typewriter` `subtitle-box` `handwrite` 有效；其他版型請用 `fade` `sink` `zoomout-fade` `blur-out` `slide-out` `glitch-out`。
5. 特效衝突：`gradient-flow` 不配 `karaoke`；`chromatic` 不配 `neon`；`highlight-word` 只配 `lowerleft` `bounce` `karaoke` `typewriter` `subtitle-box` `handwrite`。
6. 時間長度（結束減開始）小於 1.2 秒的句子，只用簡單組合，不要用 `flash-words` `border-run` `karaoke` `handwrite` `typewriter` `danmaku`。
7. 字數：≤6 字可用大字衝擊類版型（`slam` `longshadow` `outline-big` `text-mask`）；>15 字請用 `lowerleft` `subtitle-box` `typewriter` `marker` `keyword` `scroll` `karaoke` 這類適合長文的版型。
8. 若畫面比例是 9:16 直式，少用 `split` `marquee` `danmaku` `orbit`，多用 `lowerleft` `keyword` `marker` `slam` `vertical` `stack` `hanko` `bubble`。
9. 英文或中英混合歌詞，避免 `vertical` `hanko` `stack`。

# 選擇策略

**先通讀整首歌詞**，判斷主歌、預歌、副歌、橋段、尾聲，再依段落與情緒選：

| 段落或情緒 | 優先版型 | 搭配 |
|---|---|---|
| 主歌，安靜敘事 | `lowerleft` `typewriter` `handwrite` `subtitle-box` `scroll` `vertical` | 進場 `rise` `fade`；特效少用或 `float` |
| 溫柔、思念、日系 | `handwrite` `hanko` `blurfocus` `vertical` `marker` | 退場 `fade` `sink`；特效 `float` |
| 預歌，情緒堆疊 | `bounce` `keyword` `marker` `split` `karaoke` | 進場 `rise` `zoomin` |
| 副歌，高潮 | `slam` `flash-words` `split` `longshadow` `outline-big` `text-mask` `bubble` | 退場 `zoomout-fade` `glitch-out`；特效 `shimmer` `outline-pulse` |
| 夜晚、都會、霓虹 | `neon` `glitch` `circle-badge` `zoom-tunnel` | 特效 `flicker` `chromatic`（不配 neon） |
| 憤怒、緊張 | `glitch` `slam` `trail` `collage` | 退場 `glitch-out`；特效 `shake` |
| 街頭、叛逆、手作 | `collage` `longshadow` `bubble` `diagonal` | 特效 `stopmotion` `shake` |
| 熱鬧、輕快 | `danmaku` `marquee` `bounce` `trail` | 特效 `wave` |
| 重點詞要被看見 | `keyword` `marker` `poster` `split` | 把關鍵詞放進 `{}` |
| 橋段、夢境 | `blurfocus` `orbit` `zoom-tunnel` `split-screen` `border-run` | 進場 `zoomout`；特效 `float` `rainbow` |
| 尾聲、收束 | `poster` `hanko` `lowerleft` `blurfocus` | 退場 `fade` `sink` |

**節奏與多樣性規則：**

1. **不得連續兩句相同版型。**
2. 副歌強度明顯高於主歌；重複的副歌歌詞可以用相同組合，製造記憶點。
3. 約 30–40% 的句子加特效，其餘不加；單句最多 3 個，通常 0–2 個。
4. 進場動畫在相鄰句之間輪替。
5. 重型效果（`blur-out` `blurfocus` `blinds` `longshadow` `trail`）不要連續出現，總量不超過全曲 20%。
6. 使用 `split` 時，挑意象最強、最適合大字的兩個字；使用 `keyword`、`marker` 時，挑情感核心詞。

# 範例

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

# 輸出前自我檢查（請在內部逐項確認，不要輸出檢查過程）

- [ ] 序號與時間軸完全沒變；歌詞文字完全沒變（除了 `{}` 與 `flash-words` 空格）。
- [ ] 每一句都有標記，位置在第一行最前面，標記後有一個半形空格。
- [ ] 所有名稱都在允許清單內，拼字一致。
- [ ] 沒有連續兩句相同版型。
- [ ] `{}` 只出現在 `split` `poster` `diagonal` `circle-badge` `hanko` `keyword` `marker`，且字數符合規定。
- [ ] 沒有為了指定退場而漏掉進場欄位。
- [ ] 沒有特效衝突，且每句特效不超過 3 個。
- [ ] 1.2 秒以內的短句沒有使用複雜版型。
- [ ] 輸出只有一個程式碼區塊，且第一個字元是序號。

# 我的 SRT（從這裡開始）

【請把 SRT 貼在這一行的下面】

===== 結束 =====
