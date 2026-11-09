/* =========================================================
   Northline Air — Film prop demo data
   All values are fictional / scripted. No real bookings,
   payments, emails, or personal data are used.
   ========================================================= */

const DEMO_DATA = {
  airline: 'Northline Air',
  tagline: 'A fictional airline for a class short film',
  brandColor: '#0b2a4a',

  departure: {
    flightNo: 'AIR 1103',
    from: 'YVR',
    fromCity: 'Vancouver',
    to: 'YYZ',
    toCity: 'Toronto',
    bookedAt: '2022-11-11',
    flightAt: '2022-11-12',
    departTime: '08:10',
    arriveTime: '15:35',
    duration: '4 小時 25 分',
    amount: 794.98
  },

  returnFlight: {
    flightNo: 'AIR 1104',
    from: 'YYZ',
    fromCity: 'Toronto',
    to: 'YVR',
    toCity: 'Vancouver',
    bookedAt: '2022-11-16',
    flightAt: '2022-11-18',
    departTime: '10:25',
    arriveTime: '12:50',
    duration: '5 小時 25 分',
    amount: 845.38
  },

  booking: {
    reference: 'FILM-1103',
    passenger: 'ALEX CHEN'
  },

  claim: {
    submittedAt: '2022-11-17',
    reference: 'CASE-CLAIM-1103',
    status: 'Submitted',
    attachment: 'supporting-document-demo.pdf',
    name: 'Alex Chen',
    reason: '因家人過世需臨時返鄉，先行購買一般機票，事後申請喪親優惠票價差額。'
  },

  followUp: {
    screenshotSentAt: '2023-02-05',
    companyReplyAt: '2023-02-08'
  },

  decision: {
    date: '2024-02-14',
    caseTitle: 'Moffatt v. Air Canada, 2024 BCCRT 149',
    damages: 650.88,
    interest: 36.14,
    fees: 125.00,
    total: 812.02,
    keyPoints: [
      '航空公司對其官方網站聊天機器人提供的資訊負有責任。',
      '聊天機器人的回覆構成過失性不實陳述（negligent misrepresentation）。',
      '乘客對該資訊產生合理信賴，並因此受有損失。'
    ]
  },

  policy: {
    title: '喪親優惠票價／Bereavement Fares',
    updatedAt: '2022-10-01',
    keyLine: '不接受在旅行完成後才提出的喪親優惠追溯申請。',
    applyLine: '如需適用優惠，請依政策於訂票前／符合規定的階段聯繫航空公司辦理。'
  },

  chat: {
    welcome: '您好，我是 Northline Air 的 AI 線上客服，請問有什麼可以幫您？',
    intro: '喪親優惠票價提供符合資格的旅客票價減免。請於訂票前聯繫本公司，或於旅程開始前提出申請。詳細規定請參閱「喪親優惠政策」。',
    wrong: '如果需要立即出發，或已經旅行，可在機票開立後 <mark>90 天內</mark>填寫退款申請表，申請喪親優惠票價。',
    endingQuestion: '你好，請問你們的資訊都值得信任嗎？',
    endingAnswer: '當然！您可以放心信任我們的服務。',
    disclaimer: 'AI 回答僅供參考，本公司概不負責。',
    fallback: '我已收到您的問題。若想了解喪親優惠，請點選下方政策連結，或於服務時間聯繫客服人員。',
    quickQuestions: [
      '請問喪親優惠如何申請？',
      '我明天就要搭機，可以先買一般機票，之後再申請喪親優惠差額嗎？'
    ],
    wrongKeyword: '先買'
  },

  mails: [
    {
      id: 'refund-denied',
      folder: 'inbox',
      unread: true,
      fromName: 'Northline Air 客服中心',
      fromAddress: 'support@northline-demo.example',
      toAddress: 'alex.chen@demo.example',
      subject: '回覆：喪親優惠差額申請（FILM-1103）',
      dateLabel: '2022/12/06 10:42',
      tag: '退款拒絕',
      body: [
        '親愛的 Alex Chen 您好：',
        '關於您於 2022/11/17 提出的喪親優惠差額申請（訂位代碼 FILM-1103），經查您的旅程已於 2022/11/12 開始並完成。',
        '依本公司喪親票價政策，無法追溯適用。',
        '如有其他疑問，歡迎透過官方網站聯絡客服。'
      ],
      attachments: []
    },
    {
      id: 'evidence-sent',
      folder: 'sent',
      unread: false,
      fromName: 'Alex Chen',
      fromAddress: 'alex.chen@demo.example',
      toAddress: 'support@northline-demo.example',
      subject: '補充資料：AI 客服對話截圖與申請文件',
      dateLabel: '2023/02/05 21:18',
      tag: '乘客提交證據',
      body: [
        '您好：',
        '我先前已依官網 AI 客服的說明提出申請。為方便貴公司查核，隨信附上當時的對話截圖與相關文件。',
        'AI 客服當初明確表示，可在機票開立後 90 天內申請喪親優惠票價。請重新審視我的申請。',
        'Alex Chen'
      ],
      attachments: [
        'AI 對話截圖（ai-chat-90days.png）',
        '申請文件（claim-form-1103.pdf）',
        '模擬證明文件（supporting-document-demo.pdf）'
      ]
    },
    {
      id: 'misleading-reply',
      folder: 'inbox',
      unread: true,
      fromName: 'Northline Air 客服中心',
      fromAddress: 'support@northline-demo.example',
      toAddress: 'alex.chen@demo.example',
      subject: '回覆：補充資料（案件 FILM-1103）',
      dateLabel: '2023/02/08 14:05',
      tag: '客服回覆',
      body: [
        '親愛的 Alex Chen 您好：',
        '感謝您提供相關資料。我們注意到聊天機器人的文字可能造成誤導，將記錄此問題並轉交相關部門。',
        '惟現行政策不接受相關追溯申請，本次退款結果維持不變。',
        'Northline Air 客服中心'
      ],
      attachments: []
    }
  ],

  mailDisclaimer: '本收件匣為戲劇化模擬畫面，非真實郵件或原件截圖。',
  siteDisclaimer: 'Film prop / Fictional demo site — No real bookings or payments.'
};

window.DEMO_DATA = DEMO_DATA;
