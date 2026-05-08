import { useState, useEffect } from 'react'
import WallSchematic, { type WallParams, type TierConfig } from './WallSchematic'
import { usePwas } from '../../state/usePwas'

const KR: React.CSSProperties = { fontFamily: 'Pretendard, sans-serif' }
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

const inputBase: React.CSSProperties = {
  ...MONO, fontSize: 12, color: 'var(--text-1)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '4px 7px', outline: 'none',
  boxSizing: 'border-box' as const, width: '100%',
}

// ── 섹션 헤더 — 번호 배지 + 제목 ─────────────────────────────────
function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: '0 -14px', padding: '7px 14px',
      background: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      marginBottom: 10,
    }}>
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 600,
        color: 'var(--accent)', background: 'var(--accent-bg)',
        border: '1px solid rgba(217,119,87,0.35)',
        borderRadius: 2, padding: '1px 6px', letterSpacing: '0.05em',
      }}>{num}</span>
      <span style={{ ...KR, fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>
        {title}
      </span>
    </div>
  )
}

// ── 라벨 + 입력 묶음 ──────────────────────────────────────────────
function Field({ label, children, style }: {
  label: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      <div style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputBase, padding: '5px 7px', cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function NumInput({ value, onChange, min, max, step, unit }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; unit?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <input type="number" value={value} min={min} max={max} step={step ?? 0.1}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
        style={{ ...inputBase, textAlign: 'right' as const }}
      />
      {unit && <span style={{ ...MONO, fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', minWidth: 16 }}>{unit}</span>}
    </div>
  )
}

// 단별 테이블 셀
function TierCell({ value, onChange, min, max, step }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <input type="number" value={value} min={min} max={max} step={step ?? 1}
      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
      style={{
        ...MONO, fontSize: 11, color: 'var(--text-1)',
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 2, padding: '3px 4px', width: '100%',
        outline: 'none', textAlign: 'center' as const,
        boxSizing: 'border-box' as const,
      }}
    />
  )
}

// ── 옵션 목록 ─────────────────────────────────────────────────────
const docOptions = [
  { value: '', label: '— 선택 —' },
  { value: 'full', label: '준공도서 + 구조계산서' },
  { value: 'drawing-only', label: '준공도서만 보유' },
  { value: 'partial', label: '일부 도면만 보유' },
  { value: 'none', label: '자료 없음' },
]
const kdsOptions = [
  { value: '2020', label: 'KDS 2020 (현행)' },
  { value: '2016', label: 'KDS 2016 (구기준)' },
]
const DEFAULT_TIER = (): TierConfig => ({ panels: 2, bermWidth: 0.5 })

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function BasicInfoPanel() {
  const { setP01 } = usePwas()
  const [method, setMethod] = useState<WallParams['method']>('')
  const [construction, setConstruction] = useState<WallParams['construction']>('')
  const [kds, setKds] = useState<'2020' | '2016'>('2020')
  const [docStatus, setDocStatus] = useState<'' | 'full' | 'drawing-only' | 'partial' | 'none'>('')
  const [stages, setStages] = useState(4)
  const [slopeAngle, setSlopeAngle] = useState(75)
  const [wallThick, setWallThick] = useState(0.25)
  const [panelHeight, setPanelHeight] = useState(1.0)
  const [length, setLength] = useState(30)
  const [tiers, setTiers] = useState<TierConfig[]>(Array.from({ length: 4 }, DEFAULT_TIER))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTiers(prev => {
      if (prev.length === stages) return prev
      if (stages > prev.length)
        return [...prev, ...Array.from({ length: stages - prev.length }, DEFAULT_TIER)]
      return prev.slice(0, stages)
    })
  }, [stages])

  // Phase 01 → Context mirror (Phase 03 carry-over용)
  // (내부 상태 → 외부 상태 publish — setState in effect 정당)
  useEffect(() => {
    const totalPanels = tiers.reduce((s, t) => s + t.panels, 0)
    setP01({
      method, construction, kds, docStatus,
      stages, slopeAngle, panelHeight, wallThick, length,
      height: totalPanels * panelHeight,
      tierPanels: tiers.map(t => t.panels),
      tierBerms: tiers.map(t => t.bermWidth),
    })
  }, [method, construction, kds, docStatus, stages, slopeAngle,
      panelHeight, wallThick, length, tiers, setP01])

  const updateTier = (i: number, key: keyof TierConfig, val: number) =>
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t))

  const totalPanels = tiers.reduce((s, t) => s + t.panels, 0)
  const calcH = totalPanels * panelHeight

  const params: WallParams = {
    height: calcH, length, stages, slopeAngle, wallThick,
    method, construction, panelHeight, tiers,
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* ── 좌측 입력 ── */}
      <div style={{
        width: '38%', minWidth: 260, maxWidth: 360,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '14px 14px 14px',
        background: 'var(--bg-panel)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>

        {/* Phase 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ ...MONO, fontSize: 9, letterSpacing: '0.14em', color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 2, padding: '2px 7px' }}>
            PHASE 01
          </div>
          <div style={{ ...KR, fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>기본정보 수집</div>
        </div>

        {/* ① 공법 분류 */}
        <SectionHead num="①" title="공법 분류" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 4 }}>
          <Field label="공법 구분" style={{ gridColumn: '1 / -1' }}>
            <Select value={method} onChange={v => setMethod(v as WallParams['method'])}
              options={[
                { value: '', label: '— 선택 —' },
                { value: 'PSP', label: 'PSP — 소일네일' },
                { value: 'PPP', label: 'PPP — 영구앵커' },
                { value: 'mixed', label: '혼용 — PSP+PPP' },
              ]} />
          </Field>
          <Field label="시공 방법" style={{ gridColumn: '1 / -1' }}>
            <Select value={construction} onChange={v => setConstruction(v as WallParams['construction'])}
              options={[
                { value: '', label: '— 선택 —' },
                { value: 'top-down', label: 'Top-down (상→하)' },
                { value: 'bottom-up', label: 'Bottom-up (하→상)' },
                { value: 'unknown', label: '불명' },
              ]} />
          </Field>
        </div>

        {/* ② 자료 보유현황 */}
        <SectionHead num="②" title="자료 보유현황" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 4 }}>
          <Field label="보유 자료" style={{ gridColumn: '1 / -1' }}>
            <Select value={docStatus} onChange={v => setDocStatus(v as typeof docStatus)} options={docOptions} />
          </Field>
          <Field label="적용 KDS" style={{ gridColumn: '1 / -1' }}>
            <Select value={kds} onChange={v => setKds(v as typeof kds)} options={kdsOptions} />
          </Field>
          {kds === '2016' && (
            <div style={{ gridColumn: '1 / -1', padding: '5px 8px', background: '#FFF8E7', border: '1px solid #E8C97A', borderRadius: 2, ...MONO, fontSize: 9, color: '#7A5A1A', lineHeight: 1.5 }}>
              ※ 2016→2020: 활동·전도FS 통일, M-O 지진계수, 앵커안전율 재정비
            </div>
          )}
        </div>

        {/* ③ 공통 제원 */}
        <SectionHead num="③" title="공통 제원" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 4 }}>
          <Field label="연장 L">
            <NumInput value={length} onChange={setLength} min={1} max={500} step={1} unit="m" />
          </Field>
          <Field label="단수 n">
            <NumInput value={stages} onChange={setStages} min={1} max={12} step={1} unit="단" />
          </Field>
          <Field label="경사각 θ">
            <NumInput value={slopeAngle} onChange={setSlopeAngle} min={30} max={85} step={1} unit="°" />
          </Field>
          <Field label="패널 두께 t">
            <NumInput value={wallThick} onChange={setWallThick} min={0.1} max={0.5} step={0.01} unit="m" />
          </Field>
          <Field label="패널 높이" style={{ gridColumn: '1 / -1' }}>
            <NumInput value={panelHeight} onChange={setPanelHeight} min={0.3} max={4} step={0.1} unit="m" />
          </Field>
        </div>

        {/* ④ 단별 제원 */}
        <SectionHead num="④" title="단별 제원" />

        {/* 테이블 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 1fr 48px', gap: 4, marginBottom: 4 }}>
          {['단', '패널 수', '소단 폭', '단높이'].map(h => (
            <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', textAlign: 'center' as const, letterSpacing: '0.03em' }}>{h}</div>
          ))}
        </div>

        {/* 단별 행 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tiers.map((tier, i) => {
            const isBottom = i === stages - 1
            const tierH = (tier.panels * panelHeight).toFixed(1)
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 1fr 48px', gap: 4, alignItems: 'center' }}>
                <div style={{
                  ...MONO, fontSize: 10, fontWeight: 700,
                  color: 'var(--accent)', textAlign: 'center' as const,
                  background: 'var(--accent-bg)',
                  border: '1px solid rgba(217,119,87,0.25)',
                  borderRadius: 2, padding: '3px 0',
                }}>{i + 1}</div>
                <TierCell value={tier.panels} onChange={v => updateTier(i, 'panels', Math.max(1, Math.min(10, v)))} min={1} max={10} step={1} />
                {isBottom
                  ? <div style={{ ...MONO, fontSize: 10, color: 'var(--text-3)', textAlign: 'center' as const }}>—</div>
                  : <TierCell value={tier.bermWidth} onChange={v => updateTier(i, 'bermWidth', Math.max(0.1, Math.min(3, v)))} min={0.1} max={3} step={0.1} />
                }
                <div style={{
                  ...MONO, fontSize: 10, color: '#4A7FA5', textAlign: 'center' as const,
                  background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
                  borderRadius: 2, padding: '3px 4px',
                }}>{tierH}m</div>
              </div>
            )
          })}
        </div>

        {/* 합계 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '22px 1fr 1fr 48px',
          gap: 4, marginTop: 6, paddingTop: 6,
          borderTop: '1px solid var(--border)',
          alignItems: 'center',
        }}>
          <div />
          <div style={{ ...KR, fontSize: 10, color: 'var(--text-3)', textAlign: 'right' as const, paddingRight: 4 }}>합계</div>
          <div style={{ ...MONO, fontSize: 10, color: 'var(--text-3)', textAlign: 'center' as const }}>{totalPanels}장</div>
          <div style={{
            ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            textAlign: 'center' as const,
            background: 'var(--accent-bg)',
            border: '1px solid rgba(217,119,87,0.3)',
            borderRadius: 2, padding: '3px 4px',
          }}>H={calcH.toFixed(1)}m</div>
        </div>

        {/* 면책 */}
        <div style={{ marginTop: 'auto', paddingTop: 12, ...KR, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Phase 01은 개념 모식도 반영용입니다. 상세 단면은 Phase 03에서 확정합니다.
        </div>
      </div>

      {/* ── 우측 모식도 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', padding: '16px 20px' }}>
        <div style={{ ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10 }}>
          개념 모식도 — Conceptual Schematic
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <WallSchematic params={params} />
          </div>
        </div>

        {/* 요약 바 */}
        <div style={{ display: 'flex', gap: 5, borderTop: '1px solid var(--border)', paddingTop: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'H', value: `${calcH.toFixed(1)}m` },
            { label: 'L', value: `${length}m` },
            { label: 'n', value: `${stages}단` },
            { label: '패널', value: `${totalPanels}장` },
            { label: 'θ', value: `${slopeAngle}°` },
            { label: '공법', value: method || '—' },
            { label: '시공', value: construction === 'top-down' ? 'Top-down' : construction === 'bottom-up' ? 'Bottom-up' : construction === 'unknown' ? '불명' : '—' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: '1 0 48px', padding: '4px 6px',
              background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 2,
            }}>
              <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ ...MONO, fontSize: 11, color: 'var(--text-1)', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
