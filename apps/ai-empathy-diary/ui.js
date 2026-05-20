'use strict';

/* ── UI / Render functions ─────────────────────────────────────────────────
 * Depends on globals from:
 *   config.js  — EMOTION_CONFIG, VIRTUAL_THRESHOLD, VIRTUAL_ROW_EST, TOAST_DURATION_MS
 *   utils.js   — escapeHtml(), todayStr()
 * Reads/writes app-state globals declared in index.html inline script:
 *   entries, selectedId, filterEmotion, virtualActive
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Name Box ──────────────────────────────────── */
function updateNameBox(rowIndex, col) {
  var colLetter = COLUMN_LETTERS[col] || 'A';
  document.getElementById('name-box').textContent = colLetter + rowIndex;
}

/* ── Status Bar ────────────────────────────────── */
function updateStatus(text) {
  document.getElementById('status-text').textContent = text;
  var total = entries.length;
  var filtered = getFiltered().length;
  var countEl = document.getElementById('status-count');
  if (total === 0) {
    countEl.textContent = '';
  } else if (filterEmotion) {
    countEl.textContent = filtered + ' / ' + total + '개';
  } else {
    countEl.textContent = '항목 수: ' + total;
  }
}

/* ── Error Toast ───────────────────────────────── */
var _toastTimer = null;

function showError(message, retryLabel, retryCallback, duration) {
  var dur = (duration !== undefined) ? duration : TOAST_DURATION_MS;
  var toast = document.getElementById('error-toast');
  toast.innerHTML = '';

  var msg = document.createElement('span');
  msg.textContent = message;
  toast.appendChild(msg);

  if (retryLabel) {
    var btn = document.createElement('button');
    btn.className = 'toast-retry';
    btn.textContent = retryLabel;
    btn.addEventListener('click', function() {
      toast.classList.remove('show');
      if (retryCallback) retryCallback();
    });
    toast.appendChild(btn);
  }

  toast.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { toast.classList.remove('show'); }, dur);
}

/* ── Row Building ──────────────────────────────── */
function buildEmotionBadge(emotion) {
  var cls = (EMOTION_CONFIG[emotion] && EMOTION_CONFIG[emotion].badge) || 'emo-calm';
  return '<span class="emotion-badge ' + cls + '">' + escapeHtml(emotion) + '</span>';
}

function buildRow(entry, rowNumber) {
  var tintClass = (EMOTION_CONFIG[entry.emotion] && EMOTION_CONFIG[entry.emotion].tint) || '';
  var selClass = (entry.id === selectedId) ? ' selected' : '';
  var isLoading = entry._loading;

  var emotionCell = isLoading
    ? '<span class="skeleton-bar badge"></span>'
    : (entry.emotion ? buildEmotionBadge(entry.emotion) : '');
  var empathyCell = isLoading
    ? '<span class="skeleton-bar line"></span>'
    : escapeHtml(entry.empathy || '');
  var deleteBtn = isLoading
    ? ''
    : '<button class="delete-btn" data-action="delete" aria-label="삭제">✕</button>';

  return '<div class="data-row ' + tintClass + selClass + '"' +
    ' data-id="' + escapeHtml(entry.id) + '"' +
    ' tabindex="0" role="row"' +
    ' aria-label="행 ' + rowNumber + ': ' + escapeHtml(entry.text) + '">' +
    '<div class="row-num" role="rowheader">' + rowNumber + '</div>' +
    '<div class="cell col-a" role="cell">' + escapeHtml(entry.date) + '</div>' +
    '<div class="cell col-b" role="cell">' + escapeHtml(entry.text) + '</div>' +
    '<div class="cell col-c" role="cell">' + emotionCell + '</div>' +
    '<div class="cell col-d" role="cell" title="' + escapeHtml(entry.empathy || '') + '">' + empathyCell + '</div>' +
    '<div class="cell col-e" role="cell">' + deleteBtn + '</div>' +
    '</div>';
}

