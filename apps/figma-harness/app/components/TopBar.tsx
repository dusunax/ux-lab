// Avatar image from Figma (expires in 7 days — replace with a stable asset in production)
const DEFAULT_AVATAR = 'https://www.figma.com/api/mcp/asset/bd3e3d86-cde6-4846-b00b-b5d08a497c97'

export type TopBarTheme = 'light' | 'dark'
export type TopBarVariant = '1' | '2'

type TopBarProps = {
  theme?: TopBarTheme
  /** variant 1 includes language selector, variant 2 does not */
  variant?: TopBarVariant
  userName?: string
  userRole?: string
  avatarUrl?: string
  notificationCount?: number
  className?: string
}

const THEME = {
  light: {
    bg: '#ffffff',
    text: '#202224',
    searchBg: '#f5f6fa',
    searchBorder: '#d5d5d5',
    searchText: '#202224',
    langText: '#646464',
    nameText: '#404040',
    roleText: '#565656',
    iconColor: '#202224',
  },
  dark: {
    bg: '#273142',
    text: '#ffffff',
    searchBg: '#323d4e',
    searchBorder: 'rgba(207,207,207,0.11)',
    searchText: '#ffffff',
    langText: '#f2f2f2',
    nameText: '#ffffff',
    roleText: '#ffffff',
    iconColor: '#ffffff',
  },
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function BellIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function HamburgerIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
      <rect y="3" width="20" height="2" rx="1" />
      <rect y="9" width="20" height="2" rx="1" />
      <rect y="15" width="20" height="2" rx="1" />
    </svg>
  )
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function TopBar({
  theme = 'light',
  variant = '1',
  userName = 'Moni Roy',
  userRole = 'Admin',
  avatarUrl = DEFAULT_AVATAR,
  notificationCount = 6,
  className = '',
}: TopBarProps) {
  const t = THEME[theme]

  return (
    <div
      className={`flex items-center h-[70px] w-full px-6 gap-4 ${className}`}
      style={{ background: t.bg }}
    >
      {/* Hamburger */}
      <button className="shrink-0 opacity-90">
        <HamburgerIcon color={t.iconColor} />
      </button>

      {/* Search */}
      <div
        className="flex items-center gap-2 h-[42px] px-4 rounded-[19px] w-full max-w-[380px]"
        style={{
          background: t.searchBg,
          border: `0.6px solid ${t.searchBorder}`,
        }}
      >
        <SearchIcon color={`${t.searchText}80`} />
        <span
          className="font-nunito text-[14px] opacity-50"
          style={{ color: t.searchText }}
        >
          Search
        </span>
      </div>

      <div className="flex-1" />

      {/* Notification bell */}
      <div className="relative shrink-0">
        <BellIcon color={t.iconColor} />
        {notificationCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#4880ff] font-nunito font-bold text-[10px] text-white">
            {notificationCount}
          </span>
        )}
      </div>

      {/* Language selector (variant 1 only) */}
      {variant === '1' && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xl leading-none">🇬🇧</span>
          <span className="font-nunito font-semibold text-[14px]" style={{ color: t.langText }}>
            English
          </span>
          <ChevronIcon color={t.langText} />
        </div>
      )}

      {/* Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-[44px] h-[44px] rounded-full overflow-hidden shrink-0 bg-gray-200">
          <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
        </div>
        <div className="hidden sm:block">
          <p className="font-nunito font-bold text-[14px] leading-tight" style={{ color: t.nameText }}>
            {userName}
          </p>
          <p className="font-nunito font-semibold text-[12px] leading-tight" style={{ color: t.roleText }}>
            {userRole}
          </p>
        </div>
        <ChevronIcon color={t.nameText} />
      </div>
    </div>
  )
}
