import { useState, useRef } from 'react'
import { EyeOff } from 'lucide-react'

interface EyeButtonProps {
  isHidden: boolean
  onToggle: () => void
}

export function EyeButton({ isHidden, onToggle }: EyeButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    setHovered(true)
    timerRef.current = setTimeout(() => setShowTooltip(true), 300)
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setShowTooltip(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 56, height: '100%', cursor: 'pointer', zIndex: 1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      tabIndex={0}
      role="button"
      aria-label={isHidden ? 'Mark as interesting' : 'Mark as not interesting'}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
    >
      <EyeOff
        size={22}
        style={{
          color: hovered ? '#6C4BF5' : isHidden ? '#FFFFFF' : '#A1A1AA',
          opacity: isHidden ? 1 : hovered ? 1 : 0.6,
          transition: 'color 0.15s',
        }}
      />
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            right: 40,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#2A2A2C',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 14,
            color: '#A1A1AA',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {isHidden ? 'Interesting' : 'Not interesting'}
        </div>
      )}
    </div>
  )
}
