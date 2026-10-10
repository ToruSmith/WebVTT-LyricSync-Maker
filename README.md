# 動態歌詞字幕工具

- **網頁版**：直接開 `index.html`（或 GitHub Pages），即時預覽 + 全螢幕錄製，用法不變。
- **離線渲染（本機）**：不錄螢幕，逐幀截圖後用 ffmpeg 合成 MP4，不會掉幀。
- 目前共 **53 種版型**、15 種進場、8 種退場、11 種持續特效、10 種逐字樣式（完整名稱表見《功能手冊與 SRT 標記指南》）。
- 排錯：網址加 `?check=1` 開啟，主控台（F12）會印出版型／設定登記是否一致（見「開發備忘」）。

## 離線渲染

需要 Node.js 與 ffmpeg（終端機輸入 `ffmpeg -version` 要能執行）。

    npm install
    npx playwright install chromium      # 只需一次

    # 注意：請直接用 node 執行（不要用 npm run；Windows PowerShell 會吃掉 npm 需要的 -- 符號，導致參數錯亂）
    # 內建範例，先看 5 秒：
    node render/run.mjs --seconds 5 --width 1280 --height 720 --fps 30
    # 自己的專案 + 音樂（合成進 MP4）：
    node render/run.mjs --project input/project.json --audio input/song.mp3 --width 1920 --height 1080 --fps 30
    # 只輸出字（透明字層，給剪輯軟體疊用）：
    node render/run.mjs --project input/project.json --alpha --width 1920 --height 1080 --fps 30
    # 綠幕（純色背景＋只留文字，給不吃透明檔的剪輯軟體用色鍵摳掉）：
    node render/run.mjs --project input/project.json --chroma --width 1920 --height 1080 --fps 30

| 輸出 | 說明 |
|---|---|
| `output/preview.mp4` | 背景＋文字（＋ `--audio` 指定的音樂，或 `--video` 影片自帶的聲音）；加 `--chroma` 時背景是純色，見下方「綠幕輸出」 |
| `output/text_alpha.mov` | `--alpha`：ProRes 4444 透明字層，不含背景與音訊 |
| `output/text_alpha.webm` | 再加 `--webm`：VP9 透明版，檔案小很多 |

**背景影片**：加上 `--video 影片檔`，影片會當背景（遮罩、亮度、對比、飽和、模糊等設定照樣套用）。
總長度有給 `--audio` 就跟著音樂，否則跟著影片（與網頁版載入媒體時相同）；背景影片比總長度短時會自動循環播放。沒給 `--audio` 時使用影片自帶的聲音。
渲染前會先把影片抽成暫存圖片放在 `output/_bg/`（約 100–250 KB／格，完成後自動刪除，加 `--keep-bg` 可保留），請確保磁碟空間足夠。
`--alpha` 時不使用背景影片。

其他參數：`--png` 無損截圖（慢）、`--frames-dir 資料夾` 另存每格圖片（`--alpha` 時為透明 PNG 序列）、`--seconds N` 只渲染前 N 秒。

### 直接使用網頁版匯出的檔案（最簡單）

網頁版面板的「匯出設定 JSON」得到 `lyrics_config.json`，句子編輯器的匯出得到 `lyrics_tagged.srt`，放進 `input/` 後：

    node render/run.mjs --srt input/lyrics_tagged.srt --config input/lyrics_config.json --audio input/song.mp3 --width 1920 --height 1080 --fps 30

### 一鍵匯出渲染專案（網頁版 → project.json）

網頁版面板的「**匯出渲染專案（project.json）**」按鈕，一次下載 `{ srt, config, fonts? }`：

- `srt`：句子編輯器「匯出帶標記的 SRT」同樣的內容（版型、進退場、特效、位置、樣式、副文都在）
- `config`：目前整份設定（與「匯出設定 JSON」相同，內含 `presetName` 等介面欄位，離線端會忽略，無害）
- `fonts`：網頁版**已上傳的自訂字體**，以 base64 放進 `[{ name, b64 }]`（名稱＝檔名去副檔名）；沒有上傳字體時沒有這個欄位。字體檔可能很大（CJK 字體常達數 MB～十幾 MB），提示框會顯示檔案大小。

