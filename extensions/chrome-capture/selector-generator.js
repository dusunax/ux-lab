// 클릭한 요소로부터 CSS 선택자를 생성하는 순수 함수 모음.
// DOM을 읽기만 하고 절대 변경하지 않는다 (element-picker.js의 상태를 참조하지 않음).

function generateSelector(el) {
  if (el.id && isUniqueSelector(`#${CSS.escape(el.id)}`)) {
    return `#${CSS.escape(el.id)}`;
  }

  const classCandidate = buildClassSelector(el);
  if (classCandidate) {
    const count = document.querySelectorAll(classCandidate).length;
    if (count >= 1 && count <= 5) return classCandidate;
  }

  return buildUniquePath(el);
}

function buildClassSelector(el) {
  const stableClasses = Array.from(el.classList).filter(isStableClassName).slice(0, 3);
  if (stableClasses.length === 0) return null;
  return `${el.tagName.toLowerCase()}.${stableClasses.map(CSS.escape).join('.')}`;
}

// css-in-js 해시 클래스(예: css-1a2b3c4, sc-hKwDye) 배제 휴리스틱
function isStableClassName(cls) {
  if (/^(css|sc|jsx|emotion)-[a-z0-9]{5,}$/i.test(cls)) return false;
  if (/\d{4,}/.test(cls)) return false; // 4자리 이상 연속 숫자 포함 시 동적 클래스로 간주
  return true;
}

function isUniqueSelector(selector) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch (e) {
    return false;
  }
}

// DevTools "Copy selector"와 유사한 nth-of-type 경로 생성 (최대 5단계 상위까지)
function buildUniquePath(el, maxDepth = 5) {
  const parts = [];
  let node = el;
  for (let i = 0; i < maxDepth && node && node.nodeType === 1; i++) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const parent = node.parentElement;
    if (!parent) {
      parts.unshift(node.tagName.toLowerCase());
      break;
    }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
    const index = siblings.indexOf(node) + 1;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${index})`);
    const candidate = parts.join(' > ');
    if (isUniqueSelector(candidate)) return candidate;
    node = parent;
  }
  return parts.join(' > ');
}
