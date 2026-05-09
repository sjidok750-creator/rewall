// ═══════════════════════════════════════════════════════════════════
// PHASE 03 — 입력값 확정 (InputPanel)
//
// Phase 04 안정성 검토 계산에 들어갈 모든 입력값을 확정한다.
// 7개 섹션 (A: 단면·배근, B: 재료강도, C: PS잔존력, D: 보강재,
//          E: 지반정수, F: 하중조건, G: 기초폭 B)
//
// 출처(Provenance) 시스템:
//   measured / drawing / phase02 / auto / estimated / empirical / none
//   → 모든 입력값 옆에 출처 뱃지 부착, 우측 신뢰도 게이지에 가중평균.
//
// Phase 02 자동 이월:
//   useEffect로 p02 변경 시 secB/C/E/G의 해당 필드를 채우되,
//   사용자가 손댄 값(_confirmed)은 덮어쓰지 않음.
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { usePwas } from '../../state/usePwas'
import type {
  Phase03Output, Provenance,
  SectionA, SectionB, SectionC, SectionF,
  ReinfTier, SoilTier, BaseTier,
} from '../../types'

const KR: React.CSSProperties = { fontFamily: 'Pretendard, sans-serif' }
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ═══════════════════════════════════════════════════════════════════
// 1. 공용 폼 프리미티브 (Phase 02 패턴 + 신규 ProvenanceBadge)
// ═══════════════════════════════════════════════════════════════════

function SectionHead({ code, title, sub, focused, onClick }: {
  code: string; title: string; sub?: string; focused?: boolean; onClick?: () => void
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: focused ? 'var(--accent-bg)' : 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border)',
      borderBottom: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderLeft: focused ? '3px solid var(--accent)' : '3px solid transparent',
      margin: '0 -16px 12px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.1s, border-left-color 0.1s',
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

interface TooltipInfo { effect: string; limit: string; source: string }

function InfoTooltip({ info }: { info: TooltipInfo }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        ...MONO, fontSize: 9, fontWeight: 700,
        color: open ? 'var(--bg-panel)' : 'var(--text-3)',
        background: open ? 'var(--text-3)' : 'transparent',
        border: '1px solid var(--border-2)',
        borderRadius: 2, padding: '1px 5px',
        cursor: 'pointer', lineHeight: 1.4,
      }}>?</button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          width: 320, background: 'var(--bg-panel)',
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

// ── 출처 뱃지 (Provenance) ────────────────────────────────────────
const PROV: Record<Provenance, { label: string; color: string; bg: string; border: string; weight: number }> = {
  measured:  { label: '실측', color: 'var(--ok)',     bg: 'var(--ok-bg)',     border: 'var(--ok)',     weight: 100 },
  drawing:   { label: '도면', color: '#3D6A93',       bg: '#EAF2F7',          border: '#3D6A93',       weight: 80 },
  phase02:   { label: 'Ph02', color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--accent)', weight: 75 },
  auto:      { label: '자동', color: 'var(--text-3)', bg: 'var(--bg-sidebar)',border: 'var(--border-2)', weight: 70 },
  estimated: { label: '추정', color: 'var(--warn)',   bg: 'var(--warn-bg)',   border: 'var(--warn)',   weight: 50 },
  empirical: { label: '경험', color: 'var(--warn)',   bg: 'var(--warn-bg)',   border: 'var(--warn)',   weight: 30 },
  none:      { label: '미입력', color: 'var(--fail)', bg: 'var(--fail-bg)',   border: 'var(--fail)',   weight: 0  },
}

function ProvenanceBadge({ p }: { p: Provenance }) {
  const v = PROV[p]
  return (
    <span style={{
      ...MONO, fontSize: 8, fontWeight: 700,
      color: v.color, background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 2, padding: '1px 4px',
      letterSpacing: '0.02em', flexShrink: 0,
    }}>{v.label}</span>
  )
}

// ── FieldRow with Provenance ──────────────────────────────────────
function FieldRow({ label, tooltip, prov, children }: {
  label: string; tooltip: TooltipInfo; prov?: Provenance; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 230, flexShrink: 0 }}>
        <span style={{ ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <InfoTooltip info={tooltip} />
        {prov && <ProvenanceBadge p={prov} />}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

// ── 자동 산출 행 (계산식 + 결과) ──────────────────────────────────
function DerivedRow({ label, formula, value, unit, level }: {
  label: string; formula?: string; value: string; unit?: string
  level?: 'ok' | 'warn' | 'fail'
}) {
  const color = level === 'ok' ? 'var(--ok)' : level === 'warn' ? 'var(--warn)'
              : level === 'fail' ? 'var(--fail)' : 'var(--accent)'
  const bg = level === 'ok' ? 'var(--ok-bg)' : level === 'warn' ? 'var(--warn-bg)'
           : level === 'fail' ? 'var(--fail-bg)' : 'var(--accent-bg)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '5px 10px', marginBottom: 6,
      background: bg, border: `1px solid ${color}`,
      borderRadius: 3,
    }}>
      <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)', minWidth: 90 }}>
        {label}
      </span>
      {formula && (
        <span style={{ ...MONO, fontSize: 9, color: 'var(--text-3)' }}>{formula}</span>
      )}
      <span style={{ flex: 1 }} />
      <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color }}>
        {value}{unit && <span style={{ fontSize: 9, marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  )
}

// ── 공용 입력 스타일 ──────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  ...MONO, fontSize: 12, color: 'var(--text-1)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '4px 7px', outline: 'none',
  boxSizing: 'border-box',
}

function NumInput({ value, onChange, unit, width = 90, step = 0.1, min = 0 }: {
  value: number; onChange: (v: number) => void
  unit?: string; width?: number; step?: number; min?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input type="number" min={min} step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={e => {
          const v = parseFloat(e.target.value)
          onChange(Number.isFinite(v) ? v : 0)
        }}
        style={{ ...inputSt, width }}
      />
      {unit && <span style={{ ...MONO, fontSize: 10, color: 'var(--text-3)' }}>{unit}</span>}
    </div>
  )
}

function TextInput({ value, onChange, width = 110 }: {
  value: string; onChange: (v: string) => void; width?: number
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputSt, width }} />
  )
}