按下後面板會顯示對應的指令，例如：

    node render/run.mjs --project input/project.json --audio input/song.mp3 --width 1920 --height 1080 --fps 30

**音樂與背景影片檔太大，不會包進 project.json**，請自己放進 `input/`（網頁版有載入媒體時，指令會帶上原檔名；載入影片則用 `--video`）。`--width／--height` 是依目前畫面比例（短邊 1080）給的建議值；離線渲染以該尺寸排版，比例若和預覽不同，版面就會不同。

字體載入順序：`project.json` 內嵌的字體，加上 `input/fonts/`（或 `--fonts`）資料夾裡的字體；兩邊有同名字體時**以資料夾為準**。（早期版本只要 `input/fonts/` 存在，就會把內嵌字體整個蓋掉；已修正。）

**每句字體**：句子編輯器的「每句字體」下拉，現在會寫進 SRT 標記，匯出 SRT／project.json 後離線渲染也看得到。語法是 `*字體名`，放在 `^位置` 之後、`@樣式` 之前，字體名用 URL 編碼（`encodeURIComponent`，`*` 另編成 `%2A`），例如 `#center+fade^bc*ChenYuluoyan-2.0-Thin@neon 歌詞`；只指定字體、其他都自動的句子寫成 `#*字體名 歌詞`。上傳的自訂字體會一起包進 project.json（同名字體以 `input/fonts/` 為準）；找不到字體時，離線端會退回該句原本的字體。舊的 SRT 沒有 `*` 就維持原樣。

**字體優先順序**（強調字 `{}` 與整句共用同一套規則）：這句自己的 `*字體`（整句，含強調字）＞ 面板「強調字字體」＞ 版型預設（`pv-lyric`／`pv-vertical` 預設是毛筆）。詳見下方「強調字字體與毛筆」。

**匯入 project.json**：網頁版面板的「匯入設定 JSON 或渲染專案」現在可以直接吃 project.json，一次還原字幕、設定與字體；音樂與背景影片不在檔案裡，需要重新載入（專案會記下檔名當提示）。

### project.json（進階：把 SRT 與設定合成一個檔）（範例見 `examples/project.example.json`，複製到 `input/`）

`{ "srt": "SRT 全文（可含 # 標記）或 \"@demo\"", "config": { ... } }`，`config` 內的名稱與網頁面板的參數相同，常用的有：

- 背景：`bgMode`（`gradient` 漸層／`solid` 純色／`transparent` 透明）、`bgColor`、`maskColor`、`dim`（遮罩暗度 0–90）、`brightness`（畫面亮度 %，預設 100）
- 影片背景調整：`vidBright`、`vidContrast`、`vidSat`、`vidBlur`
- `textShadow`：文字柔和陰影（提升可讀性）
- `alphaOnly`：只輸出字（隱藏背景、遮罩、粒子、暗角、噪點等所有氛圍層，只留文字）
- 其他：`bpm`、`offset`、`particles`、`grain`、`vignette`、`trans`、`kb` 等

網頁版面板最下方有「背景與亮度」區塊，調整後可直接用面板的設定匯出功能取得這些參數。

## 綠幕輸出（--chroma）

    node render/run.mjs --project input/project.json --chroma            # 預設 #00ff00
    node render/run.mjs --project input/project.json --chroma 0000ff     # 藍幕；也可寫 #rrggbb、rrggbb、#rgb
    # 也可寫在 project.json：config.chroma = "#00ff00"（命令列的 --chroma 優先）

輸出一般的 `preview.mp4`（不是透明檔；ffmpeg 指令與一般 MP4 逐字相同）。在 `run.mjs` 組設定時強制：

