type ComposeButtonProps = {
  label?: string
  onClick?: () => void
  className?: string
}

export default function ComposeButton({
  label = '+ Compose',
  onClick,
  className = '',
}: ComposeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        h-[43px] w-[238px] rounded-[8px]
        bg-[#4880ff]/90
        font-nunito font-bold text-[14px] tracking-[-0.05px]
        text-white text-center
        transition-opacity hover:opacity-100
        ${className}
      `}
    >
      {label}
    </button>
  )
}
