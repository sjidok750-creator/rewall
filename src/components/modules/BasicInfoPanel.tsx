import { useState } from 'react'
import WallSchematic, { type WallParams } from './WallSchematic'

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.08em',
  color: 'var(--text-3)',
  textTransform: 'uppercase' as const,
  marginBottom: 3,
}

const valueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  color: 'var(--text-1)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  padding: '5px 8px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.15em',
  color: 'var(--text-3)',
  textTransform: 'uppercase' as const,
  borderBottom: '1px solid var(--border)',
  paddingBottom: 5,
  marginBottom: 10,
  marginTop: 18,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={valueStyle}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function NumInput({ value, onChange, min, max, step, unit }: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; unit?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 0.1}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        style={{ ...valueStyle, width: unit ? 'calc(100% - 32px)' : '100%' }}
      />
      {unit && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--text-3)',
          whiteSpace: 'nowrap',
        }}>{unit}</span>
      )}
    </div>
  )
}

// 파생값 표시 칩
function DerivedChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 8px',
      background: 'var(--bg-sidebar)',
      border: '1px solid var(--border)',
      borderRadius: 2,
      marginTop: 4,
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  )
}

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

export default function BasicInfoPanel() {
  const [method, setMethod] = useState<WallParams['method']>('')
  const [construction, setConstruction] = useState<WallParams['construction']>('')
  const [kds, setKds] = useState('2020')
  const [docStatus, setDocStatus] = useState('')
  const [height, setHeight] = useState(8)
  const [length, setLength] = useState(30)
  const [stages, setStages] = useState(4)
  const [slopeAngle, setSlopeAngle] = useState(75)
  const [wallThick, setWallThick] = useState(0.25)
  const [panelHeight, setPanelHeight] = useState(2.0)   // 표준 PS패널 높이
  const [bermWidth, setBermWidth] = useState(0.5)       // 소단 폭

  // 파생값
  const tierHeight = height / stages                            // 단당 실제 높이
  const panelsPerTier = Math.max(1, Math.round(tierHeight / panelHeight))  // 단당 패널 수 (자동)
  const actualTierHeight = panelsPerTier * panelHeight          // 실제 단 높이 (반올림 후)

  const params: WallParams = {
    height, length, stages, slopeAngle, wallThick,
    method, construction,
    panelHeight, bermWidth, panelsPerTier,
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* ── 좌측 입력 ───────────────────────────── */}
      <div style={{
        width: '38%',
        minWidth: 240,
        maxWidth: 340,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: '20px 20px',
        background: 'var(--bg-panel)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Phase 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: '0.14em',
            color: 'var(--accent)', background: 'var(--accent-bg)',
            border: '1px solid var(--accent)', borderRadius: 2, padding: '2px 7px',
          }}>PHASE 01</div>
          <div style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
            기본정보 수집
          </div>
        </div>

        {/* ① 공법 분류 */}
        <div style={{ ...sectionHeadStyle, marginTop: 0 }}>① 공법 분류</div>

        <Field label="공법 구분">
          <Select
            value={method}
            onChange={v => setMethod(v as WallParams['method'])}
            options={[
              { value: '', label: '— 선택 —' },
              { value: 'PSP', label: 'PSP — 소일네일 + PS패널' },
              { value: 'PPP', label: 'PPP — 영구앵커 + PS패널' },
              { value: 'mixed', label: '혼용 — 구간별 PSP+PPP 병행' },
            ]}
          />
        </Field>

        <Field label="시공 방법">
          <Select
            value={construction}
            onChange={v => setConstruction(v as WallParams['construction'])}
            options={[
              { value: '', label: '— 선택 —' },
              { value: 'top-down', label: 'Top-down (상→하 시공)' },
              { value: 'bottom-up', label: 'Bottom-up (하→상 시공)' },
              { value: 'unknown', label: '불명' },
            ]}
          />
        </Field>

        {/* ② 자료 보유 */}
        <div style={sectionHeadStyle}>② 자료 보유현황</div>

        <Field label="보유 자료">
          <Select value={docStatus} onChange={setDocStatus} options={docOptions} />
        </Field>

        <Field label="적용 KDS 버전">
          <Select value={kds} onChange={setKds} options={kdsOptions} />
          {kds === '2016' && (
            <div style={{
              marginTop: 5, padding: '5px 8px',
              background: '#FFF8E7', border: '1px solid #E8C97A', borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: '#7A5A1A', lineHeight: 1.5,
            }}>
              ※ KDS 2016 → 2020 주요변경:<br />
              · 활동·전도 FS 기준 통일 적용<br />
              · Mononobe-Okabe 지진계수 반영<br />
              · 앵커 안전율 체계 재정비
            </div>
          )}
        </Field>

        {/* ③ 옹벽 제원 */}
        <div style={sectionHeadStyle}>③ 옹벽 제원</div>

        <Field label="옹벽 높이 H">
          <NumInput value={height} onChange={setHeight} min={1} max={30} step={0.5} unit="m" />
        </Field>

        <Field label="연장 L">
          <NumInput value={length} onChange={setLength} min={1} max={500} step={1} unit="m" />
        </Field>

        <Field label="단수 n">
          <NumInput value={stages} onChange={setStages} min={1} max={12} step={1} unit="단" />
        </Field>

        <Field label="비탈면 경사각 θ">
          <NumInput value={slopeAngle} onChange={setSlopeAngle} min={30} max={85} step={1} unit="°" />
        </Field>

        {/* ④ 패널 제원 */}
        <div style={sectionHeadStyle}>④ 패널 제원 (개념)</div>

        <Field label="표준 패널 높이">
          <NumInput value={panelHeight} onChange={setPanelHeight} min={0.5} max={4} step={0.1} unit="m" />
        </Field>

        <Field label="소단 폭 (berm)">
          <NumInput value={bermWidth} onChange={setBermWidth} min={0.2} max={2.0} step={0.1} unit="m" />
        </Field>

        <Field label="패널 두께 t">
          <NumInput value={wallThick} onChange={setWallThick} min={0.1} max={0.5} step={0.01} unit="m" />
        </Field>

        {/* 파생값 표시 */}
        <div style={{ marginTop: 2 }}>
          <DerivedChip label="단당 패널 수 (자동 계산)" value={`${panelsPerTier} 장/단`} />
          <DerivedChip label="단당 실 높이" value={`${actualTierHeight.toFixed(1)} m`} />
          {Math.abs(actualTierHeight - tierHeight) > 0.15 && (
            <div style={{
              marginTop: 4, padding: '4px 8px',
              background: '#FFF8E7', border: '1px solid #E8C97A', borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: '#7A5A1A',
            }}>
              ※ H÷n÷패널높이 반올림으로 실 높이({actualTierHeight.toFixed(1)}m)가
              설계 단 높이({tierHeight.toFixed(1)}m)와 차이 있음
            </div>
          )}
        </div>

        {/* 면책 */}
        <div style={{
          marginTop: 'auto', paddingTop: 16,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
          color: 'var(--text-3)', lineHeight: 1.6,
        }}>
          Phase 01 입력값은 개념 모식도에만 반영됩니다.<br />
          상세 단면·기초 형식은 Phase 03에서 확정합니다.
        </div>
      </div>

      {/* ── 우측 모식도 ─────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'var(--bg)', padding: '20px 24px',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: '0.12em', color: 'var(--text-3)',
          textTransform: 'uppercase', marginBottom: 12,
        }}>
          개념 모식도 — Conceptual Schematic
        </div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'stretch',
          justifyContent: 'center', minHeight: 0, overflow: 'hidden',
        }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <WallSchematic params={params} />
          </div>
        </div>

        {/* 하단 요약 바 */}
        <div style={{
          display: 'flex', gap: 0,
          borderTop: '1px solid var(--border)', paddingTop: 12,
          flexWrap: 'wrap', rowGap: 6,
        }}>
          {[
            { label: 'H', value: `${height.toFixed(1)} m` },
            { label: 'L', value: `${length.toFixed(0)} m` },
            { label: 'n', value: `${stages} 단` },
            { label: '단/패널', value: `${panelsPerTier} 장` },
            { label: 'berm', value: `${bermWidth.toFixed(1)} m` },
            { label: 'θ', value: `${slopeAngle}°` },
            { label: '공법', value: method || '미선택' },
            { label: '시공', value: construction === 'top-down' ? 'Top-down' : construction === 'bottom-up' ? 'Bottom-up' : construction === 'unknown' ? '불명' : '미선택' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: '1 0 55px', padding: '4px 8px',
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
              borderRadius: 2, marginRight: 6, marginBottom: 2,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-1)', fontWeight: 600 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