- 背景＝純色（`bgMode:solid`、`bgColor`＝你指定的顏色）、遮罩暗度 0；
- 關閉粒子、噪點、暗角、掃描線、色調（`tone`）與亮度（`brightness`）、文字柔和陰影、Ken Burns、散景／漏光／閃電／刮痕／CRT／VHS／反白條；
- 網頁端另有一道保險（`html.chroma`）：隱藏兩層畫布、遮罩與背景影片，關閉整頁濾鏡，並移除 `#L` 內所有 `text-shadow`／`box-shadow`——**所以 `@neon`、`@glow-soft`、`@trail` 這類發光，以及硬邊的 `@longshadow`、`@chromatic`（它們也是 text-shadow）在綠幕下都不會出現**；`#iris-frame` 蓋住全畫面的暗幕、`ripple-pool` 的水波 shader（改走簡化版）同樣不會出現；`pv-lyric`／`pv-vertical` 關鍵字的發光與淡墨暈影也屬 text-shadow／濾鏡，綠幕下只剩字本身。

與其他功能的關係（都會印警告，不會中止）：

| 同時給 | 行為 |
|---|---|
| `--alpha`（或透明背景） | 兩者互相矛盾，**忽略 `--chroma`**，仍輸出透明字層 |
| `--video` | 綠幕沒有背景影片，**畫面忽略**；影片的音軌仍會混入 |
| `--glow`／`--aberration`／`--grade`（含 `config.post`） | **一律忽略**。輝光、色差會把顏色混進背景；調色會讓背景偏離你指定的顏色 |
| `--blur`、`--audio`、`--png`、`--frames-dir` | 照常運作 |

摳像時請注意（這些是我量到的，不是推測）：

1. **用剪輯軟體的取樣工具從畫面上吸背景色，不要手打色碼。** 輸出是 yuv420p 且沒有標色彩空間。ffmpeg 以 BT.601 轉換，解碼回來 `#00ff00` 約為 (0,254,0)；但很多播放器／剪輯軟體對 HD 解析度預設用 BT.709 解讀，同一個檔案會變成約 (0,215,0)。取樣就不會有這個問題。
2. 4:2:0 色度子取樣會讓文字邊緣的綠邊多 1–2 像素的色度模糊；模糊進出場、半透明字的邊緣也一定會和綠色混合。建議開軟體的「去除溢色（despill）」。要最乾淨的邊緣可加 `--png --frames-dir 資料夾` 輸出無損圖片序列（慢很多）。
3. 版型自己畫的**不透明**裝飾（`hud-frame` 的框、`laser-scan` 的掃描線、`marquee` 等）仍會保留，它們是前景；若文字顏色接近綠色，請改用另一種鍵色（例如 `--chroma 0000ff`）。
4. `glitch` 的紅藍殘影、`parallax-depth` 的景深模糊層屬於文字本身的效果，會保留。
5. 驗證：`node test/chroma.mjs`（見「驗證」）。**沒有在真實的剪輯軟體（Premiere／DaVinci／CapCut 等）裡實際摳過像。**

## 離線後製：輝光、色差、調色（只影響 preview.mp4）

整張畫面的 ffmpeg 後製，三種效果可單獨或一起用。**網頁預覽看不到，只影響離線輸出的 `preview.mp4`**；透明字層（`--alpha`）與音訊完全不受影響（給 `--alpha` 又帶後製參數時會印警告並忽略）。這與網頁版的逐字樣式（`@chromatic`、`@glow-soft`、`@neon`）和整體 `tone`／亮度（CSS filter）是不同的東西。

| 效果 | CLI | config.post | 預設值（只給旗標時） |
|---|---|---|---|
| 輝光 | `--glow [量 0–1]` `--glow-radius 畫面高度的%（0.3–6）` `--glow-threshold 亮部門檻（0–254）` | `glow:{amount,radius,threshold}` | 0.35／1.6%（1080p 約 17px）／200 |
| 色差 | `--aberration [px 0–20]`（紅藍通道左右錯開，以 1080p 為準等比換算） | `aberration:{px}` | 2 |
| 調色 | `--grade warm｜cool｜film`，另有 `--grade-contrast／-saturation／-brightness／-gamma` | `grade:{preset,contrast,saturation,brightness,gamma}`（也可直接寫預設名稱字串） | warm／cool 輕微偏色，film 微抬黑位＋降飽和 |

    node render/run.mjs --project input/project.json --audio input/song.mp3 --width 1920 --height 1080 --fps 30 --glow --aberration --grade film
    # 或寫在 project.json 的 config："post": { "glow": true, "aberration": { "px": 2 }, "grade": "film" }

