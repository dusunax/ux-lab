/**
 * 설정 창 위쪽의 탭 바. 사용자 입력(탭 이름)은 textContent·value로만 넣는다.
 * 버튼은 data-tab-action으로 표시하고 이벤트는 main.ts에서 위임 처리한다.
 */
import { TAB_LIMITS, canAddTab, canRemoveTab, hasPausedWork, type AppState } from '../../shared/tabs';

export type TabAction = 'switch' | 'remove' | 'add';

export interface TabBarUi {
  /** 이름을 고치는 중인 탭 */
  renaming: string | null;
  /** 삭제 확인을 기다리는 탭 */
  removeArmed: string | null;
}

function button(className: string, action: TabAction, text: string, label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.dataset.tabAction = action;
  btn.textContent = text;
  btn.title = label;
  btn.setAttribute('aria-label', label);
  return btn;
}

function renameInput(name: string, id: string): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'tab-input';
  input.type = 'text';
  input.maxLength = TAB_LIMITS.maxNameLength;
  input.value = name;
  input.dataset.tabRename = id;
  input.setAttribute('aria-label', '탭 이름');
  return input;
}

export function buildTabBar(app: AppState, ui: TabBarUi): HTMLElement[] {
  const removable = canRemoveTab(app);
  const items = app.tabs.map((tab) => {
    const active = tab.id === app.activeTabId;
    const item = document.createElement('div');
    item.className = `tab${active ? ' active' : ''}`;
    item.dataset.tabId = tab.id;
    if (active && ui.renaming === tab.id) {
      item.append(renameInput(tab.name, tab.id));
      return item;
    }
    const paused = hasPausedWork(tab);
    const label = active ? `${tab.name} · 더블클릭해서 이름 바꾸기` : paused ? `${tab.name} · 멈춤` : tab.name;
    const tabBtn = button('tab-btn', 'switch', tab.name, label);
    tabBtn.setAttribute('role', 'tab');
    tabBtn.setAttribute('aria-selected', String(active));
    if (paused) {
      const mark = document.createElement('span');
      mark.className = 'tab-paused';
      mark.setAttribute('aria-hidden', 'true');
      tabBtn.append(mark);
    }
    item.append(tabBtn);
    if (active && removable) {
      const armed = ui.removeArmed === tab.id;
      const remove = button(`tab-remove${armed ? ' armed' : ''}`, 'remove', armed ? '삭제?' : '×', armed ? '한 번 더 누르면 탭과 레이어를 삭제' : '탭 삭제');
      item.append(remove);
    }
    return item;
  });
  const add = button('tab-add', 'add', '+ 탭', canAddTab(app) ? '탭 추가' : `탭은 최대 ${TAB_LIMITS.maxTabs}개`);
  add.disabled = !canAddTab(app);
  return [...items, add];
}
