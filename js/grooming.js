/* ============================================
   Grooming – JavaScript
   ============================================ */

/* ---- State ---- */
const state = {
  year:      0,
  month:     0,       // 0-based
  selectedDate: null, // Date object
  selectedTime: null, // string "08:00 AM"
  services:  [],      // [{ name, price, duration }]
};
// default duration when no service is selected
state.defaultDuration = 120;

/* ---- Time slots config ---- */
const ALL_SLOTS = [
  { label: '08:00 AM', booked: false },
  { label: '09:30 AM', booked: false },
  { label: '11:00 AM', booked: false },
  { label: '01:30 PM', booked: false },
  { label: '02:00 PM', booked: false },
  { label: '03:30 PM', booked: true  },   // simulate booked
  { label: '04:00 PM', booked: false },
  { label: '05:30 PM', booked: false },
];

/* ---- Helpers ---- */
const fmt = n => n.toLocaleString('vi-VN') + 'đ';
const pad = n => String(n).padStart(2, '0');

function fmtDate(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}

const VI_MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4',
  'Tháng 5','Tháng 6','Tháng 7','Tháng 8',
  'Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];

/* ---- Toast ---- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('gr-toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ============================================================
   CALENDAR
   ============================================================ */
function renderCalendar() {
  const today = new Date();
  const grid  = document.querySelector('.cal-grid');
  const label = document.getElementById('cal-month-label');

  label.textContent = `${VI_MONTHS[state.month]}.${state.year}`;

  // Remove old day cells (keep DOW headers = first 7 children)
  const existing = grid.querySelectorAll('.cal-day, .cal-day--empty');
  existing.forEach(el => el.remove());

  const firstDay = new Date(state.year, state.month, 1);
  // Monday=0 ... Sunday=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-day--empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const date = new Date(state.year, state.month, d);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = d === today.getDate() && state.month === today.getMonth() && state.year === today.getFullYear();
    const isSun = date.getDay() === 0;

    cell.className = 'cal-day';
    if (isPast)  cell.classList.add('cal-day--disabled');
    if (isToday) cell.classList.add('cal-day--today');
    if (isSun)   cell.classList.add('cal-day--sunday');
    if (
      state.selectedDate &&
      state.selectedDate.getDate()  === d &&
      state.selectedDate.getMonth() === state.month &&
      state.selectedDate.getFullYear() === state.year
    ) {
      cell.classList.add('cal-day--selected');
    }

    cell.textContent = d;
    if (!isPast) {
      cell.addEventListener('click', () => selectDate(new Date(state.year, state.month, d)));
    }
    grid.appendChild(cell);
  }
}

function selectDate(date) {
  state.selectedDate = date;
  state.selectedTime = null;
  renderCalendar();
  renderTimeSlots();
  updateSummary();
  showToast(`📅 Đã chọn ngày ${fmtDate(date)}`);
}

/* ============================================================
   TIME SLOTS
   ============================================================ */
function renderTimeSlots() {
  const grid = document.getElementById('time-grid');
  grid.innerHTML = '';

  ALL_SLOTS.forEach(slot => {
    const el = document.createElement('div');
    el.className = 'time-slot';
    el.textContent = slot.label;

    if (slot.booked) {
      el.classList.add('time-slot--booked');
    } else if (state.selectedTime === slot.label) {
      el.classList.add('time-slot--selected');
    } else {
      el.addEventListener('click', () => selectTime(slot.label));
    }
    grid.appendChild(el);
  });
}

function selectTime(label) {
  state.selectedTime = label;
  renderTimeSlots();
  updateSummary();
  showToast(`⏰ Đã chọn giờ ${label}`);
}

/* ============================================================
   SERVICE SELECTION
   ============================================================ */
function initServices() {
  const options = document.querySelectorAll('.svc-option');
  options.forEach(opt => {
    const input = opt.querySelector('input[type="checkbox"]');
    input.addEventListener('change', () => {
      const price    = parseInt(opt.dataset.price, 10);
      const duration = parseInt(opt.dataset.duration, 10);
      const name     = opt.querySelector('.svc-option__name').textContent.trim();

      if (input.checked) {
        opt.classList.add('selected');
        // avoid duplicates
        if (!state.services.some(s => s.name === name)) {
          state.services.push({ name, price, duration });
        }
      } else {
        opt.classList.remove('selected');
        state.services = state.services.filter(s => s.name !== name);
      }
      updateSummary();
    });
  });
}