- 命令列旗標優先於 `config.post`。沒有設定任何後製（或數值皆為 0）時，ffmpeg 指令與沒有這個功能時逐字相同。
- 與 `--blur` 並用：後製接在動態模糊之後，合併成單一 `-vf`。
- 輝光與色差在 RGB 上運算（不要改成在 YUV 上做 `screen`：會連色度平面一起混，整片偏洋紅）。大半徑輝光會先降採樣再模糊再放大。
- 啟動時檢查 ffmpeg 是否有所需濾鏡（輝光：`split lutrgb scale gblur blend`；色差：`rgbashift`；調色：`eq`，warm／cool 需 `colorbalance`，film 需 `curves`），缺少會在渲染前明確報錯。
- 三組預設值只在一個暗色場景看過、屬於「保守」的起點，強度主觀，請依自己的素材調整。耗時：沙箱（單核、ffmpeg 6.1.1）用 30 格 1080p JPEG → x264 量測，未後製約 10–13 秒，加上輝光／色差／調色（含 `--glow-radius 6`、三種全開）約 10–14 秒，差異落在量測雜訊內（同一設定重跑就差 2–3 秒），x264 編碼佔絕大部分；降採樣讓大半徑輝光沒有明顯變慢。這是單核沙箱、每項只量 1–2 輪的粗略結果，**60fps 與 `--blur` 多倍幀率的情況沒量**，請在自己的機器上用 `time` 比較。
- 驗證：`node test/post.mjs`（未設定時指令逐字不變、解碼後逐格雜湊兩次相同、與 `--blur`／`--alpha` 並用、缺濾鏡報錯）。

## 新語法：樣式（@）與副文（||）

完整標記：`#版型+進場+退場~持續特效^位置*字體@樣式1,樣式2 主文||副文`（舊標記完全相容，不需要修改；`^位置` 見下一節）。

- **@樣式**（可疊加，單句最多 3 個）：`neon` 霓虹、`glow-soft` 柔光、`outline` 空心、`chromatic` 色差、`gradient` 漸層、`longshadow` 長影、`trail` 拖影、`stamp` 蓋章、`glitch` 訊號閃爍、`karaoke` 逐字變亮。
  `karaoke` 與 `gradient` 同時使用時以 `karaoke` 為準。`stamp` 最適合單行置中的版型。
- **||副文**：主文下方的極小裝飾行（拼音、英文、日期等），任何版型都能用。
- 句子編輯器每一列有「樣式」與「副文」欄位，匯出 SRT 時會一併寫回。
- `@chromatic` 與 `@glitch`、`#glitch` 的殘影顏色可在面板「殘影顏色 A／B」自訂（`ghostOn`、`ghostA`、`ghostB`）；沒開自訂時維持原本的粉紅／青、紅／藍。

## 文字位置（九宮格）

預設不介入：沒設定位置時，每個版型維持自己原本的位置，舊 SRT 的外觀完全不變。

- **全域**：面板「文字位置」區塊 → 錨點（左上／上中／右上／左中／正中／右中／左下／下中／右下）、水平／垂直微調（畫面寬高的 %）、安全邊界（預設 6%）。離線渲染的設定 JSON 用 `posAnchor`（`tl tc tr ml mc mr bl bc br`，空字串＝版型原位）、`posX`、`posY`、`posSafe`。
- **單句覆蓋**：句首標記 `^位置`，放在 `~特效` 後、`@樣式` 前。
  `^bc` 下中；`^tl:5:-2` 左上再右移 5%、上移 2%；`^:10:0` 不指定錨點只微調（錨點跟隨全域）；`^auto` 這句維持版型原位。句子編輯器每列有「位置」下拉與 X%／Y% 欄位，匯出 SRT 時會寫回。
