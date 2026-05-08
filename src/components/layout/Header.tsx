import PwasLogo from '../common/PwasLogo'

export default function Header() {
  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--ink)',
      borderBottom: '1px solid #2E2C2A',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10,
      flexShrink: 0,
    }}>
      <PwasLogo size={28} variant="ink" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: "'Space Grotesk', system-ui",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--cream)',
        }}>
          PW<span style={{ color: 'var(--clay)' }}>A</span>S
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
        }}>
          PANEL · WALL · ANALYSIS · SYSTEM
        </span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'var(--muted)',
        }}>
          v 0.1.0
        </span>
      </div>
    </header>
  )
}
