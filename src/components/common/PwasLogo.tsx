interface PwasLogoProps {
  size?: number
  variant?: 'ink' | 'paper' | 'clay'
}

export default function PwasLogo({ size = 32, variant = 'paper' }: PwasLogoProps) {
  const bg = variant === 'clay' ? '#D97757' : variant === 'ink' ? '#1A1915' : '#FAF9F5'
  const bar = variant === 'clay' ? '#1A1915' : '#F0EEE5'
  const accent = variant === 'clay' ? '#1A1915' : '#D97757'

  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.22),
      background: bg,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 64 64" fill="none">
        <rect x="10" y="10" width="44" height="9"  rx="1.5" fill={bar} />
        <rect x="10" y="21" width="44" height="9"  rx="1.5" fill={bar} />
        <rect x="10" y="32" width="28" height="9"  rx="1.5" fill={accent} />
        <rect x="10" y="43" width="14" height="11" rx="1.5" fill={bar} />
      </svg>
    </div>
  )
}