- **預設組合**「電影字幕（底部置中）」：鎖定 `center` 版型、文字縮到 35%、下中、關閉節拍跳動，一鍵套用。
- **句子編輯器的位置工具**：每列「位置」下拉有 13 個預設——正中、下中（電影字幕）、下中偏上（`bc:0:-10`）、左下（歌詞）、右下、左上、上中、右上、左中、右中、版型原位（`auto`），以及兩個交替組合「左下／右下 交替」「上中／下中 交替」（依句序輪流，寫回 SRT 時會展開成每句各自的 `^位置`）。
- **畫面上直接微調**：可直接拖曳文字，或按 Ctrl／⌘＋方向鍵微調（每次 0.5%，加 Shift 為 2%）；面板有「顯示參考線（中心十字＋安全邊界）」與「拖曳時吸附到中心線／安全邊界（按住 Alt 暫時關閉）」；支援**復原／重做**（Ctrl／⌘＋Z、Ctrl／⌘＋Y 或 Ctrl／⌘＋Shift＋Z）；點某句會跳到該句中段並暫停，方便對著畫面調。

運作方式：先量出該句版面的實際範圍（文字、裝飾線、有底色的框），整塊對齊到錨點並保留安全邊界，所以同一個錨點在不同版型都會落在同一處。微調不會把內容推出畫面；本身就比畫面寬的版型（例如 `split` 的字貼著左右兩邊）水平方向不會被平移，垂直方向照常移動。

- **副文**：設定位置的句子，副文會貼在主文（含裝飾線）正下方，並一起計入對齊範圍，不會擠在一起。沒設定位置時副文維持原本固定在畫面底部。
- **忽略位置的滿版版型**：`hud-frame`、`laser-scan`、`iris-frame`、`marquee`、`danmaku`、`border-run`、`zoom-tunnel`（本身就是整個畫面的效果，平移會讓框或掃描線錯位）。
- `lowerleft` 這類帶裝飾線的版型，線會跟文字一起算進範圍，所以是「文字加線」整組對齊，文字在線的左側。
- 驗證：`node test/position.mjs [16:9|9:16]`（全版型 × 九宮格 × 有無副文，檢查不出界、對齊、副文不重疊）。

## 預設組合

面板「預設組合」下拉可一鍵套用：動畫PV、霓虹夜、簡約明體、強烈節奏、遊戲PV、復古VHS、櫻花日系、賽博龐克、極簡海報、**仿PV歌詞**、電影字幕（底部置中）、街頭拼貼。套用時位置一律還原；文字縮放、文字陰影、鎖定版型只在「上一個組合設過」時才還原，其餘保留你手調的值。

## 新版型

`center`（置中，最適合搭配樣式與進場動畫）、`ripple-pool`（隨拍擴散的水環）、`constellation`（星點連線後聚成字）、
`particle-form`（粒子聚成字再散開）、`hud-frame`（遊戲介面風）、`parallax-depth`（多層景深視差）、
`polaroid`（相紙卡依序滑入疊放）、`page-flip`（3D 翻頁露出下一句，會顯示前一句）、`ink-bleed`（墨點暈開揭露）、
`laser-scan`（亮線掃過露出文字，偶數句橫向、奇數句直向）、`split-flap`（機場翻板）、`wave-path`（文字沿波浪流動）、
`mirror-reflect`（水面倒影）、`cylinder`（滾筒翻轉，會顯示前後句）、`iris-frame`（圓形／矩形光圈，偶數句圓、奇數句矩形）、
`annotate`（手繪圈選、底線、星號標記 `{關鍵字}`，依序輪流使用三種標記）。
另有進場動畫 `iris`（圓形光圈由小開大）。

### 仿 PV 歌詞：`pv-lyric`／`pv-vertical`（最新）

