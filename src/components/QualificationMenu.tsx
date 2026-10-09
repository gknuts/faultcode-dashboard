import React, { useRef, useEffect } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'

interface QualificationMenuProps {
  referenceEl: Element | null
  currentStatus: 'abnormal' | 'normal'
  onQualify: (status: 'abnormal' | 'normal') => void
  onClose: () => void
}

export function QualificationMenu({ referenceEl, currentStatus, onQualify, onClose }: QualificationMenuProps) {
  const abnormalRef = useRef<HTMLButtonElement>(null)
  const normalRef = useRef<HTMLButtonElement>(null)

  const { refs, floatingStyles } = useFloating({
    placement: 'right',
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    elements: { reference: referenceEl ?? undefined },
  })

  // Close on Escape or outside click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') abnormalRef.current?.focus()
      if (e.key === 'ArrowRight') normalRef.current?.focus()
    }
    const onClick = (e: MouseEvent) => {
      if (refs.floating.current && !refs.floating.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [onClose, refs.floating])

  // Focus first button on mount
  useEffect(() => {
    const btn = currentStatus === 'abnormal' ? abnormalRef.current : normalRef.current
    btn?.focus()
  }, [currentStatus])

  const btnStyle = (status: 'abnormal' | 'normal'): React.CSSProperties => ({
    background: currentStatus === status ? '#2A2A2E' : 'transparent',
    border: currentStatus === status ? '1px solid #4A4A4E' : '1px solid transparent',
    borderRadius: 999,
    padding: '4px 14px',
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    cursor: 'pointer',
    fontFamily: 'inherit',
  })

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex: 100,
        background: '#1C1C1E',
        border: '1px solid #3A3A3C',
        borderRadius: 999,
        padding: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
      role="menu"
    >
      <button
        ref={abnormalRef}
        style={btnStyle('abnormal')}
        onClick={() => { onQualify('abnormal'); onClose() }}
        role="menuitem"
        aria-label="Mark as abnormal"
      >
        Abnormal
      </button>
      <div style={{ width: 1, height: 14, background: '#A1A1AA', margin: '0 4px' }} />
      <button
        ref={normalRef}
        style={btnStyle('normal')}
        onClick={() => { onQualify('normal'); onClose() }}
        role="menuitem"
        aria-label="Mark as normal"
      >
        Normal
      </button>
    </div>
  )
}
