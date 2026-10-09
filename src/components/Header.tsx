export function Header() {
  return (
    <header
      className="flex items-center px-2 shrink-0"
      style={{ height: 48, background: '#000000' }}
    >
      <div
        className="flex items-center"
        style={{
          background: '#6C4BF5',
          borderRadius: 6,
          padding: '10px 14px',
          gap: 8,
        }}
      >
        {/* 4-dot logo */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="3" r="2.5" fill="white" />
          <circle cx="11" cy="3" r="2.5" fill="white" />
          <circle cx="3" cy="11" r="2.5" fill="white" />
          <circle cx="11" cy="11" r="2.5" fill="white" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
          Fault Codes Dashboard
        </span>
      </div>
    </header>
  )
}