模仿日系 PV 的歌詞排版：大部分字是細黑體小字，**關鍵字用毛筆大字**，帶發光、色差收斂與淡墨暈影，右下角可附一行小註解。

    #pv-lyric 看天台上{流星}(路過)           橫排、靠左（左 5%、高 54% 處）
    #pv-vertical 看天台上{流星}(路過)        直排、靠右，由上往下展開

- `{…}`：毛筆大字關鍵字（約 1.9 倍大）；可寫多個。沒寫 `{}` 時，**自動把句尾 2 個字當關鍵字**。
- `(…)` 或 `（…）`：關鍵字右下（直排為下方）的小註解，前面帶 `‹‹‹` 箭頭，可省略。
- 動畫時長＝全域「進場秒數」、顏色＝強調色、位置＝文字位置錨點，因此建議搭配預設組合「**仿 PV 歌詞**」（黑體、強調色 `#a9c8ff`、無粒子、`crossfade` 轉場、進場 0.8 秒／退場 0.5 秒）。
- 毛筆字體：預設用 `Zhi Mang Xing`／`Ma Shan Zheng`／`Liu Jian Mao Cao`，找不到就退到楷體與明體。要更像請在字體選單選「毛筆」，或「上傳字體」放入自己的毛筆字型。大字字體可以用單句 `#pv-lyric*字體名`，或面板「強調字字體」全域指定。
- 這兩個版型的 `{}` 是關鍵字，所以屬於「會處理 `{}` 的版型」；字數太多時字會自動縮小，但直排版仍建議每句不要太長。
- 短句（如 1 秒以內）會依句長縮短延遲，避免動畫拖過退場。

### 強調字字體與毛筆

- 面板新增「**強調字字體**」（`emFont`，預設「（版型預設）」＝完全不介入）：統一指定所有 `{}` 強調字用什麼字體。
- 作用範圍：① `split`、`poster`、`diagonal`、`circle-badge`、`keyword`、`hanko`、`marker`、`annotate` 這類會處理 `{}` 的版型；② 其他版型的通用強調（`{}` 內的字改強調色、加粗、發光，字體也一併套用）。**不支援** `particle-form`、`ripple-pool`（文字畫在 canvas 上）。
- 字體表現在是：明體、黑體、圓體、楷體、等寬、英文展示、**毛筆**、**手寫**，加上你上傳的字體。`handwrite` 版型預設用「手寫」字體，但只要你指定了每句字體、或全域字體不是預設明體，就會尊重你的選擇。內建範例的第 15–34 句示範了全部新版型與樣式組合。
全部動畫都由時間驅動，離線渲染結果可重現。

`page-flip`、`cylinder` 會參考前後句內容，因此單獨一句使用時，前後方會是空白。

## 音樂節拍與自訂字體

**音樂節拍**：有給 `--audio`（或 `--video`）時，會自動分析音樂的低頻（約 40–150 Hz），
讓面板的「節拍來源 → 音訊低頻偵測」在輸出時同樣有效，文字光暈也會跟著低頻起伏。
分析結果已與瀏覽器內建的 AnalyserNode 比對（平均差 0、最大差 1／255，可用 `node test/audio-check.mjs 音樂檔 6` 重跑驗證），
且不受渲染 fps 影響。節拍來源選「固定 BPM」時照舊使用 BPM。

**自訂字體**：網頁版上傳的字體不會跟著設定檔走。請把**同一個字體檔**（檔名不要改）放進 `input/fonts/`，
渲染時會自動載入，名稱就是檔名去掉副檔名（與網頁版相同），所以匯出的 `lyrics_config.json` 裡的 `font` 會自動對上。
找不到對應字體時會出現警告，並改用系統字體。支援 ttf／otf／woff／woff2。

## 動態模糊與水波折射

**真動態模糊**：加上 `--blur N`（2–16，建議 4 或 8）。腳本會以 N 倍幀率渲染，再由 ffmpeg 把每 N 格平均成一格，
輸出仍是你指定的 fps。渲染時間約為原本的 N 倍。透明字層（`--alpha`）會先預乘 alpha 再平均，邊緣不會變黑。
快速移動的文字會產生拖尾；噪點顆粒因為被平均，看起來會比較細，需要的話可調高「噪點」。
範例：`node render/run.mjs --srt ... --config ... --width 1920 --height 1080 --fps 30 --blur 4`

