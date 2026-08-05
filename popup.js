// Amway AutoNext - popup

const CAC_TOC_DO = [500, 1000, 1500, 3000];

const tocDo = document.getElementById('tocDo');
const nhanTocDo = document.getElementById('nhanTocDo');
const btnBatDau = document.getElementById('btnBatDau');
const btnDung = document.getElementById('btnDung');
const soLan = document.getElementById('soLan');
const trangThai = document.getElementById('trangThai');
const loi = document.getElementById('loi');

function layInterval() {
  return CAC_TOC_DO[Number(tocDo.value)];
}

function datInterval(ms) {
  const i = CAC_TOC_DO.indexOf(ms);
  if (i >= 0) tocDo.value = String(i);
  nhanTocDo.textContent = String(layInterval());
}

function veTrangThai(dangChay) {
  trangThai.textContent = dangChay ? 'Đang chạy' : 'Đã dừng';
  trangThai.className = dangChay ? 'dang-chay' : 'da-dung';
  btnBatDau.disabled = dangChay;
  btnDung.disabled = !dangChay;
  tocDo.disabled = dangChay;
}

function veSoLan(count) {
  soLan.textContent = String(count || 0);
}

function baoLoi(text) {
  loi.textContent = text || '';
}

// Gửi message tới content script của tab đang mở
function guiToiTab(message) {
  return chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => {
      if (!tab) throw new Error('no-tab');
      return chrome.tabs.sendMessage(tab.id, message);
    });
}

function xuLyLoiKetNoi() {
  baoLoi('Không kết nối được với trang. Hãy mở khóa học tại lrs.academy.amway.com.vn rồi tải lại trang (F5).');
  veTrangThai(false);
}

tocDo.addEventListener('input', () => {
  nhanTocDo.textContent = String(layInterval());
});

btnBatDau.addEventListener('click', () => {
  baoLoi('');
  guiToiTab({ type: 'START', interval: layInterval() })
    .then((reply) => {
      veTrangThai(true);
      if (reply) veSoLan(reply.count);
    })
    .catch(xuLyLoiKetNoi);
});

btnDung.addEventListener('click', () => {
  baoLoi('');
  guiToiTab({ type: 'STOP' })
    .then((reply) => {
      veTrangThai(false);
      if (reply) veSoLan(reply.count);
    })
    .catch(xuLyLoiKetNoi);
});

// Cập nhật realtime khi content script bấm được nút
chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'CLICK_COUNT') veSoLan(message.count);
});

// Mở popup -> đồng bộ trạng thái hiện tại
datInterval(1500);
veTrangThai(false);
guiToiTab({ type: 'STATUS' })
  .then((reply) => {
    if (!reply) return;
    veSoLan(reply.count);
    veTrangThai(reply.running);
    if (reply.interval) datInterval(reply.interval);
  })
  .catch(xuLyLoiKetNoi);
