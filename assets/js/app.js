/* =========================================================
   Northline Air — shared demo behaviour
   Vanilla JS only. No network, no real payments or emails.
   ========================================================= */

(function () {
  'use strict';

  const DATA = window.DEMO_DATA;
  const STORAGE_KEY = 'northline_demo_v1';
  const params = new URLSearchParams(window.location.search);
  const scene = (params.get('scene') || '').trim();
  const page = document.body.dataset.page || '';
  const filmMode = params.get('film') === '1' && params.get('crew') !== '1';
  document.body.classList.add(filmMode ? 'film-mode' : 'crew-mode');

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const DEFAULTS = {
    mode: 'normal',
    bookings: {},
    claim: null,
    readMails: []
  };

  let state = loadState();

  // 相容舊版單筆訂單，之後分別保存去程與回程。
  state.bookings = Object.assign({}, state.bookings);
  if (state.booking && state.booking.type && !state.bookings[state.booking.type]) {
    state.bookings[state.booking.type] = state.booking;
  }
  delete state.booking;

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (err) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* localStorage may be unavailable on some setups */
    }
  }

  function resetState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    state = Object.assign({}, DEFAULTS);
  }

  function money(value) {
    return 'C$' + Number(value).toFixed(2);
  }

  function slashDate(iso) {
    return iso ? String(iso).replace(/-/g, '/') : '';
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function setText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text;
  }

  function setHtml(selector, html) {
    const el = $(selector);
    if (el) el.innerHTML = html;
  }

  function markActiveNav() {
    const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.main-nav a').forEach(function (link) {
      const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href && href === file) link.classList.add('is-active');
    });
  }

  function modeUrl(href) {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !/\.html$/.test(url.pathname)) return href;
    if (!url.searchParams.has('film') && !url.searchParams.has('crew')) {
      url.searchParams.set(filmMode ? 'film' : 'crew', '1');
    }
    return url.pathname + url.search + url.hash;
  }

  function preserveMode(root) {
    $$('a[href]', root).forEach(function (link) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#')) link.setAttribute('href', modeUrl(href));
    });
  }

  /* ---------------------------------------------------------
     Shared demo tools (scene label + reset)
     --------------------------------------------------------- */
  function mountDemoTools() {
    if ($('.demo-tools')) return;

    const tools = document.createElement('div');
    tools.className = 'demo-tools';
    tools.innerHTML =
      '<span class="scene-chip"><span class="dot"></span>' +
      (scene ? '場次 ' + esc(scene) : '示範模式') +
      '</span>' +
      '<button type="button" data-demo-reset>Reset Demo</button>' +
      '<button type="button" data-scene-replay>重播場次</button>' +
      '<details class="crew-scenes"><summary>場次入口</summary><nav aria-label="劇組場次">' +
      [
        ['1-3 航班搜尋', 'index.html?scene=1-3'],
        ['1-6 客服開場', 'index.html?scene=1-6'],
        ['2-2 九十天回答', 'index.html?scene=2-2'],
        ['2-4 去程購票', 'booking.html?scene=2-4'],
        ['3-1 去程登機證', 'boarding.html'],
        ['3-2 回程購票', 'booking.html?trip=return&scene=3-2'],
        ['3-3 提出申請', 'claim.html?scene=3-3'],
        ['3-4 回程登機證', 'boarding.html?trip=return'],
        ['4-1 拒絕通知', 'mail.html?scene=4-1'],
        ['4-3 寄出證據', 'mail.html?scene=4-3'],
        ['4-4 客服工單', 'staff.html?scene=4-4'],
        ['4-5 客服回覆', 'mail.html?scene=4-5'],
        ['5-6 準備申訴', 'case.html?scene=5-6'],
        ['6-2 歷史資料', 'case.html?scene=6-2'],
        ['6-4 裁決通知', 'case.html?scene=6-4'],
        ['7-7 結尾', 'index.html?scene=7-7']
      ].map(function (item) { return '<a href="' + esc(item[1]) + '">' + item[0] + '</a>'; }).join('') +
      '</nav></details>' +
      '<a class="film-entry" href="' + esc(window.location.pathname + '?' +
        new URLSearchParams(Object.assign(Object.fromEntries(params), { film: '1', crew: '0' })).toString()) + '">進入拍攝</a>';
    document.body.appendChild(tools);
    $('[data-scene-replay]', tools).addEventListener('click', function () { window.location.reload(); });

    tools.querySelector('[data-demo-reset]').addEventListener('click', function () {
      resetState();
      window.location.href = window.location.pathname + window.location.search;
    });
  }

  /* ---------------------------------------------------------
     AI chat widget
     --------------------------------------------------------- */
  const chat = {
    root: null,
    body: null,
    quick: null,
    panel: null,
    launcher: null,
    controls: null,
    modeLabel: null,
    busy: false,
    timer: null,
    open: false
  };

  function mountChat() {
    if (['index', 'booking', 'policy', 'claim'].indexOf(page) === -1) return;
    if ($('.chat-root')) return;

    const root = document.createElement('div');
    root.className = 'chat-root';
    root.innerHTML =
      '<button class="chat-launcher" type="button" aria-expanded="false">' +
      '<span class="pulse"></span>AI 線上客服</button>' +
      '<section class="chat-panel" hidden aria-label="AI 線上客服">' +
      '<header class="chat-head">' +
      '<div class="chat-brand">' +
      '<img src="assets/img/logo.svg" alt="">' +
      '<div><strong>Northline Air</strong><small>AI 線上客服</small></div>' +
      '</div>' +
      '<div class="chat-head-actions">' +
      '<button class="chat-gear" type="button" title="拍攝控制" aria-label="拍攝控制">⚙</button>' +
      '<button class="chat-close" type="button" title="關閉" aria-label="關閉">×</button>' +
      '</div>' +
      '</header>' +
      '<div class="chat-controls" hidden>' +
      '<button type="button" data-chat-reset>重新開始對話</button>' +
      '<button type="button" data-chat-mode>切換結尾模式</button>' +
      '<button type="button" data-demo-reset>Reset Demo</button>' +
      '<span class="chat-mode-label">模式：正常</span>' +
      '</div>' +
      '<div class="chat-body" id="chatBody">' +
      '<div class="chat-day">今天</div>' +
      '<div class="chat-quick" id="chatQuick"></div>' +
      '</div>' +
      '<form class="chat-input" id="chatForm">' +
      '<input id="chatText" type="text" autocomplete="off" placeholder="輸入訊息…" aria-label="輸入訊息">' +
      '<button class="btn btn-primary btn-sm" type="submit">送出</button>' +
      '</form>' +
      '<div class="chat-foot"><a href="policy.html">喪親優惠政策</a><span class="crew-only"> · AI 回覆為固定劇本，僅供拍攝使用。</span></div>' +
      '</section>';

    document.body.appendChild(root);

    chat.root = root;
    chat.panel = $('.chat-panel', root);
    chat.launcher = $('.chat-launcher', root);
    chat.body = $('#chatBody', root);
    chat.quick = $('#chatQuick', root);
    chat.controls = $('.chat-controls', root);
    chat.modeLabel = $('.chat-mode-label', root);

    chat.launcher.addEventListener('click', function () {
      setChatOpen(!chat.open);
    });

    $('.chat-close', root).addEventListener('click', function () {
      setChatOpen(false);
    });

    $('.chat-gear', root).addEventListener('click', function () {
      chat.controls.hidden = !chat.controls.hidden;
    });

    $('[data-chat-reset]', root).addEventListener('click', function () {
      resetChat();
    });

    $('[data-chat-mode]', root).addEventListener('click', function () {
      setChatMode(state.mode === 'ending' ? 'normal' : 'ending');
    });

    $('[data-demo-reset]', root).addEventListener('click', function () {
      resetState();
      window.location.href = window.location.pathname + window.location.search;
    });

    $('#chatForm', root).addEventListener('submit', function (event) {
      event.preventDefault();
      const input = $('#chatText', root);
      const text = input.value.trim();
      if (!text || chat.busy) return;
      input.value = '';
      handleUserMessage(text);
    });

    updateModeLabel();
    resetChat();
  }

  function setChatOpen(open) {
    chat.open = open;
    chat.panel.hidden = !open;
    chat.launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      const input = $('#chatText');
      if (input) input.focus();
      scrollChat();
    }
  }

  function openChat() {
    setChatOpen(true);
  }

  function updateModeLabel() {
    if (!chat.modeLabel) return;
    chat.modeLabel.textContent = '模式：' + (state.mode === 'ending' ? '結尾' : '正常');
    const btn = chat.root && $('[data-chat-mode]', chat.root);
    if (btn) {
      btn.textContent = state.mode === 'ending' ? '切換正常模式' : '切換結尾模式';
    }
  }

  function setChatMode(mode) {
    state.mode = mode === 'ending' ? 'ending' : 'normal';
    saveState();
    updateModeLabel();
    resetChat();
  }

  function scrollChat() {
    if (chat.body) chat.body.scrollTop = chat.body.scrollHeight;
  }

  function addMessage(role, html, withDisclaimer) {
    const msg = document.createElement('div');
    msg.className = 'msg ' + role;
    msg.innerHTML =
      '<span class="who">' + (role === 'bot' ? 'AI 客服' : '您') + '</span>' +
      '<div class="bubble">' + html + '</div>';
    if (withDisclaimer) {
      const note = document.createElement('div');
      note.className = 'msg-disclaimer';
      note.textContent = DATA.chat.disclaimer;
      msg.appendChild(note);
    }
    chat.quick.insertAdjacentElement('beforebegin', msg);
    preserveMode(msg);
    scrollChat();
    return msg;
  }

  function removeTyping() {
    const typing = $('#chatTyping');
    if (typing) typing.remove();
  }

  function botSay(html, withDisclaimer) {
    if (chat.busy) return Promise.resolve();
    chat.busy = true;

    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.id = 'chatTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chat.quick.insertAdjacentElement('beforebegin', typing);
    scrollChat();

    return new Promise(function (resolve) {
      chat.timer = window.setTimeout(function () {
        removeTyping();
        addMessage('bot', html, withDisclaimer);
        chat.busy = false;
        resolve();
      }, 760);
    });
  }

  function clearQuick() {
    if (!chat.quick) return;
    chat.quick.innerHTML = '';
    chat.quick.hidden = true;
  }

  function renderQuick() {
    if (!chat.quick) return;
    chat.quick.innerHTML = '';
    chat.quick.hidden = false;

    const questions = state.mode === 'ending'
      ? [DATA.chat.endingQuestion]
      : DATA.chat.quickQuestions.slice();

    questions.forEach(function (question) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = question;
      btn.addEventListener('click', function () {
        handleUserMessage(question);
      });
      chat.quick.appendChild(btn);
    });

    scrollChat();
  }

  function resetChat() {
    if (!chat.body) return;
    window.clearTimeout(chat.timer);
    removeTyping();
    $$('.msg', chat.body).forEach(function (el) { el.remove(); });
    chat.busy = false;
    addMessage('bot', DATA.chat.welcome, state.mode === 'ending');
    renderQuick();
  }

  function handleUserMessage(text) {
    if (chat.busy) return;
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    addMessage('user', esc(trimmed));
    clearQuick();

    let reply;
    let withDisclaimer = false;

    if (state.mode === 'ending') {
      if (/信任|可靠|值得|trust/i.test(trimmed)) {
        reply = DATA.chat.endingAnswer;
      } else {
        reply = DATA.chat.fallback;
      }
      withDisclaimer = true;
    } else if (/先買|後補|之後再申請|先.*買/.test(trimmed)) {
      reply = DATA.chat.wrong;
    } else if (/喪親|berea|優惠/i.test(trimmed)) {
      reply = DATA.chat.intro + ' <a href="policy.html">查看喪親優惠政策 →</a>';
    } else {
      reply = DATA.chat.fallback;
    }

    botSay(reply, withDisclaimer);
  }

  function autoExchange(userText, reply, withDisclaimer) {
    addMessage('user', esc(userText));
    clearQuick();
    botSay(reply, withDisclaimer);
  }

  function runChatScene() {
    if (!scene || !chat.panel) return;

    if (scene === '1-6') {
      openChat();
      autoExchange(DATA.chat.quickQuestions[0], DATA.chat.afterHours + '<br><br>' +
        DATA.chat.intro + ' <a href="policy.html">查看喪親優惠政策 →</a>', false);
      return;
    }

    if (scene === '1-5' || scene === '2-1') {
      openChat();
      return;
    }

    if (scene === '2-2') {
      openChat();
      autoExchange(DATA.chat.quickQuestions[1], DATA.chat.wrong, false);
      return;
    }

    if (scene === '7-5' || scene === '7-6' || scene === '7-7') {
      state.mode = 'ending';
      saveState();
      updateModeLabel();
      resetChat();
      openChat();

      if (scene === '7-7') {
        autoExchange(DATA.chat.endingQuestion, DATA.chat.endingAnswer, true);
      }
    }
  }

  /* ---------------------------------------------------------
     Page: index
     --------------------------------------------------------- */
  function initIndex() {
    if (page !== 'index') return;

    const form = $('#searchForm');
    if (!form) return;

    const swap = $('#swapCities');
    const fromSel = $('#fromCity');
    const toSel = $('#toCity');

    if (swap && fromSel && toSel) {
      swap.addEventListener('click', function () {
        const from = fromSel.value;
        fromSel.value = toSel.value;
        toSel.value = from;
        $('#departDate').value = fromSel.value === 'YYZ' ? DATA.returnFlight.flightAt : DATA.departure.flightAt;
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const flight = fromSel.value === 'YYZ' ? DATA.returnFlight : DATA.departure;
      const error = $('#searchError');
      if (fromSel.value !== flight.from || toSel.value !== flight.to || $('#departDate').value !== flight.flightAt) {
        error.textContent = '您選擇的航線或日期目前沒有可預訂航班，請調整搜尋條件。';
        error.hidden = false;
        return;
      }
      error.hidden = true;
      const query = new URLSearchParams({
        trip: flight === DATA.returnFlight ? 'return' : 'outbound',
        from: fromSel ? fromSel.value : 'YVR',
        to: toSel ? toSel.value : 'YYZ',
        date: $('#departDate') ? $('#departDate').value : '2022-11-12'
      });
      window.location.href = modeUrl('booking.html?' + query.toString());
    });

    if (scene === '1-3') {
      const card = $('#search');
      if (card) card.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------------------------------------------------------
     Page: booking
     --------------------------------------------------------- */
  function initBooking() {
    if (page !== 'booking') return;

    const isReturn = params.get('trip') === 'return';
    const flight = isReturn ? DATA.returnFlight : DATA.departure;
    const purchaseLabel = isReturn ? '回程單程含稅' : '去程單程含稅';

    if (['from', 'to', 'date'].some(function (key) {
      return params.has(key) && params.get(key) !== (key === 'date' ? flight.flightAt : flight[key]);
    }) || (params.has('trip') && ['oneway', 'outbound', 'return'].indexOf(params.get('trip')) === -1)) {
      $('.booking-layout').hidden = true;
      $('.steps').hidden = true;
      setText('#pageTitle', '沒有符合條件的航班');
      setText('#pageSubtitle', '請返回航班搜尋，重新選擇出發地、目的地與日期。');
      return;
    }

    $('#bookingBoardingLink').href = modeUrl('boarding.html?trip=' + (isReturn ? 'return' : 'outbound'));

    setText('#pageTitle', isReturn ? '回程航班' : '去程航班');
    setText('#pageSubtitle', isReturn
      ? 'Toronto (YYZ) → Vancouver (YVR) · ' + slashDate(flight.flightAt)
      : 'Vancouver (YVR) → Toronto (YYZ) · ' + slashDate(flight.flightAt));
    setText('#flightNo', flight.flightNo);
    setText('#flightFrom', flight.from);
    setText('#flightFromCity', flight.fromCity);
    setText('#flightTo', flight.to);
    setText('#flightToCity', flight.toCity);
    setText('#departTime', flight.departTime);
    setText('#arriveTime', flight.arriveTime);
    setText('#duration', flight.duration);
    setText('#priceAmount', money(flight.amount));
    setText('#purchaseLabel', purchaseLabel);
    setText('#bookedDate', slashDate(flight.bookedAt));
    setText('#flightDate', slashDate(flight.flightAt));

    setText('#sumFrom', flight.from);
    setText('#sumTo', flight.to);
    setText('#sumDate', slashDate(flight.flightAt));
    setText('#sumRoute', flight.fromCity + ' → ' + flight.toCity);
    setText('#sumFare', money(flight.amount));
    setText('#sumTotal', money(flight.amount));

    setText('#confirmFlightNo', flight.flightNo + ' · 直飛');
    setText('#confirmRoute', flight.from + ' ' + flight.fromCity + ' → ' + flight.to + ' ' + flight.toCity);
    setText('#confirmDate', slashDate(flight.flightAt));
    setText('#confirmBooked', slashDate(flight.bookedAt));
    setText('#confirmAmount', money(flight.amount));

    setText('#successFlightNo', flight.flightNo);
    setText('#successRoute', flight.from + ' → ' + flight.to);
    setText('#successDate', slashDate(flight.flightAt));
    setText('#successBooked', slashDate(flight.bookedAt));
    setText('#successAmount', money(flight.amount));
    setText('#successType', isReturn ? '回程' : '去程');

    function setStep(step) {
      $$('.steps li').forEach(function (li) {
        const num = Number(li.dataset.step);
        li.classList.toggle('is-done', num < step);
        li.classList.toggle('is-active', num === step);
      });
    }

    const selectBtn = $('#selectFlight');
    const confirmPanel = $('#confirmPanel');
    const successCard = $('#successCard');
    const flightCard = $('#flightCard');

    function selectFlight() {
      if (flightCard) flightCard.classList.add('is-selected');
      if (confirmPanel) {
        confirmPanel.hidden = false;
        confirmPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (selectBtn) selectBtn.textContent = '已選擇';
      setStep(2);
    }

    if (selectBtn) selectBtn.addEventListener('click', selectFlight);

    const backBtn = $('#backToFlights');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (confirmPanel) confirmPanel.hidden = true;
        if (flightCard) flightCard.classList.remove('is-selected');
        if (selectBtn) selectBtn.textContent = '選擇此航班';
        setStep(1);
        if (flightCard) flightCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    const confirmBtn = $('#confirmBooking');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!$('#paymentAgree').checked) {
          $('#paymentError').hidden = false;
          return;
        }
        $('#paymentError').hidden = true;
        state.bookings[isReturn ? 'return' : 'outbound'] = {
          type: isReturn ? 'return' : 'outbound',
          reference: DATA.booking.reference,
          passenger: DATA.booking.passenger,
          flightNo: flight.flightNo,
          amount: flight.amount,
          date: flight.flightAt
        };
        saveState();

        if (confirmPanel) confirmPanel.hidden = true;
        if (flightCard) flightCard.hidden = true;
        const summary = $('.summary-card');
        if (summary) summary.hidden = true;
        if (successCard) {
          successCard.hidden = false;
          successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setStep(3);
      });
    }

    if (scene === '2-4' || scene === '3-2') {
      window.setTimeout(selectFlight, 200);
    }
  }

  /* ---------------------------------------------------------
     Page: claim
     --------------------------------------------------------- */
  function initClaim() {
    if (page !== 'claim') return;

    const claim = DATA.claim;

    setText('#claimConfirmDate', slashDate(claim.submittedAt));
    setText('#claimSuccessRef', claim.reference);
    setText('#claimSuccessDate', slashDate(claim.submittedAt));

    const nameInput = $('#claimName');
    const refInput = $('#claimRef');
    const reasonInput = $('#claimReason');
    const agreeInput = $('#claimAgree');
    const routeInput = $('#claimRoute');
    let attachmentSelected = false;
    let draft = null;

    function selectAttachment(selected) {
      attachmentSelected = selected;
      $('#claimAttachment').hidden = !selected;
      $('#removeAttachment').hidden = !selected;
      $('#chooseAttachment').hidden = selected;
    }
    $('#chooseAttachment').addEventListener('click', function () { selectAttachment(true); });
    $('#removeAttachment').addEventListener('click', function () { selectAttachment(false); });

    if (nameInput) nameInput.value = claim.name;
    if (refInput) refInput.value = DATA.booking.reference;
    if (reasonInput) reasonInput.value = claim.reason;

    const wrap = $('#claimWrap');
    const confirm = $('#claimConfirm');
    const success = $('#claimSuccess');
    const error = $('#claimError');
    const form = $('#claimForm');

    function showError(message) {
      if (!error) return;
      error.textContent = message;
      error.hidden = false;
    }

    function clearError() {
      if (error) error.hidden = true;
    }

    function showConfirm() {
      draft = {
        name: nameInput.value.trim(), reference: refInput.value.trim(),
        route: routeInput.selectedOptions[0].textContent,
        reason: reasonInput.value.trim(), attachment: claim.attachment
      };
      setText('#claimConfirmName', draft.name);
      setText('#claimConfirmRef', draft.reference);
      setText('#claimConfirmRoute', draft.route);
      setText('#claimConfirmReason', draft.reason);
      setText('#claimConfirmAttachment', draft.attachment);
      setText('#claimConfirmDate', slashDate(claim.submittedAt));
      if (wrap) wrap.hidden = true;
      if (confirm) confirm.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showSuccess() {
      setText('#claimSuccessName', draft.name);
      setText('#claimSuccessBooking', draft.reference);
      setText('#claimSuccessRoute', draft.route);
      setText('#claimSuccessReason', draft.reason);
      setText('#claimSuccessAttachment', draft.attachment);
      if (confirm) confirm.hidden = true;
      if (wrap) wrap.hidden = true;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearError();
        if (!nameInput.value.trim() || !refInput.value.trim() || !reasonInput.value.trim()) {
          showError('請填寫申請人、訂位代碼與申請理由。');
          return;
        }
        if (!attachmentSelected) {
          showError('請先選擇證明文件附件。');
          return;
        }
        if (agreeInput && !agreeInput.checked) {
          showError('請先勾選確認事項，再繼續送出申請。');
          return;
        }
        showConfirm();
      });
    }

    const back = $('#claimBack');
    if (back) {
      back.addEventListener('click', function () {
        if (confirm) confirm.hidden = true;
        if (wrap) wrap.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const submit = $('#claimSubmit');
    if (submit) {
      submit.addEventListener('click', function () {
        if (!draft) return;
        state.claim = {
          submittedAt: claim.submittedAt,
          reference: claim.reference
        };
        saveState();
        showSuccess();
      });
    }

    if (scene === '3-3') {
      const card = $('#claimWrap');
      if (card) card.scrollIntoView({ block: 'start' });
    }
  }

  /* ---------------------------------------------------------
     Page: mail
     --------------------------------------------------------- */
  function initMail() {
    if (page !== 'mail') return;

    const listEl = $('#mailList');
    const readEl = $('#mailRead');
    if (!listEl || !readEl) return;

    const sceneMap = {
      '4-1': 'refund-denied',
      '4-3': 'evidence-sent',
      '4-5': 'misleading-reply'
    };

    let currentId = sceneMap[scene] || null;
    let currentFolder = currentId === 'evidence-sent' ? 'sent' : 'inbox';

    function isRead(id) {
      return state.readMails.indexOf(id) !== -1;
    }

    function markRead(id) {
      if (!isRead(id)) {
        state.readMails.push(id);
        saveState();
      }
    }

    function tagClass(id) {
      if (id === 'refund-denied') return 'red';
      if (id === 'evidence-sent') return 'amber';
      return '';
    }

    function renderList() {
      listEl.innerHTML = '';
      const mails = DATA.mails.filter(function (mail) { return mail.folder === currentFolder; });
      setText('#mailFolderTitle', currentFolder === 'sent' ? '已寄出' : '收件匣');
      setText('#mailCount', mails.length + ' 封郵件');
      $$('[data-folder]').forEach(function (link) {
        link.classList.toggle('is-active', link.dataset.folder === currentFolder);
        link.setAttribute('aria-current', link.dataset.folder === currentFolder ? 'page' : 'false');
        setText('#' + link.dataset.folder + 'Count', DATA.mails.filter(function (mail) {
          return mail.folder === link.dataset.folder;
        }).length);
      });
      mails.forEach(function (mail) {
        const unread = mail.unread && !isRead(mail.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mail-item' + (mail.id === currentId ? ' is-active' : '');
        btn.dataset.unread = unread ? 'true' : 'false';
        btn.innerHTML =
          '<div class="from-row">' +
          '<span class="from"><span class="unread-dot"></span>' + esc(mail.fromName) + '</span>' +
          '<span class="date">' + esc(mail.dateLabel) + '</span>' +
          '</div>' +
          '<div class="subject">' + esc(mail.subject) + '</div>' +
          '<div class="snippet"><span class="tag ' + tagClass(mail.id) + '">' + esc(mail.tag) + '</span> ' +
          esc(mail.body[mail.body.length - 1] || '') + '</div>';
        btn.addEventListener('click', function () {
          currentId = mail.id;
          markRead(mail.id);
          renderList();
          renderRead(mail.id);
          const pane = readEl;
          if (pane && pane.scrollIntoView) {
            pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        listEl.appendChild(btn);
      });
    }

    function renderRead(id) {
      const mail = DATA.mails.filter(function (m) { return m.id === id; })[0];
      if (!mail) {
        readEl.innerHTML = '<div class="mail-empty">選擇郵件以閱讀內容。<br><span class="tag crew-only">戲劇化模擬信件</span></div>';
        return;
      }

      const initial = esc(mail.fromName.charAt(0));
      const avatarClass = mail.folder === 'sent' ? ' customer' : '';
      const attachments = mail.attachments.length
        ? '<div class="mail-attachments"><h3>附件</h3><ul class="attachment-list">' +
          mail.attachments.map(function (name) {
            return '<li>' + esc(name) + '</li>';
          }).join('') +
          '</ul></div>'
        : '';

      readEl.innerHTML =
        '<div class="mail-read-head">' +
        '<div style="margin-bottom:10px"><span class="tag ' + tagClass(mail.id) + '">' + esc(mail.tag) + '</span></div>' +
        '<h2>' + esc(mail.subject) + '</h2>' +
        '<div class="mail-sender">' +
        '<div class="avatar' + avatarClass + '">' + initial + '</div>' +
        '<div><div class="name">' + esc(mail.fromName) + '</div>' +
        '<div class="addr">' + esc(mail.fromAddress) + ' → ' + esc(mail.toAddress) + '</div></div>' +
        '<div class="mail-date">' + esc(mail.dateLabel) + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="mail-body">' +
        mail.body.map(function (paragraph) { return '<p>' + esc(paragraph) + '</p>'; }).join('') +
        '</div>' +
        attachments +
        '<p class="case-note crew-only">' + esc(DATA.mailDisclaimer) + '</p>';
    }

    $$('[data-folder]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        currentFolder = link.dataset.folder;
        currentId = null;
        renderList();
        renderRead(null);
      });
    });

    $('#composeMail').addEventListener('click', function () {
      currentId = null;
      renderList();
      const evidence = DATA.mails.find(function (mail) { return mail.id === 'evidence-sent'; });
      readEl.innerHTML = '<h2>撰寫郵件</h2><form id="mailDraft">' +
        '<label class="field"><span>收件人</span><input value="' + esc(evidence.toAddress) + '" readonly></label>' +
        '<label class="field"><span>主旨</span><input maxlength="160" value="' + esc(evidence.subject) + '"></label>' +
        '<label class="field"><span>內容</span><textarea rows="8" maxlength="2000">' + esc(evidence.body.join('\n\n')) + '</textarea></label>' +
        '<p class="case-note">僅在本頁預覽草稿，不會儲存或寄出。</p>' +
        '<button class="btn btn-outline" type="submit">完成草稿預覽</button></form>';
      $('#mailDraft').addEventListener('submit', function (event) {
        event.preventDefault();
        readEl.innerHTML = '<div class="mail-empty">草稿預覽結束，未寄出任何郵件。</div>';
      });
    });

    if (currentId) {
      markRead(currentId);
    }

    renderList();
    renderRead(currentId);
  }

  /* ---------------------------------------------------------
     Page: case
     --------------------------------------------------------- */
  function initCase() {
    if (page !== 'case') return;

    const decision = DATA.decision;
    setText('#decTitle', decision.caseTitle);
    setText('#sourceTitle', decision.sourceTitle);
    $('#sourceLink').href = decision.sourceUrl;
    setText('#decDate', slashDate(decision.date));
    setText('#decDamages', money(decision.damages));
    setText('#decInterest', money(decision.interest));
    setText('#decFees', money(decision.fees));
    setText('#decTotal', money(decision.total));

    const prepare = $('#prepareMode');
    const decisionMode = $('#decisionMode');
    const sourcesMode = $('#sourcesMode');

    function setMode(mode) {
      $$('[data-case-mode]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.caseMode === mode);
      });
      if (prepare) prepare.hidden = mode !== 'prepare';
      if (decisionMode) decisionMode.hidden = mode !== 'decision';
      if (sourcesMode) sourcesMode.hidden = mode !== 'sources';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    $$('[data-case-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.dataset.caseMode);
      });
    });

    setMode(params.get('view') === 'sources' || scene === '6-2' ? 'sources'
      : /^6-[345]$/.test(scene) ? 'decision' : 'prepare');

    const appealForm = $('#appealForm');
    if (appealForm) {
      appealForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const submitted = $('#appealSubmitted');
        if (submitted) submitted.hidden = false;
        const btn = $('#appealSubmit');
        if (btn) {
          btn.disabled = true;
          btn.textContent = '資料已備妥';
        }
      });
    }
  }

  function initStaff() {
    if (page !== 'staff') return;
    const main = $('main');
    const logout = $('#staffLogout');
    const signedOut = document.createElement('div');
    signedOut.className = 'container page';
    signedOut.hidden = true;
    signedOut.innerHTML = '<h1>工作階段已結束</h1><p>請使用右上角按鈕返回工作台。</p>';
    main.insertAdjacentElement('afterend', signedOut);
    logout.addEventListener('click', function () {
      main.hidden = !main.hidden;
      signedOut.hidden = !main.hidden;
      logout.textContent = main.hidden ? '返回工作台' : '登出';
    });
  }

  /* ---------------------------------------------------------
     Page: boarding pass
     --------------------------------------------------------- */
  function initBoarding() {
    if (page !== 'boarding') return;

    const extras = {
      outbound: { seat: '18A', gate: 'C42', boarding: '07:35', trip: '去程登機證' },
      return: { seat: '22C', gate: 'B11', boarding: '09:50', trip: '回程登機證' }
    };

    let trip = params.get('trip') === 'return' ? 'return' : 'outbound';

    function renderBarcode() {
      const barcode = $('#bpBarcode');
      if (!barcode) return;
      barcode.innerHTML = '';
      for (let i = 0; i < 42; i += 1) {
        const span = document.createElement('span');
        const width = ((i * 7 + 3) % 4) + 1;
        const height = 30 + ((i * 13) % 23);
        span.style.width = width + 'px';
        span.style.height = height + 'px';
        barcode.appendChild(span);
      }
    }

    function render() {
      const flight = trip === 'return' ? DATA.returnFlight : DATA.departure;
      const extra = extras[trip];

      setText('#bpFlightNo', flight.flightNo);
      setText('#bpFrom', flight.from);
      setText('#bpTo', flight.to);
      setText('#bpFromCity', flight.fromCity);
      setText('#bpToCity', flight.toCity);
      setText('#bpDate', slashDate(flight.flightAt));
      setText('#bpDepart', flight.departTime);
      setText('#bpArrive', flight.arriveTime);
      setText('#bpSeat', extra.seat);
      setText('#bpGate', extra.gate);
      setText('#bpBoarding', extra.boarding);
      setText('#bpPassenger', DATA.booking.passenger);
      setText('#bpRef', DATA.booking.reference);
      setText('#bpTripLabel', extra.trip);

      $$('[data-trip]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.trip === trip);
      });

      renderBarcode();
    }

    $$('[data-trip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        trip = btn.dataset.trip;
        render();
      });
    });

    render();
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    // 每個場次都從自己的時間點開始，避免結尾模式污染前面的鏡頭。
    state.mode = /^7-/.test(scene) ? 'ending' : 'normal';
    markActiveNav();
    mountDemoTools();
    mountChat();

    initIndex();
    initBooking();
    initClaim();
    initMail();
    initCase();
    initStaff();
    initBoarding();

    runChatScene();
    preserveMode(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