**水波折射**：`ripple-pool` 版型在瀏覽器支援 WebGL2 時，文字會被隨拍擴散的水波折射（離線渲染結果可重現）。
面板「背景與亮度」區塊有開關「水波折射」；關閉、WebGL2 不可用、或網頁版進入輕量模式時，自動改用簡化版（只有水環與彈跳）。
折射版的文字是畫在 Canvas 上，支援的樣式：neon、glow-soft、outline、chromatic、longshadow、gradient；其他樣式與進場動畫在折射版不生效。

## 文字陰影、殘影顏色與背景光暈

- `textShadow`：總開關（疊在影片上建議開）。細項：`shX`／`shY`（水平／垂直偏移，-3～3）、`shBlur`（模糊）、`shAlpha`（濃度 %）、`shLayers`（疊加層數 1–4，越多越濃）、`shColor`（陰影顏色）。
- `ghostOn`、`ghostA`、`ghostB`：自訂色差／glitch 殘影的兩種顏色。
- `glowAcc`：強調色背景光暈 %（0＝關閉）。
- 另有 `beatRot`（隨拍旋轉，度）、`recFps`（錄製幀率 60／30）、`recLite`（錄製輕量模式）、`aspect`（`fill`／`16:9`／`9:16`）、`autoPerf`（掉幀自動降級）。
- 綠幕（`--chroma`）會移除所有 text-shadow，所以這一組與 `@neon` 等樣式在綠幕下都不會出現。

## 文字大小

面板新增「文字整體縮放 %」（20–300），所有版型的文字一起縮放；「大字高度比例」下限放寬到 0.03，
字距可為負值，進場、退場、全域速度、彈跳、閃白等範圍也都放寬。直排版型（vertical、hanko）有「不超出畫面高度」的上限，長句放大時會停在上限。

## 開發備忘：新增版型時

- **登記入口**：新版型用 `registerLayout(名稱, 函式, {brace:1, full:1})`——`brace:1`＝`{}` 是關鍵字（寫入 `BRACE_LAYOUTS`）、`full:1`＝滿版（寫入 `FULLBLEED`）。舊版型維持原本的分散登記，不動。`pv-lyric`／`pv-vertical` 就在 `[LAY-G]` 區段用這個入口登記。
- **自我檢查**：網址加 `?check=1`（或在主控台呼叫 `window.__selfCheck()`），會列出漏登記的項目：`NL` 與 `LAYOUTS` 不一致、`BRACE_LAYOUTS`／`FULLBLEED` 不在 `LAYOUTS`、`LAYOUTS` 重複，以及 `CONFIG` 有但 `CFG_DEFAULTS` 沒有的欄位（匯入設定時舊值會殘留）。
- **區段目錄**：用 `grep -n "===== \[" index.html` 取得最新行號，再只讀需要的區段。
- **設定鍵**：新增設定要同時進 `CONFIG` 與 `CFG_DEFAULTS`（後者是匯入設定時的底）。

- **滿版性質**（整個畫面都是它的一部分，例如邊框、滿版掃描）：把版型名稱加進 `index.html` 的 `FULLBLEED` 集合，位置設定會被忽略。
- **有獨立裝飾元素**（底色框、裝飾線、圖章）：想讓它跟著文字一起對齊就標 `data-pm`（`.ln` 線條自動算）；氛圍性質、不該影響對齊的（星點、整層光暈）標 `data-nm`。標完跑 `node test/coverage.mjs` 確認。
- **預設組合**：套用時位置一律還原；文字縮放、文字陰影、鎖定版型只在「上一個組合設過」時才還原，其餘保留使用者手調的值（`CONFIG.presetName` 記錄上一個組合）。新增組合若要設這三個欄位之外、使用者常手調的欄位，請比照 `applyPreset` 的 `PRESET_KEEP`。

