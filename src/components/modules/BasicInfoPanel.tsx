import { useState, useEffect } from 'react'
import WallSchematic, { type WallParams, type TierConfig } from './WallSchematic'

// ── 스타일 상수 ──────────────────────────────────────────────────
const KR: React.CSSProperties = { fontFamily: 'Pretendard, sans-serif' }
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

const labelStyle: React.CSSProperties = {
  ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 3,
}
const sectionHeadStyle: React.CSSProperties = {
  ...KR, fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
  borderBottom: '1px solid var(--border)', paddingBottom: 5,
  marginBottom: 10, marginTop: 18,
}
const inputBase: React.CSSProperties = {
  ...MONO, fontSize: 12, color: 'var(--text-1)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '4px 6px', outline: 'none',
  boxSizing: 'border-box' as const,
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>{label}</div>
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
      style={{ ...inputBase, width: '100%', padding: '5px 8px' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function NumInput({ value, onChange, min, max, step, unit, width }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; unit?: string; width?: string | number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input type="number" value={value} min={min} max={max} step={step ?? 0.1}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
        style={{ ...inputBase, width: width ?? (unit ? 'calc(100% - 32px)' : '100%') }}
      />
      {unit && <span style={{ ...MONO, fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{unit}</span>}
    </div>
  )
}

// 단별 테이블의 인라인 숫자 셀
function TierNumCell({ value, onChange, min, max, step }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <input type="number" value={value} min={min} max={max} step={step ?? 1}
      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
      style={{
        ...MONO, fontSize: 11, color: 'var(--text-1)',
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 2, padding: '3px 5px', width: '100%',
        outline: 'none', textAlign: 'center' as const,
        boxSizing: 'border-box' as const,
      }}
    />
  )
}

// ── 옵션 목록 ────────────────────────────────────────────────────
const docOptions = [
  { value: '', label: '— 선택 —' },
  { value: 'full', label: '준공도서 + 구조계산서 보유' },
  { value: 'drawing-only', label: '준공도서만 보유' },
  { value: 'partial', label: '일부 도면만 보유' },
  { value: 'none', label: '자료 없음' },
]
const kdsOptions = [
  { value: '2020', label: 'KDS 2020 (현행)' },
  { value: '2016', label: 'KDS 2016 (구기준)' },
]

// ── 기본 단 설정 ─────────────────────────────────────────────────
const DEFAULT_TIER = (): TierConfig => ({ panels: 2, bermWidth: 0.5 })

export default function BasicInfoPanel() {
  const [method, setMethod] = useState<WallParams['method']>('')
  const [construction, setConstruction] = useState<WallParams['construction']>('')
  const [kds, setKds] = useState('2020')
  const [docStatus, setDocStatus] = useState('')
  const [stages, setStages] = useState(4)
  const [slopeAngle, setSlopeAngle] = useState(75)
  const [wallThick, setWallThick] = useState(0.25)
  const [panelHeight, setPanelHeight] = useState(1.0)   // 패널 1장 높이 (전 단 공통)
  const [length, setLength] = useState(30)
  const [tiers, setTiers] = useState<TierConfig[]>(
    Array.from({ length: 4 }, DEFAULT_TIER)
  )

  // 단수 변경 시 배열 유지·확장
  useEffect(() => {
    setTiers(prev => {
      if (prev.length === stages) return prev
      if (stages > prev.length) {
        return [...prev, ...Array.from({ length: stages - prev.length }, DEFAULT_TIER)]
      }
      return prev.slice(0, stages)
    })
  }, [stages])

  // 단 속성 업데이트
  const updateTier = (i: number, key: keyof TierConfig, val: number) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t))
  }

  // B방식: H는 자동 계산
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
        width: '40%', minWidth: 260, maxWidth: 380,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '20px',
        background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Phase 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ ...MONO, fontSize: 9, letterSpacing: '0.14em', color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 2, padding: '2px 7px' }}>
            PHASE 01
          </div>
          <div style={{ ...KR, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>기본정보 수집</div>
        </div>

        {/* ① 공법 분류 */}
        <div style={{ ...sectionHeadStyle, marginTop: 0 }}>① 공법 분류</div>
        <Field label="공법 구분">
          <Select value={method} onChange={v => setMethod(v as WallParams['method'])}
            options={[
              { value: '', label: '— 선택 —' },
              { value: 'PSP', label: 'PSP — 소일네일 + PS패널' },
              { value: 'PPP', label: 'PPP — 영구앵커 + PS패널' },
              { value: 'mixed', label: '혼용 — 구간별 PSP+PPP 병행' },
            ]} />
        </Field>
        <Field label="시공 방법">
          <Select value={construction} onChange={v => setConstruction(v as WallParams['construction'])}
            options={[
              { value: '', label: '— 선택 —' },
              { value: 'top-down', label: 'Top-down (상→하 시공)' },
              { value: 'bottom-up', label: 'Bottom-up (하→상 시공)' },
              { value: 'unknown', label: '불명' },
            ]} />
        </Field>

        {/* ② 자료 보유 */}
        <div style={sectionHeadStyle}>② 자료 보유현황</div>
        <Field label="보유 자료">
          <Select value={docStatus} onChange={setDocStatus} options={docOptions} />
        </Field>
        <Field label="적용 KDS 버전">
          <Select value={kds} onChange={setKds} options={kdsOptions} />
          {kds === '2016' && (
            <div style={{ marginTop: 5, padding: '5px 8px', background: '#FFF8E7', border: '1px solid #E8C97A', borderRadius: 2, ...MONO, fontSize: 9, color: '#7A5A1A', lineHeight: 1.5 }}>
              ※ KDS 2016 → 2020 주요변경:<br />
              · 활동·전도 FS 기준 통일 적용<br />
              · Mononobe-Okabe 지진계수 반영<br />
              · 앵커 안전율 체계 재정비
            </div>
          )}
        </Field>

        {/* ③ 공통 제원 */}
        <div style={sectionHeadStyle}>③ 공통 제원</div>
        <Field label="연장 L">
          <NumInput value={length} onChange={setLength} min={1} max={500} step={1} unit="m" />
        </Field>
        <Field label="단수 n">
          <NumInput value={stages} onChange={setStages} min={1} max={12} step={1} unit="단" />
        </Field>
        <Field label="비탈면 경사각 θ">
          <NumInput value={slopeAngle} onChange={setSlopeAngle} min={30} max={85} step={1} unit="°" />
        </Field>
        <Field label="패널 두께 t">
          <NumInput value={wallThick} onChange={setWallThick} min={0.1} max={0.5} step={0.01} unit="m" />
        </Field>
        <Field label="패널 1장 높이 (공통)">
          <NumInput value={panelHeight} onChange={setPanelHeight} min={0.3} max={4} step={0.1} unit="m" />
        </Field>

        {/* ④ 단별 제원 테이블 */}
        <div style={sectionHeadStyle}>④ 단별 제원</div>

        {/* 테이블 헤더 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 1fr 52px',
          gap: 4, marginBottom: 4,
        }}>
          {['단', '패널 수', '소단 폭', '단높이'].map(h => (
            <div key={h} style={{ ...MONO, fontSize: 8.5, color: 'var(--text-3)', textAlign: 'center' as const }}>
              {h}
            </div>
          ))}
        </div>

        {/* 단별 행 */}
        {tiers.map((tier, i) => {
          const isBottom = i === stages - 1
          const tierH = tier.panels * panelHeight
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 1fr 52px',
              gap: 4, marginBottom: 4, alignItems: 'center',
            }}>
              {/* 단 번호 */}
              <div style={{
                ...MONO, fontSize: 10, fontWeight: 600,
                color: 'var(--accent)', textAlign: 'center' as const,
                background: 'var(--accent-bg)', border: '1px solid rgba(217,119,87,0.3)',
                borderRadius: 2, padding: '3px 0',
              }}>{i + 1}</div>

              {/* 패널 수 */}
              <TierNumCell
                value={tier.panels}
                onChange={v => updateTier(i, 'panels', Math.max(1, Math.min(10, v)))}
                min={1} max={10} step={1}
              />

              {/* 소단 폭 (최하단은 '-') */}
              {isBottom ? (
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-3)', textAlign: 'center' as const, padding: '3px 0' }}>—</div>
              ) : (
                <TierNumCell
                  value={tier.bermWidth}
                  onChange={v => updateTier(i, 'bermWidth', Math.max(0.1, Math.min(3, v)))}
                  min={0.1} max={3} step={0.1}
                />
              )}

              {/* 단 높이 (자동) */}
              <div style={{
                ...MONO, fontSize: 10, color: '#4A7FA5',
                textAlign: 'center' as const,
                background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
                borderRadius: 2, padding: '3px 4px',
              }}>{tierH.toFixed(1)}m</div>
            </div>
          )
        })}

        {/* 합계 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 1fr 52px',
          gap: 4, marginTop: 4, paddingTop: 6,
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ ...KR, fontSize: 10, color: 'var(--text-3)', gridColumn: '1/3', textAlign: 'right' as const, paddingRight: 4 }}>
            합계
          </div>
          <div />
          <div style={{
            ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            textAlign: 'center' as const,
            background: 'var(--accent-bg)', border: '1px solid rgba(217,119,87,0.3)',
            borderRadius: 2, padding: '3px 4px',
          }}>{calcH.toFixed(1)}m</div>
        </div>

        {/* 총 패널 수 표시 */}
        <div style={{
          marginTop: 6, padding: '5px 8px',
          background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 2,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ ...KR, fontSize: 11, color: 'var(--text-3)' }}>총 패널 수</span>
          <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{totalPanels} 장</span>
        </div>

        {/* 면책 */}
        <div style={{ marginTop: 'auto', paddingTop: 16, ...KR, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Phase 01 입력값은 개념 모식도에만 반영됩니다.<br />
          상세 단면·기초 형식은 Phase 03에서 확정합니다.
        </div>
      </div>

      {/* ── 우측 모식도 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', padding: '20px 24px' }}>
        <div style={{ ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12 }}>
          개념 모식도 — Conceptual Schematic
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <WallSchematic params={params} />
          </div>
        </div>

        {/* 하단 요약 바 */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 12, flexWrap: 'wrap', rowGap: 6 }}>
          {[
            { label: 'H (역산)', value: `${calcH.toFixed(1)} m` },
            { label: 'L', value: `${length} m` },
            { label: 'n', value: `${stages} 단` },
            { label: '총 패널', value: `${totalPanels} 장` },
            { label: 'θ', value: `${slopeAngle}°` },
            { label: '공법', value: method || '미선택' },
            { label: '시공', value: construction === 'top-down' ? 'Top-down' : construction === 'bottom-up' ? 'Bottom-up' : construction === 'unknown' ? '불명' : '미선택' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 60px', padding: '4px 8px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 2, marginRight: 6, marginBottom: 2 }}>
              <div style={{ ...KR, fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ ...MONO, fontSize: 11, color: 'var(--text-1)', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
