// ==UserScript==
// @name         Amway AutoNext
// @namespace    https://github.com/your-username/amway-autonext
// @version      1.0
// @description  Tự động bấm Next + random delay + fake visibility
// @author       your-name
// @match        https://lrs.academy.amway.com.vn/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Thêm selector mới vào đây nếu gặp khóa học khác
  const SELECTORS = [
                        '#btnNext',
                        '#f_next',
                        '#btn_next',
                        '#nextBtn'
                    ];

  let timerId    = null;
  let clickCount = GM_getValue('count', 0);
  let minMs      = GM_getValue('min',   1000);
  let maxMs      = GM_getValue('max',   2000);

  // --- Visibility: giả lập tab luôn active ---
  Object.defineProperty(document, 'hidden',          { get: () => false });
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
  document.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
  window.addEventListener('blur',              e => e.stopImmediatePropagation(), true);

  // Giả lập chuột di chuyển mỗi 3s
  setInterval(() => {
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: Math.random() * 500,
      clientY: Math.random() * 400
    }));
  }, 3000);

  // --- Helpers ---
  const rand      = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const isRunning = ()     => timerId !== null;
  const findBtn   = ()     => SELECTORS
    .map(sel => document.querySelector(sel))
    .find(el => el?.getBoundingClientRect().width > 0) ?? null;

  const saveState = () => {
    GM_setValue('count', clickCount);
    GM_setValue('min',   minMs);
    GM_setValue('max',   maxMs);
  };

  // --- Core ---
  function scheduleNext() {
    if (!isRunning()) return;
    timerId = setTimeout(() => {
      const media = document.querySelector('video, audio');
      if (media && !media.paused && !media.ended) return scheduleNext();

      const btn = findBtn();
      if (btn) {
        btn.click();
        clickCount++;
        updateUI();
        saveState();
      }
      scheduleNext();
    }, rand(minMs, maxMs));
  }

  function start() {
    stop();
    timerId = true;
    scheduleNext();
    updateUI();
  }

  function stop() {
    clearTimeout(timerId);
    timerId = null;
    updateUI();
  }

  // --- UI nổi góc màn hình ---
  function createUI() {
    const panel = document.createElement('div');
    panel.id = 'amway-autonext-panel';
    panel.innerHTML = `
      <style>
        #amway-autonext-panel {
          position: fixed; bottom: 70px; right: 16px; z-index: 99999;
          background: #fff; border: 1px solid #ccc; border-radius: 8px;
          padding: 10px 14px; font-size: 13px; font-family: sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,.2); min-width: 200px;
        }
        #amway-autonext-panel b { display: block; margin-bottom: 6px; }
        #amway-autonext-panel label { font-size: 11px; color: #555; }
        #amway-autonext-panel input[type=number] {
          width: 60px; margin: 2px 4px 6px 0; padding: 2px 4px; border: 1px solid #ccc; border-radius: 4px;
        }
        #amway-autonext-panel button {
          padding: 4px 10px; border: none; border-radius: 4px;
          cursor: pointer; margin-right: 4px; font-size: 12px;
        }
        #btn-start { background: #4CAF50; color: #fff; }
        #btn-stop  { background: #f44336; color: #fff; }
        #an-status { margin-top: 6px; font-size: 11px; color: #555; }
      </style>
      <b>Amway AutoNext</b>
      <label>Min (ms)</label><br>
      <input id="an-min" type="number" value="${minMs}" step="100"><br>
      <label>Max (ms)</label><br>
      <input id="an-max" type="number" value="${maxMs}" step="100"><br>
      <button id="btn-start">Bat dau</button>
      <button id="btn-stop">Dung</button>
      <div id="an-status">San sang</div>
    `;
    document.body.appendChild(panel);

    document.getElementById('btn-start').onclick = () => {
      minMs = parseInt(document.getElementById('an-min').value) || 1500;
      maxMs = parseInt(document.getElementById('an-max').value) || 3000;
      start();
    };
    document.getElementById('btn-stop').onclick = stop;
  }

  function updateUI() {
    const el = document.getElementById('an-status');
    if (!el) return;
    el.textContent = isRunning()
      ? `Dang chay — da bam ${clickCount} lan`
      : `Da dung — tong ${clickCount} lan`;
  }

  // Chờ body sẵn rồi inject UI
  if (document.body) createUI();
  else window.addEventListener('load', createUI);

})();