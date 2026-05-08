import { useState, useRef } from 'react'
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
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={valueStyle}
    >
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

// ── 툴팁 컴포넌트 ──────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 5 }}>
      <span
        ref={ref}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-2)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'var(--text-3)',
          cursor: 'help',
          verticalAlign: 'middle',
          userSelect: 'none',
        }}
      >?</span>
      {show && (
        <div style={{
          position: 'absolute',
          left: 18,
          top: -4,
          zIndex: 100,
          width: 260,
          padding: '8px 10px',
          background: '#2A2824',
          color: '#F0EEE5',
          borderRadius: 3,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9.5,
          lineHeight: 1.65,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </span>
  )
}

// 자료보유현황 옵션
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
  const [surchargeModel, setSurchargeModel] = useState<'independent' | 'cumulative' | 'tbd'>('tbd')
  const [height, setHeight] = useState(8)
  const [length, setLength] = useState(30)
  const [stages, setStages] = useState(4)
  const [slopeAngle, setSlopeAngle] = useState(75)
  const [wallThick, setWallThick] = useState(0.25)

  const params: WallParams = { height, length, stages, slopeAngle, wallThick, method, construction }

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* ── 좌측 입력 패널 ────────────────────── */}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            color: 'var(--accent)',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 2,
            padding: '2px 7px',
          }}>PHASE 01</div>
          <div style={{
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-1)',
          }}>기본정보 수집</div>
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

        {/* 단별 상재하중 해석 가정 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            단별 상재하중 가정
            <Tooltip text={
              `다단 기대기옹벽에서 상부 단의 하중이\n하부 단에 전달되는지 여부 선택.\n\n` +
              `■ 단별 독립\n각 단에 독립 레벨링 기초 있어\n상부 하중이 하부로 누적되지 않음.\n→ 각 단 h 기준 단독 토압 산정\n\n` +
              `■ 하부 누적\n소단만 있고 연속 뒤채움으로 연결.\n상부 자중이 하부 단 상재하중 q_i로 작용.\n→ FHWA 2H rule: 소단 폭 < 2×h 이면\n   상재하중 전달 가능성 높음\n\n` +
              `■ 현장 확인 후 결정 (권장)\nPhase 02 현장조사에서 기초 형식 확인 후 선택.`
            } />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {([
              { value: 'independent', label: '단별 독립', desc: '각 단 독립 레벨링 기초 확인됨' },
              { value: 'cumulative', label: '하부 누적', desc: '소단만·연속 뒤채움 — 상재하중 q_i 반영' },
              { value: 'tbd', label: '현장 확인 후 결정', desc: 'Phase 02 조사 후 선택 (기본값)' },
            ] as const).map(opt => (
              <label key={opt.value} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
                padding: '6px 8px',
                border: `1px solid ${surchargeModel === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 2,
                background: surchargeModel === opt.value ? 'var(--accent-bg)' : 'var(--bg)',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name="surchargeModel"
                  value={opt.value}
                  checked={surchargeModel === opt.value}
                  onChange={() => setSurchargeModel(opt.value)}
                  style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: surchargeModel === opt.value ? 'var(--accent)' : 'var(--text-1)',
                    fontWeight: surchargeModel === opt.value ? 600 : 400,
                  }}>{opt.label}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8.5,
                    color: 'var(--text-3)',
                    marginTop: 1,
                    lineHeight: 1.4,
                  }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {surchargeModel === 'cumulative' && (
            <div style={{
              marginTop: 6,
              padding: '6px 8px',
              background: '#FFF3E0',
              border: '1px solid #E8A940',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8.5,
              color: '#7A5010',
              lineHeight: 1.55,
            }}>
              ⚠ 누적 가정 시 하부 단 보강재 인장력이\n증가합니다. Phase 03 입력 시 단별\n상재하중 q_i를 별도 입력해야 합니다.\n(FHWA NHI-14-007 기준 참고)
            </div>
          )}
          {surchargeModel === 'tbd' && (
            <div style={{
              marginTop: 6,
              padding: '6px 8px',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8.5,
              color: 'var(--text-3)',
              lineHeight: 1.55,
            }}>
              → Phase 02 현장조사에서 각 단 기초(레벨링\n콘크리트) 유무를 확인한 후 선택하세요.
            </div>
          )}
        </div>

        <Field label="적용 KDS 버전">
          <Select value={kds} onChange={setKds} options={kdsOptions} />
          {kds === '2016' && (
            <div style={{
              marginTop: 5,
              padding: '5px 8px',
              background: '#FFF8E7',
              border: '1px solid #E8C97A',
              borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#7A5A1A',
              lineHeight: 1.5,
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
          <NumInput value={height} onChange={setHeight} min={1} max={20} step={0.5} unit="m" />
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

        <Field label="패널 두께 t">
          <NumInput value={wallThick} onChange={setWallThick} min={0.1} max={0.5} step={0.01} unit="m" />
        </Field>

        {/* 하단 면책 */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: 'var(--text-3)',
          lineHeight: 1.6,
        }}>
          Phase 01 입력값은 개념도 수준의 모식도에만 반영됩니다.<br />
          상세 단면은 Phase 03에서 확정합니다.
        </div>
      </div>

      {/* ── 우측 모식도 패널 ───────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
        padding: '20px 24px',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          개념 모식도 — Conceptual Schematic
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <WallSchematic params={params} />
          </div>
        </div>

        {/* 하단 입력값 요약 바 */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          flexWrap: 'wrap',
          rowGap: 6,
        }}>
          {[
            { label: 'H', value: `${height.toFixed(1)} m` },
            { label: 'L', value: `${length.toFixed(0)} m` },
            { label: 'n', value: `${stages} 단` },
            { label: 'θ', value: `${slopeAngle}°` },
            { label: 't', value: `${wallThick.toFixed(2)} m` },
            { label: '공법', value: method || '미선택' },
            { label: '시공', value: construction === 'top-down' ? 'Top-down' : construction === 'bottom-up' ? 'Bottom-up' : construction === 'unknown' ? '불명' : '미선택' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1 0 60px',
              padding: '4px 8px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              marginRight: 6,
              marginBottom: 2,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                color: 'var(--text-3)',
                letterSpacing: '0.1em',
              }}>{item.label}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text-1)',
                fontWeight: 600,
              }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
