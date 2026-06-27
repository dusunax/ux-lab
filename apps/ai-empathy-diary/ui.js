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
    : (entry.emotion
      ? buildEmotionBadge(entry.emotion) + '<button class="emotion-edit-btn" data-action="edit-emotion" aria-label="감정 수정" title="감정 수정">✎</button>'
      : '');
  var empathyCell = isLoading
    ? '<span class="skeleton-bar line"></span>'
    : escapeHtml(entry.empathy || '');
  var deleteBtn = isLoading
    ? ''
    : '<button class="delete-btn" data-action="delete" aria-label="삭제">✕</button>';

  var feedbackHtml = '';
  if (!isLoading && entry.empathy) {
    var posActive = entry.feedback === 'positive';
    var negActive = entry.feedback === 'negative';
    var posCls = posActive ? ' selected-pos' : (negActive ? ' dim' : '');
    var negCls = negActive ? ' selected-neg' : (posActive ? ' dim' : '');
    var hasFeedback = posActive || negActive;
    feedbackHtml =
      '<div class="feedback-pair' + (hasFeedback ? ' has-feedback' : '') + '">' +
      '<button class="feedback-btn' + posCls + '" data-action="feedback" data-value="positive" aria-label="좋아요" title="좋아요">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M7 2L8.5 5.5H12L9.5 7.5L10.5 11L7 9L3.5 11L4.5 7.5L2 5.5H5.5L7 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' +
      '</svg>' +
      '</button>' +
      '<button class="feedback-btn' + negCls + '" data-action="feedback" data-value="negative" aria-label="싫어요" title="싫어요">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M5 3H10.5L11.5 8H8.5L9 11L5 7V3ZM5 3H3V8H5" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '</svg>' +
      '</button>' +
      '</div>';
  }

  return '<div class="data-row ' + tintClass + selClass + '"' +
    ' data-id="' + escapeHtml(entry.id) + '"' +
    ' tabindex="0" role="row"' +
    ' aria-label="행 ' + rowNumber + ': ' + escapeHtml(entry.text) + '">' +
    '<div class="row-num" role="rowheader">' + rowNumber + '</div>' +
    '<div class="cell col-a" role="cell">' + escapeHtml(entry.date) + '</div>' +
    '<div class="cell col-b" role="cell">' + escapeHtml(entry.text) + '</div>' +
    '<div class="cell col-c" role="cell">' + emotionCell + '</div>' +
    '<div class="cell col-d" role="cell" title="' + escapeHtml(entry.empathy || '') + '">' + empathyCell + '</div>' +
    '<div class="cell col-e" role="cell">' + feedbackHtml + deleteBtn + '</div>' +
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

/* ── Stats Dashboard ───────────────────────────── */
function renderStats() {
  var container = document.getElementById('stats-container');
  if (!container) return;
  var stats = computeModelStats();

  if (stats.size === 0) {
    container.innerHTML =
      '<div class="stats-empty">데이터가 아직 충분하지 않습니다.<br>' +
      '<span>피드백을 남긴 일기가 생기면 여기에 모델별 통계가 표시됩니다.</span></div>';
    return;
  }

  var rows = '';
  stats.forEach(function(s, label) {
    var feedbackTotal = s.positive + s.negative;
    var pct = feedbackTotal === 0 ? null : Math.round(s.positive / feedbackTotal * 100);
    var insufficient = feedbackTotal < FEEDBACK_MIN_SAMPLE;

    var barHtml = '';
    if (insufficient) {
      barHtml = '<span class="stats-insufficient">데이터 부족 (' + feedbackTotal + '개)</span>';
    } else if (pct === null) {
      barHtml = '<span class="stats-insufficient">피드백 없음</span>';
    } else {
      barHtml =
        '<div class="stats-bar-wrap" aria-label="' + escapeHtml(label) + ' 만족도 ' + pct + ' 퍼센트">' +
        '<div class="stats-bar-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="stats-pct">' + pct + '%</span>';
    }

    rows +=
      '<div class="stats-row">' +
      '<div class="stats-label">' + escapeHtml(label) + '</div>' +
      '<div class="stats-bar-area">' + barHtml + '</div>' +
      '<div class="stats-count">👍 ' + s.positive + ' / 👎 ' + s.negative + '</div>' +
      '</div>';
  });

  container.innerHTML =
    '<div class="stats-header">모델별 만족도</div>' +
    '<div class="stats-note">본인 피드백 기준 · null 제외 · 피드백 없는 모델은 집계 제외 · Sprint 7 이전 데이터는 집계에 포함되지 않습니다</div>' +
    rows;
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
