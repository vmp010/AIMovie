# Northline Air — 微電影《它說可以》拍攝用模擬網站

依 `Air_Canada_1103_Web_Screen_Spec` 製作的 **原生 HTML + CSS + JavaScript** 模擬網站。
所有品牌、航班、票價、郵件、日期與個人資料皆為虛構，**不會實際訂位、付款、寄信或連接外網**。

## 快速開始

任選一種方式，在本資料夾開啟本機伺服器：

```powershell
# 方式 1：Python
python -m http.server 5500

# 方式 2：VS Code Live Server
# 對 index.html 按右鍵 → Open with Live Server
```

瀏覽器輸入：<http://localhost:5500/>

拍攝建議：桌機 1920×1080、瀏覽器縮放 100%、固定視窗大小。

## 檔案結構

```text
air-canada-film-web/
├─ index.html        首頁與航班搜尋
├─ booking.html      選票／確認／訂票成功（支援去程、回程）
├─ policy.html       喪親優惠正式政策
├─ claim.html        11/17 差額申請表
├─ mail.html         三封關鍵郵件收件匣
├─ staff.html        AI／政策矛盾對照工單
├─ case.html         申訴準備＋裁決結果
├─ boarding.html     P2 電子登機證（去程／回程）
├─ assets/
│  ├─ css/style.css
│  ├─ js/data.js     集中假資料與固定台詞
│  ├─ js/app.js      共用聊天、狀態、場次、重置
│  └─ img/logo.svg   自製虛構品牌標誌
└─ README.md
```

## 拍攝場次入口（query string）

| 場次 | 網址 | 開啟畫面 |
|---|---|---|
| 1-3 | `index.html?scene=1-3` | 航班搜尋（YVR → YYZ、2022/11/12） |
| 1-5 / 1-6 | `index.html?scene=1-6` | 自動開啟 AI 客服 |
| 2-1 | `index.html?scene=2-1` | AI 客服開啟，顯示預設問題 |
| 2-2 | `index.html?scene=2-2` | 自動顯示「90 天內」錯誤回答 |
| 2-4 | `booking.html?scene=2-4` | 去程 C$794.98，已選航班待確認 |
| 3-2 | `booking.html?trip=return&scene=3-2` | 回程 C$845.38、2022/11/18 |
| 3-3 | `claim.html?scene=3-3` | 申請表已預填（11/17） |
| 3-5 | `mail.html` | 收件匣列表 |
| 4-1 | `mail.html?scene=4-1` | 退款拒絕信 |
| 4-3 | `mail.html?scene=4-3` | 2023/02/05 證據信＋附件 |
| 4-4 / 4-6 | `staff.html?scene=4-4` | AI／政策同框對照 |
| 4-5 | `mail.html?scene=4-5` | 2023/02/08 客服回覆 |
| 5-6 | `case.html?scene=5-6` | 準備申訴模式 |
| 6-4 | `case.html?scene=6-4` | 裁決結果（2024/02/14、C$812.02） |
| 7-5 / 7-6 | `index.html?scene=7-6` | AI 結尾模式 |
| 7-7 | `index.html?scene=7-7` | 自信回覆＋免責小字 |
| — | `boarding.html?trip=return` | 回程電子登機證 |

> `?scene=` 只用來預載畫面，不影響資料正確性。任何頁面都能使用 `Reset Demo` 清除狀態。

## AI 客服固定劇本

- 首次開啟顯示歡迎訊息與兩個預設問題。
- 「請問喪親優惠如何申請？」→ 介紹優惠＋政策連結。
- 「我明天就要搭機，可以先買一般機票，之後再申請喪親優惠差額嗎？」→ 固定回答：
  「如果需要立即出發，或已經旅行，可在機票開立後 **90 天內**填寫退款申請表，申請喪親優惠票價。」
- 結尾模式問「你好，請問你們的資訊都值得信任嗎？」→
  「當然！您可以放心信任我們的服務。」＋灰色小字「AI 回答僅供參考，本公司概不負責。」

### 拍攝控制

聊天面板右上角 **⚙** 可展開內部控制：

- `重新開始對話`：清空訊息、重播歡迎與預設問題。
- `切換結尾模式`：切換正常／結尾劇本。
- `Reset Demo`：清除 `localStorage` 假狀態並重新載入目前場次。
- 畫面左下角也有常駐 `Reset Demo` 與場次標示。

## 固定假資料

集中於 `assets/js/data.js`：

- 去程：YVR → YYZ，購票 2022/11/11，搭機 2022/11/12，**C$794.98**。
- 回程：YYZ → YVR，購票 2022/11/16，搭機 2022/11/18，**C$845.38**。
- 申請：首次提出 **2022/11/17**，狀態僅顯示「已受理 · 審核中」。
- 後續：2023/02/05 證據信、2023/02/08 客服回覆。
- 裁決：2024/02/14；損害 C$650.88＋利息 C$36.14＋程序費 C$125.00＝**C$812.02**。
- 訂位代碼：`FILM-1103`；乘客：`Alex Chen`。
- 品牌：`Northline Air`（虛構）。

## 安全與倫理

- 不收集信用卡、護照、電話或任何真實個資。
- 不連接真實航空公司網站、不串接任何 LLM API。
- 按鈕只改變本機假狀態，不實際扣款、訂位、寄信或提出申訴。
- 信件與裁決頁皆標註為戲劇化重製／影片重製畫面，非原件截圖。
- 頁面底部固定顯示：`Film prop / Fictional demo site — No real bookings or payments.`

## 離線使用

本網站不依賴任何 CDN、外部字型或網路資源；所有 CSS、JS、Logo 均為本機檔案，可完全離線以 localhost 拍攝。
