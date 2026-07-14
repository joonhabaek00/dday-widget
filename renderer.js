const listEl = document.getElementById('list');
const modalEl = document.getElementById('modal');
const settingsEl = document.getElementById('settings');
const formEl = document.getElementById('dday-form');
const formTitleEl = document.getElementById('form-title');
const inputLabel = document.getElementById('input-label');
const inputDate = document.getElementById('input-date');
const inputId = document.getElementById('input-id');
const btnDelete = document.getElementById('btn-delete');
const toggleAutolaunch = document.getElementById('toggle-autolaunch');

let ddays = [];

// ---------- date helpers ----------
function todayMidnight() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function parseLocalDate(str) {
  // str: "YYYY-MM-DD" -> local midnight Date
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(dateStr) {
  const MS = 86400000;
  const target = parseLocalDate(dateStr);
  return Math.round((target - todayMidnight()) / MS);
}

function formatCount(dateStr) {
  const d = diffDays(dateStr);
  if (d > 0) return { text: `D-${d}`, cls: '' };
  if (d === 0) return { text: 'D-Day', cls: 'today' };
  return { text: `D+${Math.abs(d)}`, cls: 'past' };
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}.${m}.${d}`;
}

// ---------- sorting: nearest upcoming first, past events last ----------
function sorted(items) {
  return [...items].sort((a, b) => {
    const da = diffDays(a.date);
    const db = diffDays(b.date);
    const aUpcoming = da >= 0;
    const bUpcoming = db >= 0;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aUpcoming) return da - db; // soonest future first
    return db - da; // most recent past first (e.g. D+1 before D+30)
  });
}

// ---------- render ----------
function render() {
  listEl.innerHTML = '';

  if (ddays.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '아직 D-day가 없어요.<br>우측 상단 <b>+</b> 로 추가하세요.';
    listEl.appendChild(empty);
    return;
  }

  for (const item of sorted(ddays)) {
    const count = formatCount(item.date);

    const row = document.createElement('div');
    row.className = 'dday-item' + (count.cls === 'past' ? ' past' : '');

    const info = document.createElement('div');
    info.className = 'dday-info';

    const label = document.createElement('div');
    label.className = 'dday-label';
    label.textContent = item.label;

    const date = document.createElement('div');
    date.className = 'dday-date';
    date.textContent = formatDate(item.date);

    info.appendChild(label);
    info.appendChild(date);

    const countEl = document.createElement('div');
    countEl.className = 'dday-count ' + count.cls;
    countEl.textContent = count.text;

    row.appendChild(info);
    row.appendChild(countEl);
    row.addEventListener('click', () => openForm(item));

    listEl.appendChild(row);
  }
}

async function persist() {
  await window.api.saveDdays(ddays);
}

// ---------- form (add / edit) ----------
function openForm(item) {
  if (item) {
    formTitleEl.textContent = 'D-day 수정';
    inputId.value = item.id;
    inputLabel.value = item.label;
    inputDate.value = item.date;
    btnDelete.classList.remove('hidden');
  } else {
    formTitleEl.textContent = 'D-day 추가';
    inputId.value = '';
    inputLabel.value = '';
    inputDate.value = '';
    btnDelete.classList.add('hidden');
  }
  modalEl.classList.remove('hidden');
  inputLabel.focus();
}

function closeForm() {
  modalEl.classList.add('hidden');
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const label = inputLabel.value.trim();
  const date = inputDate.value;
  if (!label || !date) return;

  const id = inputId.value;
  if (id) {
    const target = ddays.find((x) => x.id === id);
    if (target) {
      target.label = label;
      target.date = date;
    }
  } else {
    ddays.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label, date });
  }
  await persist();
  closeForm();
  render();
});

btnDelete.addEventListener('click', async () => {
  const id = inputId.value;
  if (!id) return;
  ddays = ddays.filter((x) => x.id !== id);
  await persist();
  closeForm();
  render();
});

document.getElementById('btn-cancel').addEventListener('click', closeForm);
document.getElementById('btn-add').addEventListener('click', () => openForm(null));

// ---------- settings ----------
async function openSettings() {
  toggleAutolaunch.checked = await window.api.getAutoLaunch();
  settingsEl.classList.remove('hidden');
}

document.getElementById('btn-settings').addEventListener('click', openSettings);
document.getElementById('btn-settings-close').addEventListener('click', () => {
  settingsEl.classList.add('hidden');
});
toggleAutolaunch.addEventListener('change', async () => {
  const result = await window.api.setAutoLaunch(toggleAutolaunch.checked);
  toggleAutolaunch.checked = result;
});

document.getElementById('btn-hide').addEventListener('click', () => window.api.hideWindow());
document.getElementById('btn-quit').addEventListener('click', () => window.api.quitApp());

// Close overlays with Escape.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modalEl.classList.add('hidden');
    settingsEl.classList.add('hidden');
  }
});

// ---------- init ----------
(async function init() {
  ddays = (await window.api.loadDdays()) || [];
  render();

  // Recompute counts at local midnight so numbers stay fresh.
  scheduleMidnightRefresh();
})();

function scheduleMidnightRefresh() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  setTimeout(() => {
    render();
    scheduleMidnightRefresh();
  }, next - now);
}
