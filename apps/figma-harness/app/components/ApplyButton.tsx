type ApplyButtonProps = {
  label?: string
  onClick?: () => void
  className?: string
}

export default function ApplyButton({
  label = 'Apply Now',
  onClick,
  className = '',
}: ApplyButtonProps) {
  return (
    <div className={`relative h-[36px] w-[129px] ${className}`}>
      {/* glow shadow */}
      <div
        className="absolute rounded-[2px] bg-[#4880ff] opacity-[0.48]"
        style={{
          inset: '86.11% 32.56% 0 32.56%',
          filter: 'blur(8.155px)',
        }}
      />
      {/* button */}
      <button
        onClick={onClick}
        className="absolute inset-0 bottom-[5.56%] rounded-[6px] bg-[#4880ff] font-nunito font-bold text-[12px] text-white"
      >
        {label}
      </button>
    </div>
  )
}