## 常見問題

- **`ERR_MODULE_NOT_FOUND ... playwright`**：這個資料夾還沒執行 `npm install`。
- **找不到 input 裡的檔案**：Windows 預設隱藏副檔名，下載的檔案常變成 `song.mp3.mp3`。用 `dir input` 看真實檔名；檔名有空格或括號要加引號。
- **不要用 `npm run render -- ...`**：PowerShell 會吃掉 `--`，請直接用 `node render/run.mjs ...`。

## 驗證

    node render/run.mjs --selftest --seconds 12        # 同一專案渲染兩次，逐格比對，必須完全相同
    node test/baseline.mjs                  # 與原版逐像素比對（結果在 test/out/）
    node test/combos.mjs                    # 逐一渲染新版型與樣式組合，檢查錯誤（截圖在 test/out/c/）
    node test/allsheet.mjs 1523 886         # 以指定畫面比例渲染所有版型，檢查排版（截圖在 test/out/all/）
    node test/position.mjs 16:9             # 文字位置：標記語法、全部非滿版版型 × 九宮格、單句覆蓋、預設組合（另跑 9:16）
    node test/project-export.mjs            # 匯出渲染專案：欄位、來回、指令提示、run.mjs 逐格比對（30 項，另需 ffmpeg）
    node test/post.mjs                      # 離線後製：指令不變、決定論、與 blur／alpha 並用、缺濾鏡報錯（另需 ffmpeg，約 4 分鐘）
    node test/chroma.mjs                    # 綠幕：指令不變、全部版型×兩種比例背景純色、陰影發光移除、MP4 解碼偏差、決定論（另需 ffmpeg，約 4 分鐘）
    node test/coverage.mjs 16:9             # 量測涵蓋：找出「看得見卻沒被位置功能量到」的裝飾元素（0 才算過）
    node test/regress.mjs 舊.html 新.html   # 回歸：兩份 index.html 渲染 34 句比對截圖雜湊（改動不該影響外觀時使用）
    node test/phases.mjs "#constellation 星座連線" 0.2,0.6,1.2   # 以時間軸檢視單一版型

## 分層輸出（--layers）

同一輪渲染每格截兩次，輸出兩個檔，在剪輯軟體把 `text_alpha.mov` 疊在 `ambient.mp4` 上即可還原畫面：

    node render/run.mjs --project input/project.json --layers --width 1920 --height 1080 --fps 30 [--audio 音樂檔]

| 檔案 | 內容 |
|---|---|
| `output/text_alpha.mov` | 透明文字層（ProRes 4444，與 `--alpha` 相同） |
| `output/ambient.mp4` | 背景、遮罩、粒子、暗角、噪點、掃描線、散景、閃電等氛圍特效（無文字），含音訊 |

- 氛圍狀態只推進一次，兩層必定同步；`--selftest --layers` 會比對兩層的逐格雜湊。可與 `--blur`、`--video`、`--audio`、`--frames-dir`（存 `text_*.png`、`amb_*`）並用。
- 與 `--alpha`／`--chroma`／透明背景互相矛盾 → 警告並忽略 `--layers`；`--glow` 等後製參數會警告並忽略。
- 渲染時間約為單層的 1.3–2 倍（多一次截圖與一個 ffmpeg）。
- 驗證：`node test/layers.mjs`。

## 目前已知限制

- 必須從第 0 格依序渲染（粒子、閃電等狀態會累積）；任意跳格、多瀏覽器並行尚未支援。
- `--layers` 分層：依賴背景的效果（整頁反白閃光等）在分層後無法還原；分層輸出不套用後製。
- `--chroma` 綠幕：發光、陰影、水波折射一律移除；色彩空間與摳像效果見「綠幕輸出」。
- 背景影片的版面與網頁版相同（等比縮放、不裁切）；不同比例的影片會有黑邊。
- 「只輸出字」下，依賴背景的效果（如整頁反白閃光）不會出現。