/* Riley: ghost row for empty state */
function renderEmptyGhost() {
  return '<div class="empty-state-hint" role="status">' +
    '<span>formula bar에 오늘 있었던 일을 입력하고 <kbd>Enter</kbd>를 누르세요 ↑</span>' +
    '</div>' +
    '<div class="data-row empty-ghost" style="opacity:0.35; cursor:default;" aria-hidden="true">' +
    '<div class="row-num">1</div>' +
    '<div class="cell col-a" style="color:#bbb; font-style:italic;">' + escapeHtml(todayStr()) + '</div>' +
    '<div class="cell col-b" style="color:#bbb; font-style:italic;">데이터를 입력하세요</div>' +
    '<div class="cell col-c"></div><div class="cell col-d"></div><div class="cell col-e"></div>' +
    '</div>';
}

function renderVirtual(sorted) {
  var body = document.getElementById('sheet-body');
  var container = document.getElementById('rows-container');
  var viewportH = body.clientHeight || 480;
  var BUFFER = 5;
  var visible = Math.ceil(viewportH / VIRTUAL_ROW_EST) + BUFFER * 2;
  var scrollTop = body.scrollTop;
  var start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_EST) - BUFFER);
  var end = Math.min(sorted.length, start + visible);

  container.style.paddingTop = (start * VIRTUAL_ROW_EST) + 'px';
  container.style.paddingBottom = ((sorted.length - end) * VIRTUAL_ROW_EST) + 'px';
  container.innerHTML = sorted.slice(start, end).map(function(e, i) {
    return buildRow(e, start + i + 1);
  }).join('');
}

function renderRows() {
  var container = document.getElementById('rows-container');
  var filtered = getFiltered();

  if (entries.length === 0) {
    virtualActive = false;
    container.style.paddingTop = '';
    container.style.paddingBottom = '';
    container.innerHTML = renderEmptyGhost();
    return;
  }

  if (filtered.length === 0) {
    virtualActive = false;
    container.style.paddingTop = '';
    container.style.paddingBottom = '';
    container.innerHTML = '<div class="data-row empty-ghost" style="opacity:0.5; cursor:default;" aria-live="polite">' +
      '<div class="row-num">—</div><div class="cell col-a"></div>' +
      '<div class="cell col-b" style="color:#999; font-style:italic; white-space:normal;">' +
      '"' + escapeHtml(filterEmotion) + '" 감정으로 기록된 일지가 없어요</div>' +
      '<div class="cell col-c"></div><div class="cell col-d"></div><div class="cell col-e"></div>' +
      '</div>';
    return;
  }

  virtualActive = (filtered.length >= VIRTUAL_THRESHOLD);

  if (virtualActive) {
    renderVirtual(filtered);
  } else {
    container.style.paddingTop = '';
    container.style.paddingBottom = '';
    container.innerHTML = filtered.map(function(entry, i) {
      return buildRow(entry, i + 1);
    }).join('');
  }
}

/* Chase: renumber all real rows after DOM mutation */
function renumberRows() {
  var container = document.getElementById('rows-container');
  container.querySelectorAll('.data-row:not(.empty-ghost)').forEach(function(row, i) {
    var numEl = row.querySelector('.row-num');
    if (numEl) numEl.textContent = i + 1;
  });
}

/* Chase: replace a single row's DOM without full re-render */
function updateRowDOM(id) {
  var container = document.getElementById('rows-container');
  var el = container.querySelector('[data-id="' + id + '"]');
  if (!el) return;
  var sorted = getSorted();
  var idx = sorted.findIndex(function(e) { return e.id === id; });
  if (idx < 0) return;
  var tmp = document.createElement('template');
  tmp.innerHTML = buildRow(sorted[idx], idx + 1).trim();
  el.replaceWith(tmp.content.firstChild);
}

/* ── Loading Skeletons ─────────────────────────── */
function showLoadingSkeletons(count) {
  var n = (count !== undefined) ? count : 4;
  var container = document.getElementById('rows-container');
  var rows = '';
  for (var i = 0; i < n; i++) {
    rows += '<div class="data-row">' +
      '<div class="row-num">' + (i + 1) + '</div>' +
      '<div class="cell col-a"><span class="skeleton-bar line" style="width:70px"></span></div>' +
      '<div class="cell col-b"><span class="skeleton-bar line"></span></div>' +
      '<div class="cell col-c"><span class="skeleton-bar badge"></span></div>' +
      '<div class="cell col-d"><span class="skeleton-bar line"></span></div>' +
      '<div class="cell col-e"></div>' +
      '</div>';
  }
  container.innerHTML = rows;
}