function RadioGroup<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {options.map(o => (
        <label key={o.value} style={{
          display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}>
          <input type="radio" checked={value === o.value}
            onChange={() => onChange(o.value)} />
          <span style={{ ...KR, fontSize: 11, color: 'var(--text-2)' }}>{o.label}</span>
        </label>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. 단위 변환 헬퍼
// ═══════════════════════════════════════════════════════════════════
const safeNum = (s: string): number | null =>
  s === '' || s === 'NONE' || s === 'OK' ? null : (Number.isFinite(Number(s)) ? Number(s) : null)
const mmToM = (mm: number) => mm / 1000
const mToMm = (m: number) => m * 1000
const resizeArr = <T,>(arr: T[], n: number, fill: () => T): T[] => {
  if (arr.length === n) return arr
  if (n > arr.length) return [...arr, ...Array.from({ length: n - arr.length }, fill)]
  return arr.slice(0, n)
}

// ═══════════════════════════════════════════════════════════════════
// 3. 기본값 (DEFAULT_P03) — 단수 4단 가정으로 초기화
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_REINF = (kind: 'nail' | 'anchor' = 'nail'): ReinfTier => ({
  reinf_type: kind,
  L: kind === 'nail' ? 6 : 11,
  d: 76.3, t_wall: 5.0,
  D_DH: kind === 'nail' ? 100 : 130,   // 천공경 (mm)
  c_plate: kind === 'nail' ? 150 : 200, // 지압판 변길이 (mm)
  A_strand: kind === 'nail' ? 0 : 277.4, // 강연선 총 단면적 (mm²) — 앵커 전용
  fy_nail: 400,          // SD400 이형철근 — 네일 전용
  fpy_strand: 1580,      // SWPC7B PC강연선 항복 — 앵커 전용
  fpu_strand: 1860,      // SWPC7B PC강연선 인장 — 앵커 전용
  sh: 1.5, sv: 1.0,
  alpha: kind === 'nail' ? 12 : 20,
  fcg: 24, Lf: 4, Lb: 7,
})
const DEFAULT_SOIL = (): SoilTier => ({
  gamma: 19, phi: 30, cohesion: 0, delta_ratio: 0.667,
  Ks: 30000, qu: 300, qu_method: 'report', N_value: 20,
})
const DEFAULT_BASE = (): BaseTier => ({ ds: 0, tL: 0.15, Df: 0.3 })

const DEFAULT_P03 = (stages: number): Phase03Output => ({
  A: {
    t: 250, b: 1200, c_design: 60, c_act: 60,
    d_main: 'D13', s_main: 200,
    ps_type: 'SWPC7B', d_ps: 12.7, n_ps: 4,
    _origin: {}, _confirmed: {},
  },
  B: {
    fck_design: 40, fck_core: 0, fck_use: 'design-eta',
    eta_deg: 0, fy_design: 400, rebar_loss: 0,
    fpy: 1600, fpu: 1860,
    _origin: {}, _confirmed: {},
  },
  C: {
    T0_anchor: 0, Pd_nail: 0, Tres_anchor: 0, Tres_nail: 0,
    Tres_method: 'estimated',
    loss_friction: 5, loss_anchor: 3, loss_elastic: 4,
    loss_shrinkage: 3, loss_creep: 5, loss_relax: 4,
    _origin: {}, _confirmed: {},
  },
  D: { tierMode: 'uniform', tiers: Array.from({ length: stages }, () => DEFAULT_REINF('nail')) },
  E: { tierMode: 'uniform', tiers: Array.from({ length: stages }, DEFAULT_SOIL) },
  F: {
    q_surcharge: 13, q_type: 'vehicle', gwl: -99, gwl_ref: 'base',
    _origin: {},
  },
  G: { tiers: Array.from({ length: stages }, DEFAULT_BASE) },
})

// ═══════════════════════════════════════════════════════════════════
// 4. 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════
export default function InputPanel() {
  const { p01, p02, setP03snap } = usePwas()
  const [p03, setP03] = useState<Phase03Output>(() => DEFAULT_P03(p01.stages || 4))
  const [focusSec, setFocusSec] = useState<'A'|'B'|'C'|'D'|'E'|'F'|'G'>('A')

  // ── Phase 01 stages/tierMethods 변경 시 D/E/G 단별 배열 동기화 ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP03(prev => {
      const defaultKind = (i: number): 'nail'|'anchor' =>
        (p01.tierMethods[i] ?? (p01.method === 'PPP' ? 'PPP' : 'PSP')) === 'PPP' ? 'anchor' : 'nail'
      const newDTiers = resizeArr(prev.D.tiers, p01.stages, () => DEFAULT_REINF(defaultKind(prev.D.tiers.length)))
        .map((t, i) => ({ ...t, reinf_type: defaultKind(i) as 'nail'|'anchor' }))
      return {
        ...prev,
        D: { ...prev.D, tiers: newDTiers },
        E: { ...prev.E, tiers: resizeArr(prev.E.tiers, p01.stages, DEFAULT_SOIL) },
        G: { ...prev.G, tiers: resizeArr(prev.G.tiers, p01.stages, DEFAULT_BASE) },
      }
    })
  }, [p01.stages, p01.method, p01.tierMethods])

  // ── Phase 01 wallThick → Section A.t 자동 이월 ──────────────────
  // (외부 상태 → 내부 상태 sync — setState in effect 정당)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP03(prev => {
      if (prev.A._confirmed.t) return prev
      const newT = mToMm(p01.wallThick)
      if (Math.abs(prev.A.t - newT) < 0.01) return prev
      return {
        ...prev,
        A: { ...prev.A, t: newT, _origin: { ...prev.A._origin, t: 'phase02' } },
      }
    })
  }, [p01.wallThick])

  // ── Phase 01 panelWidth → Section A.b 자동 이월 ─────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP03(prev => {
      if (prev.A._confirmed.b) return prev
      if (Math.abs(prev.A.b - p01.panelWidth) < 0.01) return prev
      return { ...prev, A: { ...prev.A, b: p01.panelWidth, _origin: { ...prev.A._origin, b: 'drawing' } } }
    })
  }, [p01.panelWidth])

  // ── Phase 01 designFck → Section B.fck_design 자동 이월 ─────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP03(prev => {
      if (prev.B._confirmed.fck_design) return prev
      if (Math.abs(prev.B.fck_design - p01.designFck) < 0.01) return prev
      return { ...prev, B: { ...prev.B, fck_design: p01.designFck, _origin: { ...prev.B._origin, fck_design: 'drawing' } } }
    })
  }, [p01.designFck])

  // ── Phase 02 → Phase 03 자동 이월 ───────────────────────────────
  // (외부 상태 → 내부 상태 sync — setState in effect 정당)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP03(prev => {
      const next = { ...prev }
      let changed = false

      // B. 코어 fck → fck_core
      const coreFck = safeNum(p02.coreFck)
      if (coreFck !== null && !prev.B._confirmed.fck_core && prev.B.fck_core !== coreFck) {
        next.B = { ...next.B, fck_core: coreFck, fck_use: 'measured',
          _origin: { ...next.B._origin, fck_core: 'phase02', fck_use: 'auto' } }
        changed = true
      }
      // B. 부식 단면감소 → rebar_loss
      const corLoss = safeNum(p02.corrosionLoss)
      if (corLoss !== null && !prev.B._confirmed.rebar_loss && prev.B.rebar_loss !== corLoss) {
        next.B = { ...next.B, rebar_loss: corLoss,
          _origin: { ...next.B._origin, rebar_loss: 'phase02' } }
        changed = true
      }
      // A. 피복 실측 → c_act
      const cAct = safeNum(p02.coverDepth)
      if (cAct !== null && !prev.A._confirmed.c_act && prev.A.c_act !== cAct) {
        next.A = { ...next.A, c_act: cAct,
          _origin: { ...next.A._origin, c_act: 'phase02' } }
        changed = true
      }
      // C. Lift-off → Tres
      const tresN = safeNum(p02.liftoffNail)
      const tresA = safeNum(p02.liftoffAnchor)
      const t0N = safeNum(p02.initNail)
      const t0A = safeNum(p02.initAnchor)
      if (tresN !== null && !prev.C._confirmed.Tres_nail && prev.C.Tres_nail !== tresN) {
        next.C = { ...next.C, Tres_nail: tresN, Tres_method: 'measured',
          _origin: { ...next.C._origin, Tres_nail: 'phase02', Tres_method: 'auto' } }
        changed = true
      }
      if (tresA !== null && !prev.C._confirmed.Tres_anchor && prev.C.Tres_anchor !== tresA) {
        next.C = { ...next.C, Tres_anchor: tresA, Tres_method: 'measured',
          _origin: { ...next.C._origin, Tres_anchor: 'phase02', Tres_method: 'auto' } }
        changed = true
      }
      if (t0N !== null && !prev.C._confirmed.Pd_nail && prev.C.Pd_nail !== t0N) {
        next.C = { ...next.C, Pd_nail: t0N,
          _origin: { ...next.C._origin, Pd_nail: 'phase02' } }
        changed = true
      }
      if (t0A !== null && !prev.C._confirmed.T0_anchor && prev.C.T0_anchor !== t0A) {
        next.C = { ...next.C, T0_anchor: t0A,
          _origin: { ...next.C._origin, T0_anchor: 'phase02' } }
        changed = true
      }
      // E. 지반 정수 (uniform 모드 시 첫 단에 채움)
      const gamma = safeNum(p02.gamma)
      const phi = safeNum(p02.phi)
      const coh = safeNum(p02.cohesion)
      if (next.E.tierMode === 'uniform' && next.E.tiers[0]) {
        const t0 = next.E.tiers[0]
        let modified = false
        const newT0 = { ...t0 }
        if (gamma !== null && newT0.gamma !== gamma) { newT0.gamma = gamma; modified = true }
        if (phi !== null && newT0.phi !== phi) { newT0.phi = phi; modified = true }
        if (coh !== null && newT0.cohesion !== coh) { newT0.cohesion = coh; modified = true }
        if (modified) {
          next.E = { ...next.E, tiers: next.E.tiers.map(() => newT0) }
          changed = true
        }
      }
      // G. 세굴 깊이 (mm) → ds (m), 모든 단 동일 적용
      const dsMm = safeNum(p02.scourDepth)
      const lvlScourMm = safeNum(p02.levelScour)
      const dsMax = Math.max(dsMm ?? 0, lvlScourMm ?? 0)
      if (dsMax > 0) {
        const dsM = mmToM(dsMax)
        const tiersG = next.G.tiers.map(t => ({ ...t, ds: dsM }))
        if (JSON.stringify(tiersG) !== JSON.stringify(next.G.tiers)) {
          next.G = { ...next.G, tiers: tiersG }
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [p02])

  // ── p03 → context publish ────────────────────────────────────────
  useEffect(() => { setP03snap(p03) }, [p03, setP03snap])

  // ── 헬퍼: 섹션별 setter (얕은 머지) ──────────────────────────────
  const updA = <K extends keyof SectionA>(k: K, v: SectionA[K], confirm = true) =>
    setP03(prev => ({ ...prev, A: { ...prev.A, [k]: v,
      _origin: { ...prev.A._origin, [k]: 'drawing' as Provenance },
      _confirmed: confirm ? { ...prev.A._confirmed, [k]: true } : prev.A._confirmed } }))
  const updB = <K extends keyof SectionB>(k: K, v: SectionB[K], confirm = true) =>
    setP03(prev => ({ ...prev, B: { ...prev.B, [k]: v,
      _origin: { ...prev.B._origin, [k]: 'drawing' as Provenance },
      _confirmed: confirm ? { ...prev.B._confirmed, [k]: true } : prev.B._confirmed } }))
  const updC = <K extends keyof SectionC>(k: K, v: SectionC[K], confirm = true) =>
    setP03(prev => ({ ...prev, C: { ...prev.C, [k]: v,
      _origin: { ...prev.C._origin, [k]: 'estimated' as Provenance },
      _confirmed: confirm ? { ...prev.C._confirmed, [k]: true } : prev.C._confirmed } }))
  const updF = <K extends keyof SectionF>(k: K, v: SectionF[K]) =>
    setP03(prev => ({ ...prev, F: { ...prev.F, [k]: v,
      _origin: { ...prev.F._origin, [k]: 'drawing' as Provenance } } }))
  const updTier = <T,>(section: 'D'|'E'|'G', i: number, key: keyof T, v: unknown) =>
    setP03(prev => {
      const sec = prev[section] as { tierMode: string; tiers: T[] }
      const tiers = sec.tiers.map((t, idx) => idx === i ? { ...t, [key]: v } : t)
      return { ...prev, [section]: { ...sec, tiers } } as Phase03Output
    })

  // ── 파생값 계산 ──────────────────────────────────────────────────
  const fckFinal = useMemo(() => {
    if (p03.B.fck_use === 'measured' && p03.B.fck_core > 0) return p03.B.fck_core
    return p03.B.fck_design * (1 - p03.B.eta_deg / 100)
  }, [p03.B])
  const fyEff = useMemo(() => p03.B.fy_design * (1 - p03.B.rebar_loss / 100), [p03.B])
  const lossTotal = useMemo(() =>
    p03.C.loss_friction + p03.C.loss_anchor + p03.C.loss_elastic
    + p03.C.loss_shrinkage + p03.C.loss_creep + p03.C.loss_relax, [p03.C])
  const tresFinalAnchor = useMemo(() => {
    if (p03.C.Tres_method === 'measured') return p03.C.Tres_anchor
    return p03.C.T0_anchor * (1 - lossTotal / 100)
  }, [p03.C, lossTotal])
  const tresFinalNail = useMemo(() => {
    // 네일 = 이형철근 패시브 보강재. PS 6항 손실 없음.
    // measured: Phase 02 인발확인시험 실측값, estimated: 설계 두부력 × (1 - 부식 단면감소율)
    if (p03.C.Tres_method === 'measured') return p03.C.Tres_nail
    return p03.C.Pd_nail * (1 - p03.B.rebar_loss / 100)
  }, [p03.C, p03.B.rebar_loss])
  const dEff = useMemo(() => {
    const dPS = p03.A.d_ps
    return p03.A.t - p03.A.c_act - dPS / 2
  }, [p03.A])
  const APs = useMemo(() => {
    const r = p03.A.d_ps / 2
    return Math.PI * r * r * p03.A.n_ps
  }, [p03.A])

  // ── 신뢰도 게이지 (출처 가중평균) ────────────────────────────────
  const confidence = useMemo(() => {
    const all: Provenance[] = []
    Object.values(p03.A._origin).forEach(v => v && all.push(v))
    Object.values(p03.B._origin).forEach(v => v && all.push(v))
    Object.values(p03.C._origin).forEach(v => v && all.push(v))
    Object.values(p03.F._origin).forEach(v => v && all.push(v))
    if (all.length === 0) return 0
    const avg = all.reduce((s, p) => s + PROV[p].weight, 0) / all.length
    return Math.round(avg)
  }, [p03])

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ════ 좌측: 7섹션 입력 ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* 탭 타이틀 */}
        <div style={{
          padding: '10px 16px 8px', borderBottom: '2px solid var(--border)',
          display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0,
          background: 'var(--bg-panel)',
        }}>
          <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>PHASE 03</span>
          <span style={{ ...KR, fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>입력값 확정</span>
          <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>
            Phase 02 측정값을 자동 이월하여 Phase 04 안정성 검토에 사용할 입력값을 확정합니다
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>

          {/* 도면 분기 안내 배너 */}
          <DocBranchBanner docStatus={p01.docStatus} />

          {/* ══ A. 단면·배근 ════════════════════════════════════════ */}
          <SectionHead code="A" title="단면 · 배근" sub="→ Phase 04-C 단면검토 (M_n, V_n)"
            focused={focusSec === 'A'} onClick={() => setFocusSec('A')} />

          <FieldRow label="패널 두께 t" prov={p03.A._origin.t}
            tooltip={{
              effect: 'Phase 04-C 단면강도 — 유효깊이 d = t − c − D/2 의 출발값. M_n, V_n 1차 변수',
              limit: 'PSP/PPP 통상 200~300 mm. Phase 01 wallThick(m)을 자동 mm 변환.',
              source: 'KDS 14 30 : 2022 §4.1; Phase 01 입력',
            }}>
            <NumInput value={p03.A.t} onChange={v => updA('t', v)} unit="mm" step={1} />
          </FieldRow>

          <FieldRow label="패널 폭 B_panel" prov={p03.A._origin.b}
            tooltip={{
              effect: 'Phase 04-B/C 구조 검토 단위 — 패널 1장(B_panel×h_panel)이 독립 해석 단위. 펀칭전단 임계둘레 b_0, 휨강도 M_n 계산에 직접 사용.',
              limit: 'PSP/PPP 패널 통상 B_panel = 1000~1500 mm. 제조사 시공도 확인. Phase 01에서 수정.',
              source: 'FHWA NHI-14-007 §5.3; KDS 14 30 : 2022 4.2.1; PWAS 지침서 §5-4',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                ...MONO, fontSize: 12, color: 'var(--text-1)',
                background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
                borderRadius: 2, padding: '4px 10px',
              }}>{p03.A.b} mm</div>
              <span style={{ ...KR, fontSize: 9, color: 'var(--text-3)' }}>Phase 01에서 수정</span>
            </div>
          </FieldRow>

          <DerivedRow label="패널 높이 h_panel" formula="Phase 01 이월"
            value={p01.panelHeight.toFixed(2)} unit="m" />
          <DerivedRow label="총 벽체 높이 H" formula="Σ(패널수 × h_panel)"
            value={p01.height.toFixed(2)} unit="m" />

          <FieldRow label="설계 피복 c (도면)" prov={p03.A._origin.c_design}
            tooltip={{
              effect: 'Phase 04-C 유효깊이 산정 — c가 1mm 줄면 d 1mm 감소 → M_n 직접 감소',
              limit: 'KDS 14 20 §7.2.1: 흙 접촉면 최소 60mm. PSP 패널 전면 노출이면 40mm 가능 — 도면 확인',
              source: 'KDS 14 20 : 2022 §7.2.1',
            }}>
            <NumInput value={p03.A.c_design} onChange={v => updA('c_design', v)} unit="mm" step={1} />
          </FieldRow>

          <FieldRow label="실측 피복 c_act" prov={p03.A._origin.c_act}
            tooltip={{
              effect: 'Phase 04-C 유효깊이 d = t − c_act − D/2. Phase 02-B 피복 실측값 자동 이월',
              limit: 'c_act < 40 mm: 열화 가속 위험. c_act < c_design: 피복 부족',
              source: 'KDS 14 20 : 2022 §7.2.1; Phase 02-B 자동 이월',
            }}>
            <NumInput value={p03.A.c_act} onChange={v => updA('c_act', v)} unit="mm" step={1} />
          </FieldRow>

          <FieldRow label="주철근" prov={p03.A._origin.d_main}
            tooltip={{
              effect: 'Phase 04-C 휨강도·전단강도 산정. 도면 표기 그대로 입력',
              limit: 'PSP/PPP 패널 통상 D10~D16',
              source: 'KDS 14 20 : 2022; 설계도면',
            }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <TextInput value={p03.A.d_main} onChange={v => updA('d_main', v)} width={60} />
              <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>@</span>
              <NumInput value={p03.A.s_main} onChange={v => updA('s_main', v)} unit="mm" step={10} width={70} />
            </div>
          </FieldRow>

          <FieldRow label="PS강재 종류 / 직경 / 가닥수" prov={p03.A._origin.d_ps}
            tooltip={{
              effect: 'Phase 04-C 휨강도 — A_ps = π(d/2)²·n. 가닥 수 1개 차이가 M_n 25% 변동 가능',
              limit: 'SWPC7B φ12.7 1가닥 = 98.7 mm² (KS D 7002). 도면값 우선',
              source: 'KS D 7002 : 2020; KDS 14 30 : 2022 §4.2',
            }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <TextInput value={p03.A.ps_type} onChange={v => updA('ps_type', v)} width={80} />
              <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>φ</span>
              <NumInput value={p03.A.d_ps} onChange={v => updA('d_ps', v)} unit="mm" step={0.1} width={70} />
              <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>×</span>
              <NumInput value={p03.A.n_ps} onChange={v => updA('n_ps', v)} unit="가닥" step={1} width={60} />
            </div>
          </FieldRow>

          <DerivedRow label="단면적 A_ps" formula="π(d/2)²·n"
            value={APs.toFixed(1)} unit="mm²" />
          <DerivedRow label="유효깊이 d" formula="t − c_act − d_ps/2"
            value={dEff.toFixed(1)} unit="mm"
            level={dEff < 100 ? 'fail' : dEff < 150 ? 'warn' : 'ok'} />

          {/* ══ B. 재료 강도 ════════════════════════════════════════ */}
          <SectionHead code="B" title="재료 강도" sub="→ Phase 04-C 단면검토 / 04-A 토압 영향 미미"
            focused={focusSec === 'B'} onClick={() => setFocusSec('B')} />

          <FieldRow label="설계기준강도 f'ck" prov={p03.B._origin.fck_design}
            tooltip={{
              effect: "Phase 04-C 단면강도 — M_n에 비례. 코어 미실측 시 '설계×감소' 모드 활용",
              limit: 'PSP/PPP 패널 통상 40~50 MPa. Phase 01 기본정보에서 입력한 값이 자동 이월됩니다.',
              source: 'KDS 14 30 : 2022 §4.1; Phase 01 기본정보 자동 이월',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <NumInput value={p03.B.fck_design} onChange={v => updB('fck_design', v)} unit="MPa" step={1} />
              <span style={{ ...KR, fontSize: 9, color: 'var(--text-3)' }}>← Phase 01 이월</span>
            </div>
          </FieldRow>

          <FieldRow label="코어 압축강도 f'c" prov={p03.B._origin.fck_core}
            tooltip={{
              effect: "Phase 04-C M_n, V_n에 직접 사용 — 실측값 우선 적용",
              limit: "f'c ≥ 0.85·f'ck: 설계강도 충족 / < 0.85: 보정 후 사용",
              source: 'KDS 14 20 : 2022 §6.4; KS F 2422; Phase 02-C 자동 이월',
            }}>
            <NumInput value={p03.B.fck_core} onChange={v => updB('fck_core', v)} unit="MPa" step={0.5} />
          </FieldRow>

          <FieldRow label="강도 적용 기준" prov={p03.B._origin.fck_use}
            tooltip={{
              effect: "확정 fck 산정 방식 — 실측 우선이 안전측",
              limit: "코어 미채취 시 '설계×감소' 모드 사용 (η는 슈미트해머·코어비 자동)",
              source: 'KDS 14 20 : 2022 §6.4',
            }}>
            <RadioGroup value={p03.B.fck_use} onChange={v => updB('fck_use', v)}
              options={[
                { value: 'measured',   label: '실측 우선' },
                { value: 'design-eta', label: '설계 × (1−η)' },
              ]} />
          </FieldRow>

          <FieldRow label="열화 감소율 η" prov={p03.B._origin.eta_deg}
            tooltip={{
              effect: 'fck × (1 − η/100) 산정. 코어비 < 85%면 보정 권고',
              limit: 'η ≥ 15%: 열화 심함. KDS 14 20 §6.4 코어 보정값 참조',
              source: 'KDS 14 20 : 2022 §6.4',
            }}>
            <NumInput value={p03.B.eta_deg} onChange={v => updB('eta_deg', v)} unit="%" step={0.5} />
          </FieldRow>

          <DerivedRow label="확정 fck"
            formula={p03.B.fck_use === 'measured' ? "f'c (실측)" : "f'ck × (1−η)"}
            value={fckFinal.toFixed(1)} unit="MPa"
            level={fckFinal < 0.7 * p03.B.fck_design ? 'fail' : fckFinal < 0.85 * p03.B.fck_design ? 'warn' : 'ok'} />

          <FieldRow label="철근 항복강도 fy" prov={p03.B._origin.fy_design}
            tooltip={{
              effect: 'Phase 04-C 휨철근 인장 강도. 부식 단면감소율과 곱하여 유효 fy 적용',
              limit: 'SD400=400 MPa, SD500=500 MPa (KDS 14 20 §5.3)',
              source: 'KDS 14 20 : 2022 §5.3; KS D 3504',
            }}>
            <NumInput value={p03.B.fy_design} onChange={v => updB('fy_design', v)} unit="MPa" step={10} />
          </FieldRow>

          <FieldRow label="철근 부식 단면감소" prov={p03.B._origin.rebar_loss}
            tooltip={{
              effect: '유효 fy = fy × (1 − loss). 부식 10%이면 휨강도 10% 감소',
              limit: 'Phase 02-A 두부 부식률 자동 이월. 비대칭 부식은 평균이 위험측',
              source: 'KDS 11 70 15 : 2020 §5.3; Phase 02-A',
            }}>
            <NumInput value={p03.B.rebar_loss} onChange={v => updB('rebar_loss', v)} unit="%" step={0.5} />
          </FieldRow>

          <DerivedRow label="유효 fy" formula="fy × (1 − loss)"
            value={fyEff.toFixed(0)} unit="MPa"
            level={fyEff < 0.85 * p03.B.fy_design ? 'fail' : 'ok'} />

          <FieldRow label="PS강재 항복 f_py / 인장 f_pu" prov={p03.B._origin.fpy}
            tooltip={{
              effect: 'Phase 04-C 균열모멘트·극한모멘트 산정',
              limit: 'SWPC7B: f_py=1600 MPa, f_pu=1860 MPa (KS D 7002)',
              source: 'KDS 14 30 : 2022 §4.2; KS D 7002',
            }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <NumInput value={p03.B.fpy} onChange={v => updB('fpy', v)} unit="MPa" step={10} width={75} />
              <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>/</span>
              <NumInput value={p03.B.fpu} onChange={v => updB('fpu', v)} unit="MPa" step={10} width={75} />
            </div>
          </FieldRow>

          {/* ══ C. PS 잔존력 ═══════════════════════════════════════ */}
          <SectionHead code="C" title="PS 잔존력 / 네일 두부력" sub="→ Phase 04-B 패널휨·펀칭 / 04-C P_eff"
            focused={focusSec === 'C'} onClick={() => setFocusSec('C')} />

          {/* ── 앵커 (PPP / 혼용) ─── */}
          {p01.method !== 'PSP' && (<>
            <div style={{
              ...KR, fontSize: 10, color: 'var(--text-2)',
              background: '#EBF3FF', border: '1px solid #4A7FA540',
              borderLeft: '3px solid #4A7FA5',
              borderRadius: 3, padding: '5px 10px', marginBottom: 6,
            }}>
              영구앵커 — PC강연선(SWPC7B 1860급). 초기긴장 후 마찰·이완·크리프 등 PS손실 발생.
            </div>

            <FieldRow label="앵커 잔존력 산정 방식" prov={p03.C._origin.Tres_method}
              tooltip={{
                effect: '실측: Phase 02-D Lift-off Test 측정값 직접 사용. 추정: T_0 × (1−ΣΔfp) 계산',
                limit: 'Lift-off Test 실시가 원칙. 미실시 시 추정 모드 + 보수적 손실율 적용',
                source: 'KDS 11 70 15 : 2020 §5.4; PTI DC80.3-17; KDS 14 30 : 2022 §5.5',
              }}>
              <RadioGroup value={p03.C.Tres_method} onChange={v => updC('Tres_method', v)}
                options={[
                  { value: 'measured',  label: '실측 (Lift-off Test)' },
                  { value: 'estimated', label: '추정 (T_0 × (1−ΣΔfp))' },
                ]} />
            </FieldRow>

            <FieldRow label="앵커 T_0 / T_res" prov={p03.C._origin.Tres_anchor}
              tooltip={{
                effect: 'Phase 04-B 패널 휨모멘트 산정의 핵심 입력 — Phase 02-D 자동 이월',
                limit: 'T_res/T_0 ≥ 0.80: 정상 / < 0.60: 재긴장 검토',
                source: 'KDS 11 70 15 : 2020 §5.4; PTI DC80.3-12 §7',
              }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <NumInput value={p03.C.T0_anchor} onChange={v => updC('T0_anchor', v)} unit="kN" step={5} width={75} />
                <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>→</span>
                <NumInput value={p03.C.Tres_anchor} onChange={v => updC('Tres_anchor', v)} unit="kN" step={5} width={75} />
              </div>
            </FieldRow>

            {/* 앵커 추정 모드 — KDS 14 30 §5.5 6항 손실 */}
            {p03.C.Tres_method === 'estimated' && (<>
              <div style={{
                ...KR, fontSize: 10, color: 'var(--text-2)',
                background: 'var(--accent-bg)', border: '1px solid rgba(217,119,87,0.35)',
                borderRadius: 3, padding: '6px 10px', margin: '8px 0 6px',
              }}>
                KDS 14 30 §5.5 — 6항 손실율 (앵커 PC강연선 적용). 통상 합계 20~28%.
              </div>
              <LossRow label="마찰 Δfp_F" value={p03.C.loss_friction}
                onChange={v => updC('loss_friction', v)} src="§5.5.2.2" />
              <LossRow label="정착 Δfp_A" value={p03.C.loss_anchor}
                onChange={v => updC('loss_anchor', v)} src="§5.5.2.3" />
              <LossRow label="탄성 Δfp_ES" value={p03.C.loss_elastic}
                onChange={v => updC('loss_elastic', v)} src="§5.5.2.4" />
              <LossRow label="건조수축 Δfp_SH" value={p03.C.loss_shrinkage}
                onChange={v => updC('loss_shrinkage', v)} src="§5.5.2.5" />
              <LossRow label="크리프 Δfp_CR" value={p03.C.loss_creep}
                onChange={v => updC('loss_creep', v)} src="§5.5.2.6" />
              <LossRow label="릴랙세이션 Δfp_RE" value={p03.C.loss_relax}
                onChange={v => updC('loss_relax', v)} src="§5.5.2.7" />
              <DerivedRow label="총 손실율 ΣΔfp (앵커)" formula="Σ(6항)"
                value={lossTotal.toFixed(1)} unit="%"
                level={lossTotal > 35 ? 'fail' : lossTotal > 28 ? 'warn' : 'ok'} />
            </>)}

            <DerivedRow label="확정 T_res (앵커)"
              formula={p03.C.Tres_method === 'measured' ? 'Lift-off 실측' : 'T_0×(1−ΣΔfp)'}
              value={tresFinalAnchor.toFixed(1)} unit="kN" />
          </>)}

          {/* ── 네일 (PSP / 혼용) ─── */}
          {p01.method !== 'PPP' && (<>
            <div style={{
              ...KR, fontSize: 10, color: 'var(--text-2)',
              background: '#FFF3EB', border: '1px solid #D9775740',
              borderLeft: '3px solid #D97757',
              borderRadius: 3, padding: '5px 10px', marginBottom: 6,
              marginTop: p01.method !== 'PSP' ? 10 : 0,
            }}>
              소일네일 — 이형철근(SD400) 패시브 보강재. 초기긴장력 없음.
              T_res = P_d(설계 두부력) × (1 − 부식 단면감소율). Phase 02-A 부식률 자동 이월.
            </div>

            <FieldRow label="네일 P_d / T_res" prov={p03.C._origin.Tres_nail}
              tooltip={{
                effect: 'P_d: 도면의 설계 두부력(인발저항력). T_res: 부식 감소 반영 잔존력 — Phase 04-B 펀칭전단 검토 입력',
                limit: 'T_res/P_d ≥ 0.70: 정상 / < 0.50: 단면 감소 과다, 보강 검토. Lift-off Test 대상 아님',
                source: 'KDS 11 70 15 : 2020 §4.2; FHWA NHI-14-007 §4.3',
              }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <NumInput value={p03.C.Pd_nail} onChange={v => updC('Pd_nail', v)} unit="kN" step={5} width={75} />
                <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>→</span>
                <NumInput value={p03.C.Tres_nail} onChange={v => updC('Tres_nail', v)} unit="kN" step={5} width={75} />
              </div>
            </FieldRow>

            <DerivedRow label="확정 T_res (네일)"
              formula={p03.C.Tres_method === 'measured' ? '인발확인 실측' : 'P_d×(1−부식률)'}
              value={tresFinalNail.toFixed(1)} unit="kN" />
          </>)}

          {/* ══ D. 보강재 제원 ═════════════════════════════════════ */}
          <SectionHead code="D" title="보강재 제원 (네일 / 앵커)" sub="→ Phase 04-B 펀칭·휨 / 04-A 자체파괴"
            focused={focusSec === 'D'} onClick={() => setFocusSec('D')} />

          <FieldRow label="입력 모드"
            tooltip={{
              effect: '단별로 보강재 종류·제원이 다르면 단별 입력. 동일하면 전 단 동일.',
              limit: '혼용(PSP+PPP) 공법은 단별 입력 권장 (상부 네일, 하부 앵커)',
              source: '본 시스템',
            }}>
            <RadioGroup value={p03.D.tierMode}
              onChange={v => setP03(prev => ({ ...prev, D: { ...prev.D, tierMode: v } }))}
              options={[
                { value: 'uniform',  label: '전 단 동일' },
                { value: 'per-tier', label: '단별 입력' },
              ]} />
          </FieldRow>

          <ReinfTable tiers={p03.D.tiers} mode={p03.D.tierMode}
            tierMethods={p01.tierMethods}
            onCellChange={(i, k, v) => updTier<ReinfTier>('D', i, k, v)}
            onUniformChange={(k, v) =>
              setP03(prev => ({ ...prev, D: { ...prev.D, tiers: prev.D.tiers.map(t => ({ ...t, [k]: v })) } }))} />

          {/* 추가 제원 — 펀칭전단·인발 계산 필수 입력 */}
          <ReinfDetailTable tiers={p03.D.tiers} mode={p03.D.tierMode}
            onCellChange={(i, k, v) => updTier<ReinfTier>('D', i, k, v)}
            onUniformChange={(k, v) =>
              setP03(prev => ({ ...prev, D: { ...prev.D, tiers: prev.D.tiers.map(t => ({ ...t, [k]: v })) } }))} />

          {/* ══ E. 지반 정수 ════════════════════════════════════════ */}
          <SectionHead code="E" title="지반 정수" sub="→ Phase 04-A Coulomb·활동·전도·지지력"
            focused={focusSec === 'E'} onClick={() => setFocusSec('E')} />

          {/* Coulomb Ka 파라미터 요약 — Phase 01 이월값 포함 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 4, marginBottom: 10,
            background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '6px 8px',
          }}>
            {[
              { label: 'β = θ (배면경사)', value: `${p01.slopeAngle}°`, note: '← Phase 01', highlight: true },
              { label: 'α (벽면경사)', value: '90°', note: '수직벽 고정', highlight: false },
              { label: 'φ (내부마찰각)', value: `${p03.E.tiers[0]?.phi ?? '—'}°`, note: '아래 입력', highlight: false },
              { label: 'δ/φ 비', value: `${p03.E.tiers[0]?.delta_ratio ?? '—'}`, note: '아래 입력', highlight: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...KR, fontSize: 9, color: 'var(--text-3)' }}>{item.label}</span>
                <span style={{
                  ...MONO, fontSize: 12, fontWeight: 700,
                  color: item.highlight ? 'var(--accent)' : 'var(--text-1)',
                }}>{item.value}</span>
                <span style={{ ...KR, fontSize: 8, color: item.highlight ? 'var(--accent)' : 'var(--text-3)' }}>
                  {item.note}
                </span>
              </div>
            ))}
          </div>

          <FieldRow label="입력 모드"
            tooltip={{
              effect: '이질토층(상부 풍화토, 하부 연암 등)은 단별 입력. 균질토 가정이면 전 단 동일',
              limit: 'KDS 11 80 20 §4.2.1 — 토질이 단별로 다르면 별도 분석 필요',
              source: 'KDS 11 80 20 : 2020 §4.2.1',
            }}>
            <RadioGroup value={p03.E.tierMode}
              onChange={v => setP03(prev => ({ ...prev, E: { ...prev.E, tierMode: v } }))}
              options={[
                { value: 'uniform',  label: '전 단 동일' },
                { value: 'per-tier', label: '단별 입력' },
              ]} />
          </FieldRow>

          <SoilTable tiers={p03.E.tiers} mode={p03.E.tierMode}
            onCellChange={(i, k, v) => updTier<SoilTier>('E', i, k, v)}
            onUniformChange={(k, v) =>
              setP03(prev => ({ ...prev, E: { ...prev.E, tiers: prev.E.tiers.map(t => ({ ...t, [k]: v })) } }))} />

          {/* ══ F. 하중 조건 ════════════════════════════════════════ */}
          <SectionHead code="F" title="하중 조건 (상재·지하수위)" sub="→ Phase 04-A 토압·지지력"
            focused={focusSec === 'F'} onClick={() => setFocusSec('F')} />

          <FieldRow label="상재하중 종류"
            tooltip={{
              effect: 'Phase 04-A 토압 — q × Ka × h가 Pa에 가산. q=13kN/m²이면 H=5m에서 Pa 약 12% 증가',
              limit: 'DB-24 차량환산 q=13 kN/m² (KDS 24 12 21). 차도 인접 시만 적용',
              source: 'KDS 24 12 21 : 2021; AASHTO LRFD §3.11.6.4',
            }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <RadioGroup value={p03.F.q_type} onChange={v => updF('q_type', v)}
                options={[
                  { value: 'vehicle',   label: '차량 DB-24' },
                  { value: 'structure', label: '구조물' },
                  { value: 'none',      label: '없음' },
                ]} />
            </div>
          </FieldRow>

          <FieldRow label="상재하중 q" prov={p03.F._origin.q_surcharge}
            tooltip={{
              effect: 'Phase 04-A 토압 가산항: ΔPa = q·H·Ka',
              limit: '차량 13 kN/m² 표준. 건물 기초 인접 시 별도 산정',
              source: 'KDS 24 12 21 : 2021',
            }}>
            <NumInput value={p03.F.q_surcharge} onChange={v => updF('q_surcharge', v)} unit="kN/m²" step={1} />
          </FieldRow>

          <FieldRow label="지하수위 GWL (저면 기준)" prov={p03.F._origin.gwl}
            tooltip={{
              effect: 'Phase 04-A — GWL이 저면보다 위면 정수압 u = γ_w·h_w 가산. Phase 02-A 배수공 막힘률 75% 이상이면 GWL 높여 가정',
              limit: '음수(-99) = 수위 없음. 양수 = 저면으로부터 m. 측정 시점·계절 명기 필수',
              source: 'KDS 11 80 20 : 2020 §4.2.1; 시설물 안전 세부지침해설서 §4',
            }}>
            <NumInput value={p03.F.gwl} onChange={v => updF('gwl', v)} unit="m" step={0.1} min={-99} />
          </FieldRow>

          {/* ══ G. 기초부 시공현황 ══════════════════════════════════ */}
          <SectionHead code="G" title="기초부 시공현황 (레벨링 콘크리트)"
            sub="시공기록용 — 비구조부재 (무근콘크리트). 전체안정해석(SLOPE/W) 경계조건 참고값"
            focused={focusSec === 'G'} onClick={() => setFocusSec('G')} />

          <div style={{
            ...KR, fontSize: 10, color: 'var(--text-2)',
            background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '6px 10px', marginBottom: 10,
          }}>
            레벨링 콘크리트는 <strong>무근콘크리트 비구조부재</strong>로 구조 기초 검토 대상이 아닙니다.
            d_s·t_L·D_f 값은 전체안정해석(SLOPE/W) 경계조건 입력 참고값으로만 활용합니다.
            <br />
            <span style={{ color: 'var(--text-3)' }}>
              ※ KDS 11 80 20, KDS 11 70 15, FHWA NHI-14-007 어디에도 레벨링 콘크리트 기초 구조검토 조항 없음
            </span>
          </div>

          <BaseTable tiers={p03.G.tiers}
            onCellChange={(i, k, v) => updTier<BaseTier>('G', i, k, v)} />

          {/* ── 면책 ──────────────────────────────────────────────── */}
          <div style={{
            marginTop: 24, paddingTop: 12,
            borderTop: '1px solid var(--border)',
            ...KR, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6,
          }}>
            ※ Phase 03 입력값은 Phase 04 안정성 검토 계산에 직접 사용됩니다.
            본 화면의 자동 산정값(열화감소율 η, 유효 d, Σ손실율 등)은
            KDS 일반 규정 기반 추정치이며, PSP/PPP 특허 공법의 고유 가정과 다를 수 있습니다.
            '추정' 또는 '경험' 출처 뱃지가 붙은 항목은 Phase 06 보고서에서 신뢰도 낮음으로 표기됩니다.
            본 입력값과 Phase 04 결과의 최종 적정성은 진단기술사가 별도 확인하여야 합니다.
          </div>
        </div>
      </div>

      {/* ════ 우측: KDS 라이브 보드 ════ */}
      <KDSSideBoard focused={focusSec} confidence={confidence} p03={p03}
        derived={{ fckFinal, fyEff, lossTotal, tresFinalAnchor, tresFinalNail, dEff, APs }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. 도면 보유 분기 안내 배너
// ═══════════════════════════════════════════════════════════════════
function DocBranchBanner({ docStatus }: { docStatus: string }) {
  if (!docStatus || docStatus === 'full') return null
  const map: Record<string, { msg: string; level: 'warn' | 'fail' }> = {
    'drawing-only': { msg: '준공도서만 보유 — 단면·배근은 도면값 사용, 구조계산서 미보유 시 PS손실은 추정 모드 권장', level: 'warn' },
    'partial':      { msg: '일부 도면만 보유 — 누락 항목은 철근탐사·외관측정으로 추정. 출처 뱃지 \'추정\' 강제', level: 'warn' },
    'none':         { msg: '자료 없음 — 전체 추정 모드. 신뢰도 게이지 페널티 적용. 진단기술사 입회 필수', level: 'fail' },
  }
  const v = map[docStatus]
  if (!v) return null
  const c = v.level === 'fail' ? 'var(--fail)' : 'var(--warn)'
  const bg = v.level === 'fail' ? 'var(--fail-bg)' : 'var(--warn-bg)'
  return (
    <div style={{
      ...KR, fontSize: 10, color: 'var(--text-1)', fontWeight: 600,
      background: bg, border: `1px solid ${c}`, borderLeft: `3px solid ${c}`,
      borderRadius: 3, padding: '6px 10px', margin: '4px 0 12px',
    }}>
      <span style={{ ...MONO, fontSize: 9, color: c, marginRight: 6 }}>[자료분기]</span>
      {v.msg}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. PS손실 행 (단축 컴포넌트)
// ═══════════════════════════════════════════════════════════════════
function LossRow({ label, value, onChange, src }: {
  label: string; value: number; onChange: (v: number) => void; src: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '4px 0', borderBottom: '1px dotted var(--border)',
    }}>
      <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)', minWidth: 130 }}>
        {label}
      </span>
      <span style={{ ...MONO, fontSize: 8, color: 'var(--text-3)' }}>KDS 14 30 {src}</span>
      <span style={{ flex: 1 }} />
      <NumInput value={value} onChange={onChange} unit="%" step={0.5} width={70} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 7. 단별 보강재 표
// ═══════════════════════════════════════════════════════════════════
function ReinfTable({ tiers, mode, onCellChange, onUniformChange }: {
  tiers: ReinfTier[]; mode: 'uniform' | 'per-tier'
  onCellChange: (i: number, k: keyof ReinfTier, v: unknown) => void
  onUniformChange: (k: keyof ReinfTier, v: unknown) => void
  tierMethods: ('PSP'|'PPP')[]   // Phase 01에서 동기화됨 — UI 참고용
}) {
  const rows = mode === 'uniform' ? [tiers[0]] : tiers
  return (
    <div style={{ marginTop: 4, marginBottom: 12 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px 70px 60px 60px 60px 60px 60px 60px 60px 60px',
        gap: 4, marginBottom: 4,
      }}>
        {['단', '종류', 'L (m)', 'd (mm)', 't (mm)', 's_h (m)', 's_v (m)', 'α (°)', 'L_f', 'L_b'].map(h => (
          <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>
      {rows.map((t, i) => {
        if (!t) return null
        const update = (k: keyof ReinfTier, v: unknown) =>
          mode === 'uniform' ? onUniformChange(k, v) : onCellChange(i, k, v)
        const methodLabel = t.reinf_type === 'nail' ? 'PSP-네일' : 'PPP-앵커'
        const methodColor = t.reinf_type === 'nail' ? '#D97757' : '#4A7FA5'
        const methodBg    = t.reinf_type === 'nail' ? '#FFF3EB' : '#EBF3FF'
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '34px 70px 60px 60px 60px 60px 60px 60px 60px 60px',
            gap: 4, alignItems: 'center', marginBottom: 3,
          }}>
            <div style={{
              ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)',
              textAlign: 'center', background: 'var(--accent-bg)',
              border: '1px solid rgba(217,119,87,0.25)',
              borderRadius: 2, padding: '3px 0',
            }}>{mode === 'uniform' ? '전체' : i + 1}</div>
            {/* reinf_type: Phase 01 tierMethods에서 자동 결정 — 편집 불가 */}
            <div title="Phase 01 공법 설정에서 수정" style={{
              ...MONO, fontSize: 9, fontWeight: 700,
              color: methodColor, background: methodBg,
              border: `1px solid ${methodColor}`,
              borderRadius: 2, padding: '3px 4px', textAlign: 'center' as const,
            }}>{methodLabel}</div>
            <CellNum value={t.L} onChange={v => update('L', v)} step={0.5} />
            <CellNum value={t.d} onChange={v => update('d', v)} step={0.1} />
            <CellNum value={t.t_wall} onChange={v => update('t_wall', v)} step={0.5} />
            <CellNum value={t.sh} onChange={v => update('sh', v)} step={0.1} />
            <CellNum value={t.sv} onChange={v => update('sv', v)} step={0.1} />
            <CellNum value={t.alpha} onChange={v => update('alpha', v)} step={1} />
            <CellNum value={t.Lf} onChange={v => update('Lf', v)} step={0.5}
              disabled={t.reinf_type === 'nail'} />
            <CellNum value={t.Lb} onChange={v => update('Lb', v)} step={0.5} />
          </div>
        )
      })}
      <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
        그라우트 f'cg 통상 24 MPa | 네일 fy_nail: SD400=400 MPa, STK강관=350 MPa | 앵커 fpy/fpu: SWPC7B=1580/1860 MPa (KS D 7002)
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 7b. 보강재 추가 제원 표 (D_DH · c_plate · A_strand · 강도 · f'cg)
// ═══════════════════════════════════════════════════════════════════
function ReinfDetailTable({ tiers, mode, onCellChange, onUniformChange }: {
  tiers: ReinfTier[]; mode: 'uniform' | 'per-tier'
  onCellChange: (i: number, k: keyof ReinfTier, v: unknown) => void
  onUniformChange: (k: keyof ReinfTier, v: unknown) => void
}) {
  const rows = mode === 'uniform' ? [tiers[0]] : tiers
  return (
    <div style={{ marginTop: -6, marginBottom: 12 }}>
      <div style={{
        ...MONO, fontSize: 8, color: 'var(--text-3)',
        background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
        borderRadius: '0 0 3px 3px', padding: '3px 6px', marginBottom: 4,
      }}>
        ▼ 추가 제원 (펀칭전단·인발저항 계산 필수)
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px 70px 70px 70px 70px 70px 70px',
        gap: 4, marginBottom: 4,
      }}>
        {['단', 'D_DH (mm)', 'c_plate(mm)', 'A_s (mm²)', 'fy_nail(MPa)', 'fpy(MPa)', "f'cg(MPa)"].map(h => (
          <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>
      {rows.map((t, i) => {
        if (!t) return null
        const update = (k: keyof ReinfTier, v: unknown) =>
          mode === 'uniform' ? onUniformChange(k, v) : onCellChange(i, k, v)
        const isNail = t.reinf_type === 'nail'
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '34px 70px 70px 70px 70px 70px 70px',
            gap: 4, alignItems: 'center', marginBottom: 3,
          }}>
            <div style={{
              ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)',
              textAlign: 'center', background: 'var(--accent-bg)',
              border: '1px solid rgba(217,119,87,0.25)',
              borderRadius: 2, padding: '3px 0',
            }}>{mode === 'uniform' ? '전체' : i + 1}</div>
            <CellNum value={t.D_DH} onChange={v => update('D_DH', v)} step={5} />
            <CellNum value={t.c_plate} onChange={v => update('c_plate', v)} step={10} />
            {/* A_strand: 앵커 전용 — 네일은 0 고정 */}
            <CellNum value={t.A_strand} onChange={v => update('A_strand', v)} step={1}
              disabled={isNail} />
            {/* fy_nail: 네일 전용 (SD400=400) */}
            <CellNum value={t.fy_nail} onChange={v => update('fy_nail', v)} step={10}
              disabled={!isNail} />
            {/* fpy_strand: 앵커 전용 (SWPC7B=1580) */}
            <CellNum value={t.fpy_strand} onChange={v => update('fpy_strand', v)} step={10}
              disabled={isNail} />
            <CellNum value={t.fcg} onChange={v => update('fcg', v)} step={1} />
          </div>
        )
      })}
      <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
        D_DH: 천공경 (네일 90~110 mm, 앵커 100~150 mm) | c_plate: 지압판 변길이 (네일 150, 앵커 200 mm) |
        A_s: 강연선 총단면적 (앵커 전용: 2×∅15.2=277.4 mm², 3×∅15.2=416.1 mm²)
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 8. 단별 지반 표
// ═══════════════════════════════════════════════════════════════════
function SoilTable({ tiers, mode, onCellChange, onUniformChange }: {
  tiers: SoilTier[]; mode: 'uniform' | 'per-tier'
  onCellChange: (i: number, k: keyof SoilTier, v: unknown) => void
  onUniformChange: (k: keyof SoilTier, v: unknown) => void
}) {
  const rows = mode === 'uniform' ? [tiers[0]] : tiers
  return (
    <div style={{ marginTop: 4, marginBottom: 12 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px 70px 60px 60px 70px 80px 60px',
        gap: 4, marginBottom: 4,
      }}>
        {['단', 'γ (kN/m³)', 'φ (°)', 'c (kPa)', 'δ/φ', 'q_u (kPa)', 'N치'].map(h => (
          <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>
      {rows.map((t, i) => {
        if (!t) return null
        const update = (k: keyof SoilTier, v: unknown) =>
          mode === 'uniform' ? onUniformChange(k, v) : onCellChange(i, k, v)
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '34px 70px 60px 60px 70px 80px 60px',
            gap: 4, alignItems: 'center', marginBottom: 3,
          }}>
            <div style={{
              ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)',
              textAlign: 'center', background: 'var(--accent-bg)',
              border: '1px solid rgba(217,119,87,0.25)',
              borderRadius: 2, padding: '3px 0',
            }}>{mode === 'uniform' ? '전체' : i + 1}</div>
            <CellNum value={t.gamma} onChange={v => update('gamma', v)} step={0.5} />
            <CellNum value={t.phi} onChange={v => update('phi', v)} step={1} />
            <CellNum value={t.cohesion} onChange={v => update('cohesion', v)} step={1} />
            <select value={t.delta_ratio} onChange={e => update('delta_ratio', Number(e.target.value))}
              style={{ ...inputSt, fontSize: 10, padding: '3px 4px' }}>
              <option value={0.5}>1/2 φ</option>
              <option value={0.667}>2/3 φ</option>
              <option value={1.0}>1·φ</option>
            </select>
            <CellNum value={t.qu} onChange={v => update('qu', v)} step={10} />
            <CellNum value={t.N_value} onChange={v => update('N_value', v)} step={1} />
          </div>
        )
      })}
      <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
        K_s(수평지반반력계수)는 통상 30,000 kN/m³ — Phase 04에서 자동 적용. 토층 구분 필요시 단별 입력 권장
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 9. 단별 기초 표 (시공기록용 — 비구조)
// ═══════════════════════════════════════════════════════════════════
function BaseTable({ tiers, onCellChange }: {
  tiers: BaseTier[]
  onCellChange: (i: number, k: keyof BaseTier, v: unknown) => void
}) {
  return (
    <div style={{ marginTop: 4, marginBottom: 12 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '34px 80px 80px 80px',
        gap: 4, marginBottom: 4,
      }}>
        {['단', 'd_s (m)', 't_L (m)', 'D_f (m)'].map(h => (
          <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>
      {tiers.map((t, i) => {
        if (!t) return null
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '34px 80px 80px 80px',
            gap: 4, alignItems: 'center', marginBottom: 3,
          }}>
            <div style={{
              ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)',
              textAlign: 'center', background: 'var(--accent-bg)',
              border: '1px solid rgba(217,119,87,0.25)',
              borderRadius: 2, padding: '3px 0',
            }}>{i + 1}</div>
            <CellNum value={t.ds} onChange={v => onCellChange(i, 'ds', v)} step={0.01} />
            <CellNum value={t.tL} onChange={v => onCellChange(i, 'tL', v)} step={0.05} />
            <CellNum value={t.Df} onChange={v => onCellChange(i, 'Df', v)} step={0.05} />
          </div>
        )
      })}
      <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
        d_s: Phase 02-F 세굴 자동 이월 | t_L: 레벨링 콘크리트 두께 | D_f: 묻힘깊이 (SLOPE/W 경계조건 참고)
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 10. 표 셀
// ═══════════════════════════════════════════════════════════════════
function CellNum({ value, onChange, step = 1, disabled }: {
  value: number; onChange: (v: number) => void; step?: number; disabled?: boolean
}) {
  return (
    <input type="number" value={Number.isFinite(value) ? value : ''}
      step={step} disabled={disabled}
      onChange={e => {
        const v = parseFloat(e.target.value)
        onChange(Number.isFinite(v) ? v : 0)
      }}
      style={{
        ...MONO, fontSize: 10, color: disabled ? 'var(--text-3)' : 'var(--text-1)',
        background: disabled ? 'var(--bg-sidebar)' : 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 2, padding: '3px 4px', width: '100%',
        outline: 'none', textAlign: 'center', boxSizing: 'border-box',
      }} />
  )
}

// ═══════════════════════════════════════════════════════════════════
// 11. 우측 KDS 사이드 보드
// ═══════════════════════════════════════════════════════════════════
const SECTION_CITES: Record<string, { title: string; formula: string; note: string }> = {
  A: {
    title: 'KDS 14 20/14 30 §7.2 (피복·배근) / §4.2 (PS강재)',
    formula:
      'd = t − c_act − d_ps/2\nA_ps = π(d_ps/2)² × n_ps\n\nM_n = A_ps · f_ps · (d_p − a/2)\nV_n = V_c + V_s',
    note: '실측 피복 c_act가 설계 피복 c_design보다 작으면 유효깊이가 줄어 M_n이 감소합니다.',
  },
  B: {
    title: 'KDS 14 20 : 2022 §6.4 (콘크리트 강도 평가)',
    formula:
      "if  f'c ≥ 0.85·f'ck  →  설계강도 사용\nelse  보정값  f'ck' = f'c / 0.85\n\n확정 fck = 실측 우선 / 설계×(1−η)\n유효 fy = fy_design × (1 − rebar_loss/100)",
    note: "코어 압축강도가 0.85·f'ck 이상이면 설계강도를 그대로 사용 가능 (KDS 14 20 §6.4).",
  },
  C: {
    title: 'KDS 14 30 : 2022 §5.5 (PS손실)',
    formula:
      'ΣΔfp = Δfp_F + Δfp_A + Δfp_ES\n      + Δfp_SH + Δfp_CR + Δfp_RE\n\nP_eff = P_i × (1 − ΣΔfp/100)\n\n실측 모드: T_res = Lift-off 측정값',
    note: '6항 손실 통상 합계 20~28%. 30년 이상 경과 시 릴랙세이션 8% 이상 가능.',
  },
  D: {
    title: 'KDS 11 70 15 : 2020 (네일·앵커)',
    formula:
      '소일네일 길이 L_nail ≈ 0.6·H ~ 1.0·H\n앵커 자유장 L_f ≥ 4.5 m (활동면 통과)\n앵커 정착장 L_b — 안정지반 정착\n\n인발저항 P_pull = π·d·L_b·τ_g',
    note: 'L_nail < 0.6H이면 활동면을 못 넘어 무효 (FHWA NHI-14-007 §4.3).',
  },
  E: {
    title: 'KDS 11 80 20 : 2020 §4.2.1 (Coulomb 주동토압)',
    formula:
      'Pa = ½·γ·H²·Ka\n\n         sin²(α + φ)\nKa = ─────────────────────\n     sin²α·sin(α−δ)·[...]²\n\nδ = (1/2 ~ 2/3)·φ',
    note: 'δ=φ/2 → 2φ/3로 바뀌면 Ka 약 5~8% 감소. c=5kPa만 있어도 활동 FS 0.2 이상 상승.',
  },
  F: {
    title: 'KDS 11 80 20 : 2020 §4.2.1 (상재하중·지하수위)',
    formula:
      '상재하중 가산:\n  ΔPa = q · H · Ka\n\n지하수위 발생 시:\n  u = γ_w · h_w  (정수압)\n  → Phase 04-A에서 토압에 가산',
    note: '내진검토(Mononobe-Okabe)는 본 버전에서 제외. 향후 별도 모듈로 추가 예정.',
  },
  G: {
    title: '기초부 시공현황 — 비구조부재 기록',
    formula:
      'd_s : 세굴 깊이 (m) — Phase 02-F 자동 이월\nt_L : 레벨링 콘크리트 두께 (m)\nD_f : 묻힘깊이 (m)\n\n레벨링 콘크리트 = 무근콘크리트\n→ 구조 기초 검토 불가\n→ SLOPE/W 경계조건 입력 참고용',
    note: 'KDS 11 80 20, KDS 11 70 15, FHWA NHI-14-007 어느 기준서에도 레벨링 콘크리트 구조검토 조항 없음. 전체안정은 Phase 04-A (SLOPE/W 결과 입력).',
  },
}

function KDSSideBoard({ focused, confidence, p03, derived }: {
  focused: 'A'|'B'|'C'|'D'|'E'|'F'|'G'
  confidence: number
  p03: Phase03Output
  derived: {
    fckFinal: number; fyEff: number; lossTotal: number
    tresFinalAnchor: number; tresFinalNail: number
    dEff: number; APs: number
  }
}) {
  const cite = SECTION_CITES[focused]
  const confColor = confidence >= 70 ? 'var(--ok)' : confidence >= 50 ? 'var(--warn)' : 'var(--fail)'
  const confLabel = confidence >= 70 ? '신뢰도 양호' : confidence >= 50 ? '주의 (추정 다수)' : '낮음'

  return (
    <aside style={{
      width: 380, flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      overflowY: 'auto',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* 1. 현재 섹션 KDS 인용 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          padding: '6px 10px', background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-bg)', border: '1px solid var(--accent)',
            borderRadius: 2, padding: '1px 5px',
          }}>{focused}</span>
          <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>
            현재 섹션 — KDS 인용
          </span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ ...MONO, fontSize: 10, color: 'var(--text-1)', fontWeight: 600, marginBottom: 8 }}>
            {cite.title}
          </div>
          <pre style={{
            ...MONO, fontSize: 10, color: 'var(--text-1)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 2, padding: '8px 10px',
            margin: 0, overflowX: 'auto', whiteSpace: 'pre',
            lineHeight: 1.5,
          }}>{cite.formula}</pre>
          <div style={{ ...KR, fontSize: 10, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5 }}>
            {cite.note}
          </div>
        </div>
      </div>

      {/* 2. 신뢰도 게이지 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          padding: '6px 10px', background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>
            입력 신뢰도 (출처 가중평균)
          </span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            ...MONO,
          }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: confColor }}>{confidence}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>/ 100</span>
            <span style={{ flex: 1 }} />
            <span style={{ ...KR, fontSize: 10, color: confColor, fontWeight: 700 }}>{confLabel}</span>
          </div>
          <div style={{
            height: 6, marginTop: 8,
            background: 'var(--bg-sidebar)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              width: `${confidence}%`, height: '100%',
              background: confColor, transition: 'width 0.2s',
            }} />
          </div>
          <div style={{ ...KR, fontSize: 9, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
            실측=100, 도면=80, Ph02=75, 자동=70, 추정=50, 경험=30. 입력된 항목들의 가중평균.
            절대값이 아닌 참고 지표 — 보고서에는 항목별 출처표를 직접 인용하세요.
          </div>
        </div>
      </div>

      {/* 3. Phase 04로 이월될 핵심값 요약 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          padding: '6px 10px', background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>
            Phase 04 이월 핵심값
          </span>
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Summary k="확정 fck" v={`${derived.fckFinal.toFixed(1)} MPa`} />
          <Summary k="유효 fy" v={`${derived.fyEff.toFixed(0)} MPa`} />
          <Summary k="A_ps" v={`${derived.APs.toFixed(1)} mm²`} />
          <Summary k="유효 d" v={`${derived.dEff.toFixed(1)} mm`} />
          <Summary k="T_res(앵커)" v={`${derived.tresFinalAnchor.toFixed(1)} kN`} />
          <Summary k="T_res(네일)" v={`${derived.tresFinalNail.toFixed(1)} kN`} />
          <Summary k="세굴깊이(1단)"
            v={`${(p03.G.tiers[0]?.ds ?? 0).toFixed(2)} m`} />
          <Summary k="γ / φ / c"
            v={`${(p03.E.tiers[0]?.gamma ?? 0).toFixed(1)} / ${(p03.E.tiers[0]?.phi ?? 0).toFixed(0)}° / ${(p03.E.tiers[0]?.cohesion ?? 0).toFixed(0)} kPa`} />
        </div>
      </div>

    </aside>
  )
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '3px 0', borderBottom: '1px dotted var(--border)',
    }}>
      <span style={{ ...KR, fontSize: 10, color: 'var(--text-2)', flex: 1 }}>{k}</span>
      <span style={{ ...MONO, fontSize: 10, color: 'var(--text-1)', fontWeight: 600 }}>{v}</span>
    </div>
  )
}
