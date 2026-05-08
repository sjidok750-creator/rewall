import type { ModuleId } from '../../types'

interface NavItem {
  id: ModuleId
  label: string
  sub: string
  phase: string
}

const NAV: NavItem[] = [
  { id: 'overview',   label: '검토 개요',    sub: 'Overview',     phase: '' },
  { id: 'basic-info', label: '기본정보',     sub: 'Phase 1',      phase: '01' },
  { id: 'site-survey',label: '현장조사',     sub: 'Phase 2',      phase: '02' },
  { id: 'input',      label: '입력값 확정',  sub: 'Phase 3',      phase: '03' },
  { id: 'stability',  label: '안정성 검토',  sub: 'Phase 4',      phase: '04' },
  { id: 'grade',      label: '등급 판정',    sub: 'Phase 5',      phase: '05' },
  { id: 'report',     label: '출력',         sub: 'Phase 6',      phase: '06' },
]

interface SidebarProps {
  active: ModuleId
  onSelect: (id: ModuleId) => void
}

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '10px 8px 4px',
        fontFamily: 'Pretendard, sans-serif',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: 'var(--text-3)',
      }}>
        PSP / PPP 옹벽
      </div>

      {NAV.map(item => {
        const isActive = active === item.id
        const isOverview = item.id === 'overview'
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              margin: '1px 4px',
              borderRadius: 3,
              border: 'none',
              background: isActive ? 'var(--bg-panel)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'background 0.1s',
            }}
          >
            {!isOverview && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                letterSpacing: '0.06em',
                minWidth: 18,
              }}>
                {item.phase}
              </span>
            )}
            {isOverview && (
              <span style={{ minWidth: 18 }} />
            )}
            <span style={{
              fontFamily: 'Pretendard, sans-serif',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              lineHeight: 1.3,
            }}>
              {item.label}
            </span>
          </button>
        )
      })}

      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'var(--text-3)',
          letterSpacing: '0.1em',
          lineHeight: 1.6,
        }}>
          KDS 11 80 20<br />
          KDS 11 70 15<br />
          KDS 14 20
        </div>
      </div>
    </aside>
  )
}