/* ============================================================
   SUMMARY & TOTAL
   ============================================================ */
function updateSummary() {
  const dateEl     = document.getElementById('sum-date');
  const timeEl     = document.getElementById('sum-time');
  const durEl      = document.getElementById('sum-duration');
  const svcsEl     = document.getElementById('sum-svcs');
  const totalEl    = document.getElementById('sum-total');
  const confirmBtn = document.getElementById('btn-confirm');

  // Date
  dateEl.textContent = state.selectedDate ? fmtDate(state.selectedDate) : '--/--/----';

  // Time
  timeEl.textContent = state.selectedTime || '--:-- --';

  // Duration (sum of all selected). Show default when none selected.
  const totalDur = state.services.reduce((s, sv) => s + sv.duration, 0);
  if (totalDur > 0) {
    durEl.textContent = `~ ${totalDur} phút`;
  } else {
    durEl.textContent = `${state.defaultDuration} phút`;
  }

  // Services list
  if (state.services.length === 0) {
    svcsEl.textContent = 'Chưa chọn';
  } else {
    svcsEl.textContent = state.services.map(s => s.name).join(', ');
  }

  // Total price
  const total = state.services.reduce((s, sv) => s + sv.price, 0);
  const oldText = totalEl.textContent;
  totalEl.textContent = total > 0 ? fmt(total) : '0đ';
  if (totalEl.textContent !== oldText) {
    totalEl.classList.remove('bump');
    void totalEl.offsetWidth;
    totalEl.classList.add('bump');
  }

  // Enable confirm only when date + time + ≥1 service
  const ready = state.selectedDate && state.selectedTime && state.services.length > 0;
  confirmBtn.disabled = !ready;
}

/* ============================================================
   MODAL
   ============================================================ */
function showModal() {
  const overlay = document.getElementById('modal-overlay');
  const info    = document.getElementById('modal-info');
  const total   = state.services.reduce((s, sv) => s + sv.price, 0);

  info.innerHTML = `
    <div class="modal__info-row"><span>📅 Ngày hẹn</span><span>${fmtDate(state.selectedDate)}</span></div>
    <div class="modal__info-row"><span>⏰ Giờ hẹn</span><span>${state.selectedTime}</span></div>
    <div class="modal__info-row"><span>✂️ Dịch vụ</span><span>${state.services.map(s=>s.name).join(', ')}</span></div>
    <div class="modal__info-row"><span>💰 Tổng tiền</span><span style="color:var(--orange);font-size:15px">${fmt(total)}</span></div>
  `;

  overlay.classList.add('show');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

function resetBooking() {
  state.selectedDate = null;
  state.selectedTime = null;
  state.services = [];
  document.querySelectorAll('.svc-option.selected').forEach(o => {
    o.classList.remove('selected');
    o.querySelector('input').checked = false;
  });
  renderCalendar();
  renderTimeSlots();
  updateSummary();
}

/* ============================================================
   CALENDAR NAVIGATION
   ============================================================ */
function initCalNav() {
  document.getElementById('cal-prev').addEventListener('click', () => {
    state.month--;
    if (state.month < 0) { state.month = 11; state.year--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    state.month++;
    if (state.month > 11) { state.month = 0; state.year++; }
    renderCalendar();
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  state.year  = now.getFullYear();
  state.month = now.getMonth();

  renderCalendar();
  renderTimeSlots();
  updateSummary();
  initCalNav();
  initServices();

  // Confirm button
  document.getElementById('btn-confirm').addEventListener('click', () => {
    showModal();
  });

  // Modal actions
  document.getElementById('modal-close').addEventListener('click', () => {
    hideModal();
    window.location.href = '/project-web/trang chủ/trangchu.html';
  });
  document.getElementById('modal-new').addEventListener('click', () => {
    hideModal();
    resetBooking();
    showToast('🔄 Sẵn sàng đặt lịch mới!');
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });
});