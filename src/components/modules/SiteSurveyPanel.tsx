import { useState, useEffect } from 'react'
import { usePwas } from '../../state/usePwas'

const KR: React.CSSProperties = { fontFamily: 'Pretendard, sans-serif' }
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ── 섹션 헤더 ─────────────────────────────────────────────────────
function SectionHead({ code, title, sub }: { code: string; title: string; sub?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      margin: '0 -16px 12px',
    }}>
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 700,
        color: 'var(--accent)', background: 'var(--accent-bg)',
        border: '1px solid rgba(217,119,87,0.35)',
        borderRadius: 2, padding: '2px 6px', letterSpacing: '0.04em',
        flexShrink: 0,
      }}>{code}</span>
      <span style={{ ...KR, fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
      {sub && <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>{sub}</span>}
    </div>
  )
}

// ── 툴팁 (영향·한계·출처 3행) ────────────────────────────────────
interface TooltipInfo {
  effect: string
  limit: string
  source: string
}

function InfoTooltip({ info }: { info: TooltipInfo }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          ...MONO, fontSize: 9, fontWeight: 700,
          color: open ? 'var(--bg-panel)' : 'var(--text-3)',
          background: open ? 'var(--text-3)' : 'transparent',
          border: '1px solid var(--border-2)',
          borderRadius: 2, padding: '1px 5px',
          cursor: 'pointer', lineHeight: 1.4,
        }}
      >?</button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          width: 310, background: 'var(--bg-panel)',
          border: '1px solid var(--border-2)',
          borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <TooltipRow label="영향" text={info.effect} color="var(--accent)" />
          <TooltipRow label="한계" text={info.limit} color="var(--warn)" />
          <TooltipRow label="출처" text={info.source} color="var(--text-3)" />
        </div>
      )}
    </span>
  )
}

function TooltipRow({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 700, color,
        background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
        borderRadius: 2, padding: '1px 5px', flexShrink: 0, marginTop: 1,
      }}>{label}</span>
      <span style={{ ...KR, fontSize: 10, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

// ── 필드 행 ──────────────────────────────────────────────────────
function FieldRow({ label, tooltip, children }: {
  label: string; tooltip: TooltipInfo; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 210, flexShrink: 0 }}>
        <span style={{ ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <InfoTooltip info={tooltip} />
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

// ── 공통 입력 스타일 ──────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  ...MONO, fontSize: 12, color: 'var(--text-1)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '4px 7px', outline: 'none',
  boxSizing: 'border-box',
}

// ── 수치 입력 ─────────────────────────────────────────────────────
function NumInput({ value, onChange, unit, width = 90 }: {
  value: string; onChange: (v: string) => void; unit?: string; width?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputSt, width }} />
      {unit && <span style={{ ...MONO, fontSize: 10, color: 'var(--text-3)' }}>{unit}</span>}
    </div>
  )
}

// ── 수치 or 이상없음/미실시 체크 ─────────────────────────────────
// noneLabel: 손상 없음 / 미실시 / 자료없음 등 상황에 따라 지정
function NumOrNone({ value, onChange, noneLabel, unit, width = 90 }: {
  value: string; onChange: (v: string) => void
  noneLabel: string; unit?: string; width?: number
}) {
  const isNone = value === 'NONE'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {!isNone && <NumInput value={value} onChange={onChange} unit={unit} width={width} />}
      {isNone && (
        <span style={{ ...KR, fontSize: 11, color: 'var(--ok)', fontWeight: 600 }}>
          ✓ {noneLabel}
        </span>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={isNone} onChange={e => onChange(e.target.checked ? 'NONE' : '')} />
        <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>{noneLabel}</span>
      </label>
    </div>
  )
}

// ── 배수공 막힘: 있음/없음 + 막힘률 ─────────────────────────────
function DrainInput({ value, onChange }: {
  value: string; onChange: (v: string) => void
}) {
  const isOk = value === 'OK'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {!isOk && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="number" min="0" max="100" value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputSt, width: 70 }} />
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-3)' }}>% 막힘</span>
          {value !== '' && Number(value) >= 75 && (
            <span style={{ ...KR, fontSize: 10, color: 'var(--fail)', fontWeight: 700 }}>
              ⚠ 배면 수압 위험
            </span>
          )}
        </div>
      )}
      {isOk && (
        <span style={{ ...KR, fontSize: 11, color: 'var(--ok)', fontWeight: 600 }}>
          ✓ 정상 배수
        </span>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={isOk} onChange={e => onChange(e.target.checked ? 'OK' : '')} />
        <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>이상없음</span>
      </label>
    </div>
  )
}

