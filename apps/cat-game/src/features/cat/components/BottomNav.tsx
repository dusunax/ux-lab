import { Sprite } from './Sprite'

export type NavTab = 'home' | 'records'

/** 아이콘은 시트의 둥근 사각 아이콘 판 (public/sprites/nav-plate-*.png) */
const ICONS: Record<NavTab, string> = { home: 'nav-plate-cat', records: 'nav-plate-book' }

const ITEMS: { id: NavTab; label: string }[] = [
  { id: 'home', label: '일상' },
  { id: 'records', label: '기록' },
]

interface Props {
  active: NavTab
  onChange: (tab: NavTab) => void
  onChangeCat: () => void
}

export function BottomNav({ active, onChange, onChangeCat }: Props) {
  const item = (i: (typeof ITEMS)[number]) => (
    <button key={i.id} type="button" className={`nav__item${active === i.id ? ' is-active' : ''}`} aria-current={active === i.id ? 'page' : undefined} onClick={() => onChange(i.id)}>
      <Sprite className="nav__icon" name={ICONS[i.id]} height={26} draggable={false} />
      {i.label}
    </button>
  )
  return (
    <nav className="nav" aria-label="메뉴">
      {item(ITEMS[0])}
      <span className="nav__slot" aria-hidden="true" />
      {item(ITEMS[1])}
      <button type="button" className="nav__cat" onClick={onChangeCat} aria-label="성격 바꾸기">
        <Sprite name="deco-sign" width={64} draggable={false} />
      </button>
    </nav>
  )
}
