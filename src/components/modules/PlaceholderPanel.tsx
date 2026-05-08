interface Props {
  phase: string
  title: string
}

export default function PlaceholderPanel({ phase, title }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-3)',
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.14em',
        color: 'var(--accent)',
        background: 'var(--accent-bg)',
        border: '1px solid rgba(217,119,87,0.3)',
        padding: '3px 10px',
        borderRadius: 2,
      }}>
        {phase}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>{title}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: 'var(--text-3)',
        letterSpacing: '0.06em',
      }}>
        개발 예정
      </div>
    </div>
  )
}