// ── 인라인 경고 배지 ─────────────────────────────────────────────
function WarnBadge({ show, text, level = 'warn' }: { show: boolean; text: string; level?: 'warn' | 'fail' | 'ok' }) {
  if (!show) return null
  const color = level === 'ok' ? 'var(--ok)' : level === 'fail' ? 'var(--fail)' : 'var(--warn)'
  const bg = level === 'ok' ? 'var(--ok-bg)' : level === 'fail' ? 'var(--fail-bg)' : 'var(--warn-bg)'
  return (
    <span style={{
      ...KR, fontSize: 10, fontWeight: 700, color,
      background: bg, border: `1px solid ${color}`,
      borderRadius: 2, padding: '1px 7px', marginLeft: 6,
    }}>{text}</span>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SiteSurveyPanel
// ═══════════════════════════════════════════════════════════════════
export default function SiteSurveyPanel() {
  const { setP02 } = usePwas()

  // ── A. 외관조사 — 안전성평가 계산에 직접 반영되는 측정값 ─────────
  const [crackWidth, setCrackWidth] = useState('')       // 최대 균열폭 (mm)
  const [corrosionLoss, setCorrosionLoss] = useState('') // 두부 단면손실 (%)
  const [scourDepth, setScourDepth] = useState('')       // 기초 세굴 깊이 (mm)
  const [displacement, setDisplacement] = useState('')   // 수평변위 (mm)
  const [drainBlock, setDrainBlock] = useState('')       // 배수공 막힘률 (%)

  // ── B. 비파괴시험 ────────────────────────────────────────────────
  const [schmidt, setSchmidt] = useState('')             // 슈미트해머 추정강도 (MPa)
  const [ultrasound, setUltrasound] = useState('')       // 초음파속도 (m/s)
  const [carbonation, setCarbonation] = useState('')     // 탄산화 깊이 (mm)
  const [coverDepth, setCoverDepth] = useState('')       // 피복두께 실측 (mm)

  // ── C. 코어 압축강도 ─────────────────────────────────────────────
  const [coreFck, setCoreFck] = useState('')             // 코어 f'c (MPa)
  const [designFck, setDesignFck] = useState('')         // 설계 f'ck (MPa)

  // ── D. Lift-off Test ──────────────────────────────────────────────
  const [liftoffNail, setLiftoffNail] = useState('')     // 네일 T_res (kN)
  const [initNail, setInitNail] = useState('')           // 네일 T_0 초기긴장력 (kN)
  const [liftoffAnchor, setLiftoffAnchor] = useState('') // 앵커 T_res (kN)
  const [initAnchor, setInitAnchor] = useState('')       // 앵커 T_0 초기긴장력 (kN)

  // ── E. 지반조사자료 ──────────────────────────────────────────────
  const [gamma, setGamma] = useState('')
  const [phi, setPhi] = useState('')
  const [cohesion, setCohesion] = useState('')
  const [groundMemo, setGroundMemo] = useState('')

  // ── F. 레벨링 콘크리트 상태 ──────────────────────────────────────
  const [levelCrack, setLevelCrack] = useState('')       // 레벨링 균열폭 (mm)
  const [levelScour, setLevelScour] = useState('')       // 레벨링 세굴깊이 (mm)
  const [settlement, setSettlement] = useState('')       // 부등침하 (mm)

  // Phase 02 → Context mirror (Phase 03 carry-over용)
  // (내부 상태 → 외부 상태 publish — setState in effect 정당)
  useEffect(() => {
    setP02({
      crackWidth, corrosionLoss, scourDepth, displacement, drainBlock,
      schmidt, ultrasound, carbonation, coverDepth,
      coreFck, designFck,
      liftoffNail, initNail, liftoffAnchor, initAnchor,
      gamma, phi, cohesion, groundMemo,
      levelCrack, levelScour, settlement,
    })
  }, [
    crackWidth, corrosionLoss, scourDepth, displacement, drainBlock,
    schmidt, ultrasound, carbonation, coverDepth,
    coreFck, designFck,
    liftoffNail, initNail, liftoffAnchor, initAnchor,
    gamma, phi, cohesion, groundMemo,
    levelCrack, levelScour, settlement, setP02,
  ])

  // ── 파생 계산 ────────────────────────────────────────────────────
  const fckRatio = coreFck && designFck && Number(designFck) > 0
    ? Number(coreFck) / Number(designFck) * 100 : null

  const nailRatio = liftoffNail && initNail && Number(initNail) > 0
    ? Number(liftoffNail) / Number(initNail) * 100 : null

  const anchorRatio = liftoffAnchor && initAnchor && Number(initAnchor) > 0
    ? Number(liftoffAnchor) / Number(initAnchor) * 100 : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* 탭 타이틀 */}
      <div style={{
        padding: '10px 16px 8px', borderBottom: '2px solid var(--border)',
        display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0,
      }}>
        <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>PHASE 02</span>
        <span style={{ ...KR, fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>현장조사</span>
        <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>
          측정값이 Phase 03~04 안전성평가 계산에 미치는 영향을 [?]로 확인하세요
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>

        {/* ══ A. 외관 측정값 ════════════════════════════════════════ */}
        <SectionHead code="A" title="외관조사 — 안전성평가 입력 측정값" sub="→ Phase 04 계산 직접 반영" />

        <div style={{
          ...KR, fontSize: 10, color: 'var(--text-3)',
          background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '6px 10px', marginBottom: 10,
        }}>
          손상이 없으면 각 항목 "이상없음" 체크. 측정값은 Phase 04 안전성평가 계산에 직접 사용됩니다.
          외관 a~e 등급 종합판정은 Phase 05에서 별도 수행합니다.
        </div>

        {/* A-1 균열폭 */}
        <FieldRow label="패널 최대 균열폭 w" tooltip={{
          effect: 'Phase 04-C 단면검토 — 허용균열폭 초과 시 PS강재 부식 진행 가능, 유효 단면적 A_ps 감소 보정 검토. Phase 03 잔존 PS력 신뢰성 판단에도 사용',
          limit: 'KDS 14 30 §6.3.2: 프리스트레스트 콘크리트 허용균열폭 0.20 mm (부식환경 0.10 mm). 0.20 mm 초과 시 단면 열화 보정 검토',
          source: 'KDS 14 30 : 2022 §6.3.2; KDS 14 20 : 2022 §7.4.3',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={crackWidth} onChange={setCrackWidth} noneLabel="이상없음" unit="mm" />
            <WarnBadge show={crackWidth !== 'NONE' && crackWidth !== '' && Number(crackWidth) > 0.20} text="허용균열폭 초과" level="fail" />
            <WarnBadge show={crackWidth !== 'NONE' && crackWidth !== '' && Number(crackWidth) > 0.10 && Number(crackWidth) <= 0.20} text="부식환경 초과" level="warn" />
          </div>
        </FieldRow>

        {/* A-2 두부 단면손실 */}
        <FieldRow label="두부 부식 단면손실률" tooltip={{
          effect: 'Phase 03 PS잔존력 보정 — T_res = T_0 × (1 − 손실율). 단면손실 10% 이상이면 T_res 직접 감소 반영. KDS 11 70 15 §5.3',
          limit: '단면손실 < 5%: 정상 / 5~10%: 주의 (T_res 보정 권고) / 10% 이상: T_res 대폭 감소, 긴급 보수 검토',
          source: 'KDS 11 70 15 : 2020 §5.3; FHWA NHI-14-007 §6.2',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={corrosionLoss} onChange={setCorrosionLoss} noneLabel="이상없음" unit="%" />
            <WarnBadge show={corrosionLoss !== 'NONE' && corrosionLoss !== '' && Number(corrosionLoss) >= 10} text="T_res 감소 보정 필요" level="fail" />
            <WarnBadge show={corrosionLoss !== 'NONE' && corrosionLoss !== '' && Number(corrosionLoss) >= 5 && Number(corrosionLoss) < 10} text="주의" level="warn" />
          </div>
        </FieldRow>

        {/* A-3 기초 세굴 */}
        <FieldRow label="기초부 세굴 깊이 d_s" tooltip={{
          effect: 'Phase 04-A 지지력 — 유효 기초폭 B_eff = B − 2·d_s 로 감소 적용. 접지압 q_max = ΣV/B_eff(1 ± 6e/B_eff) 재산정. KDS 11 80 20 §4.3.1',
          limit: 'TBD — d_s > 50 mm: 지지력 재산정 필수. d_s > B/4: 긴급 보강 검토. 절대 기준은 현장조건 반영 필요',
          source: 'KDS 11 80 20 : 2020 §4.3.1; KDS 11 80 20 §4.4 기초 안정성',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={scourDepth} onChange={setScourDepth} noneLabel="이상없음" unit="mm" />
            <WarnBadge show={scourDepth !== 'NONE' && scourDepth !== '' && Number(scourDepth) > 50} text="지지력 재산정 필요" level="fail" />
          </div>
        </FieldRow>

        {/* A-4 수평변위 */}
        <FieldRow label="벽체 상단 수평변위 δ_h" tooltip={{
          effect: 'Phase 04-A 전도 — 변위량이 허용값 초과 시 편심 e 증가로 전도 FS 감소. 현재 변위가 추가 토압을 유발하는지 판단 기준으로도 사용',
          limit: 'FHWA NHI-14-007 §7.3: δ_h ≤ H/1000 정상, H/500 초과 시 긴급 점검 권고. H=5m 기준: 5 mm 이하 정상, 10 mm 초과 긴급',
          source: 'FHWA NHI-14-007 §7.3; 시설물 안전 세부지침해설서(옹벽) 2012 §4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={displacement} onChange={setDisplacement} noneLabel="이상없음" unit="mm" />
          </div>
        </FieldRow>

        {/* A-5 배수공 */}
        <FieldRow label="배수공 막힘률" tooltip={{
          effect: 'Phase 04-A 토압 — 배수공 막힘 시 배면 정수압 u = γ_w·h_w 발생. 현재 Pa 계산은 건조토압 기준이므로 수압 발생 시 Phase 04 토압에 u 가산 필요 (별도 경고 처리)',
          limit: '막힘률 < 25%: 정상 / 25~75%: 주의, 청소 권고 / 75% 이상: 수압 발생 위험, 배면 수위 파악 후 수압 가산 검토',
          source: '시설물 안전 세부지침해설서(옹벽) 2012 §4; KDS 11 80 20 : 2020 §4.2.1 (수압 조건)',
        }}>
          <DrainInput value={drainBlock} onChange={setDrainBlock} />
        </FieldRow>

        {/* ══ B. 비파괴시험 ════════════════════════════════════════ */}
        <SectionHead code="B" title="비파괴시험 (NDT)" sub="→ Phase 03 재료강도 보정" />

        <FieldRow label="슈미트해머 추정강도" tooltip={{
          effect: 'Phase 03 fck 추정 보조 — 코어 채취 불가 구간 강도 추정. C항 코어강도와 병용하여 신뢰성 향상',
          limit: 'KS F 2730 환산: fck ≈ 0.745R − 4.55 (R=20~60). 추정 오차 ±20% — 단독 사용 금지, 코어 병행 권장',
          source: 'KS F 2730 : 2019; KDS 14 20 : 2022 §6.1',
        }}>
          <NumOrNone value={schmidt} onChange={setSchmidt} noneLabel="미실시" unit="MPa" width={80} />
        </FieldRow>

        <FieldRow label="초음파 전달속도" tooltip={{
          effect: 'Phase 03 콘크리트 품질 보조 판단 — 공극·내부 균열 깊이 추정 지표. 슈미트해머와 조합하여 강도 추정 정밀도 향상',
          limit: '≥ 4,000 m/s: 우수 / 3,000~4,000: 양호 / 2,000~3,000: 불량 의심 / < 2,000: 심각 (BS EN 12504-4 기준)',
          source: 'BS EN 12504-4 : 2021; KDS 14 20 : 2022 §6.1',
        }}>
          <NumOrNone value={ultrasound} onChange={setUltrasound} noneLabel="미실시" unit="m/s" width={90} />
        </FieldRow>

        <FieldRow label="탄산화 깊이 d_c" tooltip={{
          effect: 'Phase 03 내구성 판단 — d_c ≥ 피복두께 시 PS강재 부식 개시 가능. 유효 A_ps 감소 → M_n, V_n 감소 (Phase 04-C)',
          limit: 'd_c < 피복두께: 안전 / d_c ≥ 피복두께: 부식 위험, Phase 03에서 A_ps 보정 검토 필요',
          source: 'KDS 14 20 : 2022 §7.4; KS F 2563 : 2017 (페놀프탈레인법)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={carbonation} onChange={setCarbonation} noneLabel="미실시" unit="mm" />
            {carbonation !== 'NONE' && carbonation !== '' && coverDepth !== 'NONE' && coverDepth !== '' &&
              Number(carbonation) >= Number(coverDepth) && (
                <WarnBadge show text="탄산화선 철근면 도달 — 부식 위험" level="fail" />
              )}
          </div>
        </FieldRow>

        <FieldRow label="피복두께 실측값 c_act" tooltip={{
          effect: 'Phase 03 단면검토 — 유효깊이 d = h − c_act − φ/2 로 수정. c_act < c_min 이면 M_n, V_n 모두 감소',
          limit: 'KDS 14 20 §7.2.1: 흙에 접하는 면 최소 피복 60 mm. c_act < 40 mm이면 열화 가속 위험 구간',
          source: 'KDS 14 20 : 2022 §7.2.1; KS F 2713 : 2022 (전자기 탐사법)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={coverDepth} onChange={setCoverDepth} noneLabel="미실시" unit="mm" />
            <WarnBadge show={coverDepth !== 'NONE' && coverDepth !== '' && Number(coverDepth) < 40} text="피복 부족 — d 수정 필요" level="fail" />
          </div>
        </FieldRow>

        {/* ══ C. 코어 압축강도 ══════════════════════════════════════ */}
        <SectionHead code="C" title="코어 채취 · 압축강도" sub="→ Phase 03 fck 확정 / Phase 04-C M_n·V_n" />

        <FieldRow label="코어 압축강도 f'c" tooltip={{
          effect: "Phase 03 확정 fck 입력값 — Phase 04-C 단면검토 M_n = A_ps·f_ps·(d_p−a/2), V_n = V_c+V_s 계산에 직접 사용",
          limit: "f'c ≥ 0.85·f'ck: 설계강도 충족 / 0.75~0.85: 경미 미달, 보정 검토 / < 0.75: 긴급 검토",
          source: 'KDS 14 20 : 2022 §6.4; KS F 2422 : 2019 (코어 압축강도 시험)',
        }}>
          <NumOrNone value={coreFck} onChange={setCoreFck} noneLabel="미채취" unit="MPa" />
        </FieldRow>

        <FieldRow label="설계기준강도 f'ck (도면)" tooltip={{
          effect: "강도비 = f'c / f'ck 산정 기준 — 열화율 계산 및 Phase 03 보정계수 결정에 사용",
          limit: "PSP/PPP 패널 통상 f'ck = 40~50 MPa (KDS 14 30 프리스트레스트 콘크리트)",
          source: 'KDS 14 30 : 2022 §4.1; 설계도면',
        }}>
          <NumOrNone value={designFck} onChange={setDesignFck} noneLabel="도면없음" unit="MPa" />
        </FieldRow>

        {/* 강도비 계산 결과 */}
        {fckRatio !== null && (
          <div style={{
            ...MONO, fontSize: 11,
            background: fckRatio >= 85 ? 'var(--ok-bg)' : fckRatio >= 75 ? 'var(--warn-bg)' : 'var(--fail-bg)',
            border: `1px solid ${fckRatio >= 85 ? 'var(--ok)' : fckRatio >= 75 ? 'var(--warn)' : 'var(--fail)'}`,
            borderRadius: 3, padding: '5px 10px', marginBottom: 4,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span>f'c / f'ck =</span>
            <span style={{ fontWeight: 700 }}>{fckRatio.toFixed(1)} %</span>
            <span style={{ ...KR, fontSize: 10 }}>
              {fckRatio >= 85 ? '✓ 설계강도 충족' : fckRatio >= 75 ? '⚠ 경미 미달 — Phase 03 보정' : '✕ 긴급 검토'}
            </span>
          </div>
        )}

        {/* ══ D. Lift-off Test ══════════════════════════════════════ */}
        <SectionHead code="D" title="Lift-off Test — 잔존 인장력" sub="→ Phase 03 T_res 확정 / Phase 04-B 검토" />

        <div style={{
          ...KR, fontSize: 10, color: 'var(--text-3)',
          background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '6px 10px', marginBottom: 10,
        }}>
          미실시 시 Phase 03에서 T_res = T_0 × (1 − 손실율)로 추정. 실측값이 있으면 실측 우선 사용.
          KDS 11 70 15 : 2020 §5.4 — 정기 점검 시 Lift-off Test 권장.
        </div>

        <FieldRow label="소일네일 T_res" tooltip={{
          effect: 'Phase 04-B 펀칭전단: V_u = T_res·cosα ≤ φ·v_c·b_o·d. T_res가 작을수록 FS 악화. KDS 11 70 15 §5.3',
          limit: 'T_res/T_0 ≥ 0.70: 정상 / 0.50~0.70: 주의 / < 0.50: FS 부족 가능, 재긴장 또는 보강 검토',
          source: 'KDS 11 70 15 : 2020 §5.4; FHWA NHI-14-007 §6.2',
        }}>
          <NumOrNone value={liftoffNail} onChange={setLiftoffNail} noneLabel="미실시" unit="kN" />
        </FieldRow>

        <FieldRow label="소일네일 T_0 (초기긴장력)" tooltip={{
          effect: 'T_res/T_0 비율 계산 기준 — 도면 또는 시공기록 확인',
          limit: '시공 당시 확인 필요. 기록 없으면 Phase 03에서 설계값 사용',
          source: '시공기록·설계도면; KDS 11 70 15 : 2020 §5.2',
        }}>
          <NumOrNone value={initNail} onChange={setInitNail} noneLabel="기록없음" unit="kN" />
        </FieldRow>

        {nailRatio !== null && (
          <div style={{
            ...MONO, fontSize: 11,
            background: nailRatio >= 70 ? 'var(--ok-bg)' : nailRatio >= 50 ? 'var(--warn-bg)' : 'var(--fail-bg)',
            border: `1px solid ${nailRatio >= 70 ? 'var(--ok)' : nailRatio >= 50 ? 'var(--warn)' : 'var(--fail)'}`,
            borderRadius: 3, padding: '5px 10px', marginBottom: 4,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span>네일 T_res/T_0 =</span>
            <span style={{ fontWeight: 700 }}>{nailRatio.toFixed(1)} %</span>
            <span style={{ ...KR, fontSize: 10 }}>
              {nailRatio >= 70 ? '✓ 정상' : nailRatio >= 50 ? '⚠ 주의 — Phase 04-B 확인' : '✕ 부족 — 보강 검토'}
            </span>
          </div>
        )}

        <FieldRow label="영구앵커 T_res" tooltip={{
          effect: 'Phase 04-B 패널 휨: M_u = T_res·e_s/n_s ≤ φ·M_n. 앵커 T_res 감소가 패널 휨모멘트 검토에 직접 영향',
          limit: 'T_res/T_0 ≥ 0.80: 정상 / 0.60~0.80: 주의 / < 0.60: 재긴장 또는 보강 검토 (PTI DC80.3-12 §7)',
          source: 'KDS 11 70 15 : 2020 §5.4; PTI DC80.3-12 §7 (Lift-off Test)',
        }}>
          <NumOrNone value={liftoffAnchor} onChange={setLiftoffAnchor} noneLabel="미실시" unit="kN" />
        </FieldRow>

        <FieldRow label="영구앵커 T_0 (초기긴장력)" tooltip={{
          effect: 'T_res/T_0 비율 계산 기준',
          limit: '시공 당시 확인 필요',
          source: '시공기록·설계도면; KDS 11 70 15 : 2020 §5.2',
        }}>
          <NumOrNone value={initAnchor} onChange={setInitAnchor} noneLabel="기록없음" unit="kN" />
        </FieldRow>

        {anchorRatio !== null && (
          <div style={{
            ...MONO, fontSize: 11,
            background: anchorRatio >= 80 ? 'var(--ok-bg)' : anchorRatio >= 60 ? 'var(--warn-bg)' : 'var(--fail-bg)',
            border: `1px solid ${anchorRatio >= 80 ? 'var(--ok)' : anchorRatio >= 60 ? 'var(--warn)' : 'var(--fail)'}`,
            borderRadius: 3, padding: '5px 10px', marginBottom: 4,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span>앵커 T_res/T_0 =</span>
            <span style={{ fontWeight: 700 }}>{anchorRatio.toFixed(1)} %</span>
            <span style={{ ...KR, fontSize: 10 }}>
              {anchorRatio >= 80 ? '✓ 정상' : anchorRatio >= 60 ? '⚠ 주의 — 재긴장 검토' : '✕ 부족 — 긴급 검토'}
            </span>
          </div>
        )}

        {/* ══ E. 지반조사자료 ════════════════════════════════════════ */}
        <SectionHead code="E" title="지반조사자료" sub="→ Phase 04-A Coulomb 토압 / 활동·전도·지지력 FS" />

        <div style={{
          ...KR, fontSize: 10, color: 'var(--text-3)',
          background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '6px 10px', marginBottom: 10,
        }}>
          시공 당시 토질조사 보고서 기준. 자료없음 체크 시 Phase 03에서 경험값으로 대체하고 근거 명시.
        </div>

        <FieldRow label="배면토 단위중량 γ" tooltip={{
          effect: 'Phase 04-A 토압: Pa = ½·γ·h²·Ka — γ에 1차 비례. h² 영향 다음으로 민감한 변수. KDS 11 80 20 §4.3.1',
          limit: '토사 17~20 kN/m³, 포화토 20~22 kN/m³. 범위 벗어나면 자료 신뢰성 재확인',
          source: 'KDS 11 80 20 : 2020 §4.2.1; FHWA NHI-14-007 §3.4',
        }}>
          <NumOrNone value={gamma} onChange={setGamma} noneLabel="자료없음" unit="kN/m³" />
        </FieldRow>

        <FieldRow label="내부마찰각 φ" tooltip={{
          effect: 'Phase 04-A Ka 계산 — Coulomb 공식의 sin(φ) 항이 분자·분모 모두에 포함. Ka에 가장 민감한 변수. KDS 11 80 20 §4.2.1',
          limit: '모래질 28~35°, 자갈 섞인 토 35~40°. φ < 20° 또는 > 45°는 재확인 필요',
          source: 'KDS 11 80 20 : 2020 §4.2.1; FHWA NHI-14-007 §3.4',
        }}>
          <NumOrNone value={phi} onChange={setPhi} noneLabel="자료없음" unit="°" />
        </FieldRow>

        <FieldRow label="점착력 c" tooltip={{
          effect: 'Phase 04-A 활동 FS = (ΣV·tanδ + c·B) / Pa·cosα — c 클수록 활동 저항 유리. KDS 11 80 20 §4.3.1',
          limit: '사질토 c = 0 kPa (보수적). 점성토 5~50 kPa. 장기 안정 검토 시 배수전단강도(c=0) 권장',
          source: 'KDS 11 80 20 : 2020 §4.3.1; KDS 11 10 20 : 2022 §4',
        }}>
          <NumOrNone value={cohesion} onChange={setCohesion} noneLabel="자료없음 (0으로 처리)" unit="kPa" width={100} />
        </FieldRow>

        <FieldRow label="자료 출처 메모" tooltip={{
          effect: 'Phase 06 보고서 — 지반정수 신뢰성 근거 명시',
          limit: '—',
          source: '—',
        }}>
          <input type="text" value={groundMemo} onChange={e => setGroundMemo(e.target.value)}
            placeholder="예: 2019년 지반조사 보고서 (○○지사) BH-1호공 3m"
            style={{ ...inputSt, width: '100%', ...KR, fontSize: 11 }} />
        </FieldRow>

        {/* ══ F. 단별 레벨링 콘크리트 상태 ═══════════════════════════ */}
        <SectionHead code="F" title="단별 레벨링 콘크리트 상태" sub="→ Phase 04-A 지지력 FS / 기초폭 B_eff ★" />

        <div style={{
          ...KR, fontSize: 10, color: 'var(--text-3)',
          background: 'var(--accent-bg)', border: '1px solid rgba(217,119,87,0.35)',
          borderRadius: 3, padding: '6px 10px', marginBottom: 10,
        }}>
          ★ 레벨링 콘크리트 = 단별 독립 기초. 세굴·균열은 유효 기초폭 B와 지지력 FS에 직접 영향.
        </div>

        <FieldRow label="레벨링 콘크리트 최대 균열폭" tooltip={{
          effect: 'Phase 04-A 지지력 — 심한 균열은 기초 강성 저하, 편심 e 증가로 q_max 상승 → 지지력 FS 감소',
          limit: '구조용 콘크리트 허용균열폭 0.30 mm (KDS 14 20 §7.4.3 건식 환경 기준). 흙 접촉부 0.20 mm 적용 권장',
          source: 'KDS 14 20 : 2022 §7.4.3; 시설물 안전 세부지침해설서(옹벽) 2012 §4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={levelCrack} onChange={setLevelCrack} noneLabel="이상없음" unit="mm" />
            <WarnBadge show={levelCrack !== 'NONE' && levelCrack !== '' && Number(levelCrack) > 0.30} text="허용균열폭 초과" level="fail" />
          </div>
        </FieldRow>

        <FieldRow label="레벨링 콘크리트 세굴 깊이" tooltip={{
          effect: 'Phase 04-A 지지력 — A섹션 기초 세굴과 동일 계산. B_eff = B − 2·d_s 감소로 q_max 증가',
          limit: 'TBD — d_s > 50 mm: 지지력 재산정 필수 (A섹션 기초 세굴 기준 동일 적용)',
          source: 'KDS 11 80 20 : 2020 §4.3.1',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NumOrNone value={levelScour} onChange={setLevelScour} noneLabel="이상없음" unit="mm" />
            <WarnBadge show={levelScour !== 'NONE' && levelScour !== '' && Number(levelScour) > 50} text="B_eff 감소 — 재산정 필요" level="fail" />
          </div>
        </FieldRow>

        <FieldRow label="단간 최대 부등침하량" tooltip={{
          effect: 'Phase 04-A 전도 — 부등침하로 인한 기울음이 편심 e = B/2 − ΔM/ΣV 산정에 영향. e > B/6이면 인장 발생',
          limit: 'TBD — 구조물 기초 허용부등침하 통상 기준 L/500. 절대값은 현장 조건 반영 판단',
          source: 'KDS 41 20 10 : 2022 §4.1; FHWA NHI-14-007 §7.3',
        }}>
          <NumOrNone value={settlement} onChange={setSettlement} noneLabel="이상없음" unit="mm" />
        </FieldRow>

        {/* ── 하단 안내 ─────────────────────────────────────────── */}
        <div style={{ height: 16 }} />
        <div style={{
          ...KR, fontSize: 10, color: 'var(--text-3)',
          borderTop: '1px solid var(--border)', paddingTop: 10,
        }}>
          ※ 이 탭의 측정값은 Phase 03 입력값 확정 탭으로 이월됩니다.
          미실시·자료없음 항목은 Phase 03에서 추정값 또는 경험값으로 대체하고 근거를 명시하십시오.
          외관 종합 a~e 등급 판정은 Phase 05에서 안전성평가 결과와 통합하여 수행합니다.
        </div>

      </div>
    </div>
  )
}
