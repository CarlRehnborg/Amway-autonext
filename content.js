// ============================================
// Amway AutoNext — content.js
// Tự động bấm Next với delay ngẫu nhiên
// ============================================

// Danh sách selector nút Next (thêm vào đây nếu gặp khóa học mới)
const SELECTORS = ['#btnNext', '#f_next', '#btn_next', '#nextBtn'];
const STORAGE_KEY = 'amwayAutoNext';

let timerId = null;
let clickCount = 0;
let minMs = 1000;
let maxMs = 2000;

// --- Visibility: giả lập tab luôn active ---
Object.defineProperty(document, 'hidden',          { get: () => false });
Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
document.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
window.addEventListener('blur',              e => e.stopImmediatePropagation(), true);

// Giả lập chuột di chuyển mỗi 3s để tránh idle detection
setInterval(() => {
  document.dispatchEvent(new MouseEvent('mousemove', {
    clientX: Math.random() * 500,
    clientY: Math.random() * 400
  }));
}, 3000);

// --- Helpers ---
const rand      = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const isRunning = ()     => timerId !== null;

const findBtn = () => SELECTORS
  .map(sel => document.querySelector(sel))
  .find(el => el?.getBoundingClientRect().width > 0) ?? null;

const saveState = () => chrome.storage.local.set({
  [STORAGE_KEY]: { running: isRunning(), min: minMs, max: maxMs, count: clickCount }
});

// --- Core: lên lịch click tiếp theo ---
function scheduleNext() {
  if (!isRunning()) return;

  timerId = setTimeout(() => {
    // Bỏ qua nếu media đang phát, thử lại sau
    const media = document.querySelector('video, audio');
    if (media && !media.paused && !media.ended) return scheduleNext();

    const btn = findBtn();
    if (btn) {
      btn.click();
      clickCount++;
      saveState();
      chrome.runtime.sendMessage({ type: 'CLICK_COUNT', count: clickCount }).catch(() => {});
    }

    scheduleNext(); // lặp lại
  }, rand(minMs, maxMs));
}

function start(min, max) {
  stop();
  minMs = min ?? 1500;
  maxMs = max ?? 3000;
  timerId = true; // đánh dấu running
  scheduleNext();
  saveState();
}

function stop() {
  clearTimeout(timerId);
  timerId = null;
  saveState();
}

// --- Nhận lệnh từ popup ---
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  switch (msg?.type) {
    case 'START':  start(msg.min, msg.max);
                   sendResponse({ type: 'STATUS_REPLY', running: true,          count: clickCount }); break;
    case 'STOP':   stop();
                   sendResponse({ type: 'STATUS_REPLY', running: false,         count: clickCount }); break;
    case 'STATUS': sendResponse({ type: 'STATUS_REPLY', running: isRunning(),   count: clickCount,
                                  min: minMs, max: maxMs });                                          break;
    default: return false;
  }
  return true;
});

// --- Khôi phục phiên cũ khi trang reload ---
chrome.storage.local.get(STORAGE_KEY, ({ [STORAGE_KEY]: s } = {}) => {
  if (!s) return;
  clickCount = s.count ?? 0;
  if (s.running) start(s.min, s.max);
});