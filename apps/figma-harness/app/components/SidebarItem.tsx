export type SidebarItemVariant = 'blue' | 'light' | 'dark'

type SidebarItemProps = {
  label?: string
  active?: boolean
  variant?: SidebarItemVariant
  className?: string
}

const THEME: Record<SidebarItemVariant, {
  bg: string
  text: string
  activePill: string
  indicator: string
}> = {
  blue:  { bg: '#3749a6', text: '#ffffff', activePill: '#4c61cc', indicator: '#4c61cc' },
  light: { bg: '#ffffff', text: '#202224', activePill: '#4880ff', indicator: '#4880ff' },
  dark:  { bg: '#273142', text: '#ffffff', activePill: '#4880ff', indicator: '#4880ff' },
}

function PlaceholderIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill={color} opacity={0.7} />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill={color} opacity={0.7} />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill={color} opacity={0.7} />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill={color} opacity={0.7} />
    </svg>
  )
}

export default function SidebarItem({
  label = 'Products',
  active = false,
  variant = 'light',
  className = '',
}: SidebarItemProps) {
  const t = THEME[variant]
  const iconColor = active || variant !== 'light' ? '#ffffff' : '#202224'

  return (
    <div
      className={`relative flex items-center h-[50px] w-[240px] ${className}`}
      style={{ background: t.bg }}
    >
      {active ? (
        <>
          <div
            className="absolute -left-0.5 inset-y-0 w-[5px] rounded-[3px]"
            style={{ background: t.indicator }}
          />
          <div
            className="absolute inset-y-0 left-6 right-6 rounded-[6px]"
            style={{ background: t.activePill }}
          />
        </>
      ) : (
        variant === 'blue' && (
          <div className="absolute inset-0 shadow-[inset_-1px_0px_0px_0px_#313d4f] pointer-events-none" />
        )
      )}

      <span className="relative z-10 flex justify-center items-center w-[46px] shrink-0">
        <PlaceholderIcon color={iconColor} />
      </span>

      <span
        className="relative z-10 font-nunito font-semibold text-[14px] tracking-[0.3px] whitespace-nowrap"
        style={{ color: active ? '#ffffff' : t.text }}
      >
        {label}
      </span>
    </div>
  )
}
