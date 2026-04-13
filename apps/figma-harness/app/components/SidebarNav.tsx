export type SidebarTheme = 'light' | 'blue'

type NavItem = { label: string }

type SidebarNavProps = {
  theme?: SidebarTheme
  activeItem?: string
  className?: string
}

const MAIN_ITEMS: NavItem[] = [
  { label: 'Dashboard' },
  { label: 'Products' },
  { label: 'Favourites' },
  { label: 'Messenger' },
  { label: 'Order Lists' },
  { label: 'E-commerce' },
]

const PAGE_ITEMS: NavItem[] = [
  { label: 'File Manager' },
  { label: 'Calendar' },
  { label: 'Feed' },
  { label: 'To-Do' },
  { label: 'Contact' },
  { label: 'Invoice' },
  { label: 'UI Elements' },
  { label: 'Profile' },
  { label: 'Table' },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Settings' },
  { label: 'Logout' },
]

const THEME = {
  light: {
    bg: '#ffffff',
    border: '1px solid #e8e8e8',
    text: '#202224',
    logoAccent: '#202224',
    labelOpacity: 'opacity-60',
    activePill: '#4880ff',
    indicator: '#4880ff',
    divider: '#e8e8e8',
  },
  blue: {
    bg: '#3749a6',
    border: 'none',
    text: '#ffffff',
    logoAccent: '#00ff1a',
    labelOpacity: 'opacity-60',
    activePill: '#4c61cc',
    indicator: '#4c61cc',
    divider: 'rgba(255,255,255,0.15)',
  },
}

function Icon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill={color} opacity={0.7} />
      <rect x="11" y="1" width="6" height="6" rx="1" fill={color} opacity={0.7} />
      <rect x="1" y="11" width="6" height="6" rx="1" fill={color} opacity={0.7} />
      <rect x="11" y="11" width="6" height="6" rx="1" fill={color} opacity={0.7} />
    </svg>
  )
}

function NavItemRow({
  label,
  active,
  theme,
}: {
  label: string
  active: boolean
  theme: typeof THEME.light
}) {
  const iconColor = active ? '#ffffff' : theme.text
  return (
    <div
      className="relative flex items-center h-[50px] w-full"
      style={{ background: active ? 'transparent' : 'transparent' }}
    >
      {active && (
        <>
          <div
            className="absolute -left-0.5 inset-y-0 w-[5px] rounded-[3px]"
            style={{ background: theme.indicator }}
          />
          <div
            className="absolute inset-y-0 left-6 right-6 rounded-[6px]"
            style={{ background: theme.activePill }}
          />
        </>
      )}
      <span className="relative z-10 flex justify-center items-center w-[46px] shrink-0">
        <Icon color={active ? '#ffffff' : iconColor} />
      </span>
      <span
        className="relative z-10 font-nunito font-semibold text-[14px] tracking-[0.3px] whitespace-nowrap"
        style={{ color: active ? '#ffffff' : theme.text }}
      >
        {label}
      </span>
    </div>
  )
}

export default function SidebarNav({
  theme = 'light',
  activeItem = 'Dashboard',
  className = '',
}: SidebarNavProps) {
  const t = THEME[theme]

  return (
    <div
      className={`flex flex-col w-[240px] h-[1070px] overflow-hidden ${className}`}
      style={{ background: t.bg, border: t.border }}
    >
      {/* Logo */}
      <div className="flex items-center h-[81px] px-[40px] shrink-0">
        <span className="font-nunito font-extrabold text-[20px] text-[#4880ff]">Dash</span>
        <span className="font-nunito font-extrabold text-[20px]" style={{ color: t.logoAccent }}>
          Stack
        </span>
      </div>

      {/* Main nav items */}
      <div className="flex flex-col">
        {MAIN_ITEMS.map((item) => (
          <NavItemRow key={item.label} label={item.label} active={activeItem === item.label} theme={t} />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-px shrink-0" style={{ background: t.divider }} />

      {/* Pages label */}
      <p
        className={`font-nunito font-bold text-[12px] tracking-[0.26px] px-[40px] py-2 shrink-0 ${t.labelOpacity}`}
        style={{ color: t.text }}
      >
        PAGES
      </p>

      {/* Page items */}
      <div className="flex flex-col flex-1">
        {PAGE_ITEMS.map((item) => (
          <NavItemRow key={item.label} label={item.label} active={activeItem === item.label} theme={t} />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 h-px shrink-0" style={{ background: t.divider }} />

      {/* Bottom items */}
      <div className="flex flex-col shrink-0">
        {BOTTOM_ITEMS.map((item) => (
          <NavItemRow key={item.label} label={item.label} active={activeItem === item.label} theme={t} />
        ))}
      </div>
    </div>
  )
}
