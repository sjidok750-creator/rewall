// ═══════════════════════════════════════════════════════════════════
// PHASE 04 — 안정성 검토 (StabilityPanel)
//
// A. 전체안정   — SLOPE/W 등 외부 결과 수동 입력
// B. 자체파괴   — 네일 인발·인장 / 앵커 인발·인장 (KDS 11 70 15)
// C. 보강재→패널 — 펀칭전단(KDS 14 20 §22.7) / 패널휨(FHWA NHI-14-007)
// D. PC패널 단면 — 휨강도(KDS 14 30 §4.2) / 전단(§4.3) / 지압(KDS 14 20 §4.6)
// ═══════════════════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { usePwas } from '../../state/usePwas'
import type { GlobalStabilityEntry } from '../../types'
import {
  FS_REQ,
  calcNailPullout, calcNailTension,
  calcAnchorPullout, calcAnchorTension,
  calcPunchingShear, calcPanelFlex,
  calcSectionFlex, calcSectionShear, calcBearing,
  getTresFinalNail, getTresFinalAnchor, getFckFinal,
  getTierReinf, getTierSoil,
} from '../../calc/stability'

const KR: React.CSSProperties   = { fontFamily: 'Pretendard, sans-serif' }
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ── 공용 스타일 ───────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  ...MONO, fontSize: 11, color: 'var(--text-1)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '3px 6px', outline: 'none',
  boxSizing: 'border-box',
}

function SectionHead({ code, title, sub }: { code: string; title: string; sub?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)',
      margin: '12px -16px 12px',
    }}>
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 700,
        color: 'var(--accent)', background: 'var(--accent-bg)',
        border: '1px solid rgba(217,119,87,0.35)',
        borderRadius: 2, padding: '2px 6px',
      }}>{code}</span>
      <span style={{ ...KR, fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
      {sub && <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>{sub}</span>}
    </div>
  )
}

// ── FS 결과 칩 ────────────────────────────────────────────────────
function FSChip({ label, fs, req, unit = '' }: { label: string; fs: number; req: number; unit?: string }) {
  const pass = fs >= req
  const color = pass ? 'var(--ok)' : 'var(--fail)'
  const bg = pass ? 'var(--ok-bg)' : 'var(--fail-bg)'
  const fsStr = Number.isFinite(fs) ? fs.toFixed(2) : '∞'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 2,
      background: bg, border: `1px solid ${color}`,
      marginBottom: 3,
    }}>
      <span style={{ ...KR, fontSize: 10, fontWeight: 600, color: 'var(--text-2)', minWidth: 140, flex: 1 }}>
        {label}
      </span>
      <span style={{ ...MONO, fontSize: 9, color: 'var(--text-3)' }}>
        req ≥ {req.toFixed(2)}
      </span>
      <span style={{
        ...MONO, fontSize: 12, fontWeight: 700, color,
        minWidth: 60, textAlign: 'right',
      }}>
        {fsStr}{unit}
      </span>
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 700,
        background: color, color: 'white',
        borderRadius: 2, padding: '1px 5px',
      }}>{pass ? 'OK' : 'NG'}</span>
    </div>
  )
}

// ── 계산 결과 행 ──────────────────────────────────────────────────
function CalcRow({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '3px 0', borderBottom: '1px dotted var(--border)',
    }}>
      <span style={{ ...KR, fontSize: 10, color: 'var(--text-2)', minWidth: 150 }}>{label}</span>
      {note && <span style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', flex: 1 }}>{note}</span>}
      <span style={{ flex: 1 }} />
      <span style={{ ...MONO, fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>
        {value}{unit && <span style={{ fontSize: 9, marginLeft: 2, fontWeight: 400 }}>{unit}</span>}
      </span>
    </div>
  )
}

// ── 단 탭 선택기 ─────────────────────────────────────────────────
function TierTabs({ stages, selected, onChange }: {
  stages: number; selected: number; onChange: (i: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {Array.from({ length: stages }, (_, i) => (
        <button key={i} onClick={() => onChange(i)} style={{
          ...MONO, fontSize: 10, fontWeight: 700,
          padding: '3px 10px', borderRadius: 2,
          border: selected === i ? '1px solid var(--accent)' : '1px solid var(--border)',
          background: selected === i ? 'var(--accent-bg)' : 'var(--bg)',
          color: selected === i ? 'var(--accent)' : 'var(--text-2)',
          cursor: 'pointer',
        }}>
          {i + 1}단
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════════
export default function StabilityPanel() {
  const { p01, p03snap, p04Manual, setP04Manual } = usePwas()
  const [selTier, setSelTier] = useState(0)
  const [newEntry, setNewEntry] = useState<Omit<GlobalStabilityEntry, 'FS_static' | 'FS_seismic'> & { FS_static: string; FS_seismic: string }>({
    sta: '', program: 'SLOPE/W', method: 'Bishop', FS_static: '', FS_seismic: '-1', remark: '',
  })

  const p03 = p03snap
  const stages = p01.stages || 1
  const safeSelTier = Math.min(selTier, stages - 1)

  // ── 계산 (useMemo — p03snap 변경 시 자동 재계산) ─────────────────
  const calc = useMemo(() => {
    if (!p03) return null

    const fck = getFckFinal(p03)
    const tresFinalNail = getTresFinalNail(p03)
    const tresFinalAnchor = getTresFinalAnchor(p03)

    const tiers = Array.from({ length: stages }, (_, i) => {
      const reinf = getTierReinf(p03, i)
      const soil  = getTierSoil(p03, i)
      if (!reinf || !soil) return null

      const isNail = reinf.reinf_type === 'nail'
      const T_res  = isNail ? tresFinalNail : tresFinalAnchor

      // B. 자체파괴
      const B_pullout = isNail
        ? calcNailPullout(reinf.D_DH, reinf.Lb, soil.qu, T_res)
        : calcAnchorPullout(reinf.D_DH, reinf.Lb, soil.qu, T_res)
      const B_tension = isNail
        ? calcNailTension(reinf.d, reinf.t_wall, reinf.fy_nail, T_res)
        : calcAnchorTension(reinf.A_strand, p03.B.fpu, p03.B.fpy, T_res)

      // C. 보강재→패널
      const C_punch = calcPunchingShear(p03.A.t, p03.A.c_act, p03.A.d_ps, reinf.c_plate, fck, T_res)
      const C_flex  = calcPanelFlex(T_res, reinf.sh, reinf.sv, p03.A.n_ps, p03.A.d_ps, p03.A.b, p03.A.t, p03.A.c_act, fck, p03.B.fpu, p03.B.fpy)

      return { isNail, T_res, reinf, soil, B_pullout, B_tension, C_punch, C_flex }
    })

    // D. PC패널 단면 (대표 단 = safeSelTier 이지만 전체 계산 후 표시)
    // 첫 단 기준으로 계산 (H = 전체 높이, q = 상재)
    const repSoil  = getTierSoil(p03, 0)
    const repReinf = getTierReinf(p03, 0)
    const D_flex  = repSoil && repReinf ? calcSectionFlex(
      p03.A.t, p03.A.c_act, p03.A.d_ps, p03.A.n_ps, p03.A.b,
      fck, p03.B.fpu, p03.B.fpy,
      repSoil.gamma, repSoil.phi, repSoil.delta_ratio,
      p01.slopeAngle, p01.height, p03.F.q_surcharge, repReinf.sv,
    ) : null
    const D_shear = repSoil && repReinf ? calcSectionShear(
      p03.A.t, p03.A.c_act, p03.A.d_ps, p03.A.b,
      fck,
      repSoil.gamma, repSoil.phi, repSoil.delta_ratio,
      p01.slopeAngle, p01.height, p03.F.q_surcharge, repReinf.sv,
    ) : null
    // Bearing: 대표 잔존력 (네일/앵커 혼용 시 첫 단 기준)
    const repIsNail = repReinf?.reinf_type === 'nail'
    const repTres = repIsNail ? tresFinalNail : tresFinalAnchor
    const D_bearing = repReinf ? calcBearing(repReinf.c_plate, p03.A.t, fck, repTres) : null

    return { fck, tresFinalNail, tresFinalAnchor, tiers, D_flex, D_shear, D_bearing }
  }, [p03, stages, p01.slopeAngle, p01.height])

  const tierCalc = calc?.tiers[safeSelTier]

  // ── Section A 입력 핸들러 ─────────────────────────────────────────
  function addEntry() {
    const fs_s = parseFloat(newEntry.FS_static)
    const fs_q = parseFloat(newEntry.FS_seismic)
    if (!newEntry.sta || !Number.isFinite(fs_s)) return
    setP04Manual({
      ...p04Manual,
      entries: [...p04Manual.entries, {
        ...newEntry,
        FS_static: fs_s,
        FS_seismic: Number.isFinite(fs_q) ? fs_q : -1,
      }],
    })
    setNewEntry({ sta: '', program: 'SLOPE/W', method: 'Bishop', FS_static: '', FS_seismic: '-1', remark: '' })
  }

  function deleteEntry(idx: number) {
    setP04Manual({ ...p04Manual, entries: p04Manual.entries.filter((_, i) => i !== idx) })
  }

  // ── 우측 요약용 전체 pass 여부 ────────────────────────────────────
  const summary = useMemo(() => {
    const items: { label: string; fs: number; req: number; tier?: number }[] = []
    if (!calc) return items

    // A. 전체안정
    p04Manual.entries.forEach((e, i) => {
      items.push({ label: `A. 전체안정 ${e.sta} 평상시`, fs: e.FS_static, req: FS_REQ.global_static, tier: i })
      if (e.FS_seismic > 0)
        items.push({ label: `A. 전체안정 ${e.sta} 지진시`, fs: e.FS_seismic, req: FS_REQ.global_seismic, tier: i })
    })

    // B,C per tier
    calc.tiers.forEach((t, i) => {
      if (!t) return
      const ti = i + 1
      if (t.isNail) {
        items.push({ label: `B-1. ${ti}단 네일 인발 FS`, fs: (t.B_pullout as ReturnType<typeof calcNailPullout>).FS, req: FS_REQ.nail_pullout_static, tier: i })
        items.push({ label: `B-2. ${ti}단 네일 인장 FS`, fs: (t.B_tension as ReturnType<typeof calcNailTension>).FS, req: FS_REQ.nail_tension_static, tier: i })
      } else {
        items.push({ label: `B-3. ${ti}단 앵커 인발 FS`, fs: (t.B_pullout as ReturnType<typeof calcAnchorPullout>).FS, req: FS_REQ.anchor_pullout_static, tier: i })
        items.push({ label: `B-4. ${ti}단 앵커 인장 비`, fs: (t.B_tension as ReturnType<typeof calcAnchorTension>).ratio, req: FS_REQ.anchor_tension_static, tier: i })
      }
      items.push({ label: `C-1. ${ti}단 펀칭전단 φVn/Vu`, fs: t.C_punch.ratio, req: 1.0, tier: i })
      items.push({ label: `C-2. ${ti}단 패널휨 φMn/Mu`, fs: t.C_flex.ratio, req: 1.0, tier: i })
    })

    // D
    if (calc.D_flex)   items.push({ label: 'D-1. 단면 휨 φMn/Mu',  fs: calc.D_flex.ratio,    req: 1.0 })
    if (calc.D_shear)  items.push({ label: 'D-2. 단면 전단 φVc/Vu', fs: calc.D_shear.ratio,   req: 1.0 })
    if (calc.D_bearing) items.push({ label: 'D-3. 지압 f_b,allow/f_b', fs: calc.D_bearing.ratio, req: 1.0 })

    return items
  }, [calc, p04Manual])

  const passCount = summary.filter(s => s.fs >= s.req).length
  const totalCount = summary.length

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ════ 좌측: 섹션 A·B·C·D ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* 탭 타이틀 */}
        <div style={{
          padding: '10px 16px 8px', borderBottom: '2px solid var(--border)',
          display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0,
          background: 'var(--bg-panel)',
        }}>
          <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>PHASE 04</span>
          <span style={{ ...KR, fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>안정성 검토</span>
          <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>
            KDS 11 70 15 / KDS 14 20·30 / FHWA NHI-14-007 기준
          </span>
        </div>

        {!p03 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...KR, fontSize: 13, color: 'var(--text-3)',
          }}>
            Phase 03 입력값 확정 탭에서 입력값을 먼저 확정하세요.
          </div>
        )}

        {p03 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>

            {/* ═══ A. 전체안정 (외부 프로그램 결과 수동 입력) ═══════════ */}
            <SectionHead code="A" title="전체안정 (원호파괴 등)"
              sub="SLOPE/W 등 외부 해석 결과 수동 입력 — KDS 11 80 20 §4.4" />

            <div style={{
              ...KR, fontSize: 10, color: 'var(--text-2)',
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
              borderRadius: 3, padding: '6px 10px', marginBottom: 10,
            }}>
              전체안정(원호·쐐기파괴)은 본 프로그램이 직접 계산하지 않습니다.
              SLOPE/W, TALREN, GeoSlope 등 외부 프로그램 해석 결과를 아래에 단면별로 입력하세요.
              <br />
              <span style={{ color: 'var(--text-3)' }}>기준: 평상시 FS ≥ 1.5, 지진시 FS ≥ 1.1 (KDS 11 80 20 §4.4)</span>
            </div>

            {/* 보강재 저항력 반영 여부 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 0', borderBottom: '1px solid var(--border)', marginBottom: 10,
            }}>
              <span style={{ ...KR, fontSize: 11, fontWeight: 600, color: 'var(--text-2)', flex: 1 }}>
                보강재 저항력 반영 여부
              </span>
              {(['포함', '미포함'] as const).map((lbl, idx) => {
                const checked = idx === 0 ? p04Manual.reinfIncluded : !p04Manual.reinfIncluded
                return (
                  <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="radio" checked={checked}
                      onChange={() => setP04Manual({ ...p04Manual, reinfIncluded: idx === 0 })} />
                    <span style={{ ...KR, fontSize: 11, color: 'var(--text-2)' }}>{lbl}</span>
                  </label>
                )
              })}
            </div>

            {/* 기존 항목 표 */}
            {p04Manual.entries.length > 0 && (
              <div style={{ marginBottom: 10, overflowX: 'auto' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 80px 80px 70px 70px 1fr 30px',
                  gap: 4, marginBottom: 3,
                }}>
                  {['단면위치', '프로그램', '해석방법', 'FS 평상시', 'FS 지진시', '비고', ''].map(h => (
                    <div key={h} style={{ ...MONO, fontSize: 8, color: 'var(--text-3)' }}>{h}</div>
                  ))}
                </div>
                {p04Manual.entries.map((e, i) => {
                  const passS = e.FS_static >= FS_REQ.global_static
                  const passQ = e.FS_seismic < 0 || e.FS_seismic >= FS_REQ.global_seismic
                  return (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 80px 80px 70px 70px 1fr 30px',
                      gap: 4, alignItems: 'center', marginBottom: 3,
                      padding: '3px 0', borderBottom: '1px dotted var(--border)',
                    }}>
                      <span style={{ ...MONO, fontSize: 10 }}>{e.sta}</span>
                      <span style={{ ...MONO, fontSize: 9, color: 'var(--text-3)' }}>{e.program}</span>
                      <span style={{ ...MONO, fontSize: 9, color: 'var(--text-3)' }}>{e.method}</span>
                      <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: passS ? 'var(--ok)' : 'var(--fail)' }}>
                        {e.FS_static.toFixed(3)}
                      </span>
                      <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: passQ ? 'var(--ok)' : 'var(--fail)' }}>
                        {e.FS_seismic < 0 ? '—' : e.FS_seismic.toFixed(3)}
                      </span>
                      <span style={{ ...KR, fontSize: 9, color: 'var(--text-3)' }}>{e.remark}</span>
                      <button onClick={() => deleteEntry(i)} style={{
                        ...MONO, fontSize: 9, background: 'none', border: '1px solid var(--border)',
                        borderRadius: 2, padding: '2px 5px', cursor: 'pointer', color: 'var(--fail)',
                      }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 신규 입력 행 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 80px 80px 70px 70px 1fr 50px',
              gap: 4, alignItems: 'center',
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
              borderRadius: 3, padding: '6px 6px',
            }}>
              <input placeholder="Sta.0+020" value={newEntry.sta}
                onChange={e => setNewEntry(p => ({ ...p, sta: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <input placeholder="SLOPE/W" value={newEntry.program}
                onChange={e => setNewEntry(p => ({ ...p, program: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <input placeholder="Bishop" value={newEntry.method}
                onChange={e => setNewEntry(p => ({ ...p, method: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <input type="number" step={0.001} placeholder="1.500" value={newEntry.FS_static}
                onChange={e => setNewEntry(p => ({ ...p, FS_static: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <input type="number" step={0.001} placeholder="-1" value={newEntry.FS_seismic}
                onChange={e => setNewEntry(p => ({ ...p, FS_seismic: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <input placeholder="비고" value={newEntry.remark}
                onChange={e => setNewEntry(p => ({ ...p, remark: e.target.value }))}
                style={{ ...inputSt, width: '100%' }} />
              <button onClick={addEntry} style={{
                ...KR, fontSize: 10, fontWeight: 700,
                background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 2, padding: '4px 8px', cursor: 'pointer',
              }}>추가</button>
            </div>
            <div style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', marginTop: 4 }}>
              FS 지진시 = -1 입력 시 미검토로 처리. 평상시 FS ≥ {FS_REQ.global_static}, 지진시 FS ≥ {FS_REQ.global_seismic}
            </div>

            {/* ═══ B. 자체파괴 (네일·앵커 인발·인장) ═══════════════════ */}
            <SectionHead code="B" title="자체파괴 (보강재 인발·인장)"
              sub="KDS 11 70 15 : 2020 §4.4 (네일) / §4.5 (앵커)" />

            <TierTabs stages={stages} selected={safeSelTier} onChange={setSelTier} />

            {tierCalc && (() => {
              const t = tierCalc
              const ti = safeSelTier + 1
              const isNail = t.isNail
              const pullout = t.B_pullout
              const tension = t.B_tension

              return (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                }}>
                  {/* 인발 */}
                  <div style={{
                    border: '1px solid var(--border)', borderRadius: 3,
                    padding: '8px 10px',
                    borderLeft: `3px solid ${isNail ? '#D97757' : '#4A7FA5'}`,
                  }}>
                    <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: isNail ? '#D97757' : '#4A7FA5', marginBottom: 6 }}>
                      {isNail ? `B-1. ${ti}단 소일네일 인발 (KDS 11 70 15 §4.4.2)` : `B-3. ${ti}단 영구앵커 인발 (KDS 11 70 15 §4.5.2)`}
                    </div>
                    <CalcRow label="천공경 D_DH" value={t.reinf.D_DH.toFixed(0)} unit="mm" />
                    <CalcRow label="유효결합장 L_b" value={t.reinf.Lb.toFixed(1)} unit="m" />
                    <CalcRow label="단위마찰저항 q_u" value={t.soil.qu.toFixed(0)} unit="kPa" note="Phase 03-E" />
                    <CalcRow label="잔존력 T_res" value={t.T_res.toFixed(1)} unit="kN" />
                    <CalcRow label="극한저항력 P_ult = π·D_DH·L_b·q_u"
                      value={isNail
                        ? (pullout as ReturnType<typeof calcNailPullout>).P_ult.toFixed(1)
                        : (pullout as ReturnType<typeof calcAnchorPullout>).T_ult.toFixed(1)}
                      unit="kN" />
                    <div style={{ marginTop: 6 }}>
                      <FSChip
                        label={isNail ? 'FS 인발 = P_ult / T_res' : 'FS 인발 = T_ult / T_res'}
                        fs={'FS' in pullout ? pullout.FS : 0}
                        req={pullout.req}
                      />
                    </div>
                  </div>

                  {/* 인장 */}
                  <div style={{
                    border: '1px solid var(--border)', borderRadius: 3,
                    padding: '8px 10px',
                    borderLeft: `3px solid ${isNail ? '#D97757' : '#4A7FA5'}`,
                  }}>
                    <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: isNail ? '#D97757' : '#4A7FA5', marginBottom: 6 }}>
                      {isNail ? `B-2. ${ti}단 소일네일 인장 (KDS 11 70 15 §4.4.1)` : `B-4. ${ti}단 영구앵커 인장 (KDS 11 70 15 §4.5.1)`}
                    </div>
                    {isNail ? (() => {
                      const r = tension as ReturnType<typeof calcNailTension>
                      return <>
                        <CalcRow label="네일 단면적 A_nail" value={r.A_nail.toFixed(1)} unit="mm²" note="순단면 (t_wall 반영)" />
                        <CalcRow label="항복강도 fy" value={t.reinf.fy_nail.toFixed(0)} unit="MPa" />
                        <CalcRow label="허용인장력 T_allow = 0.60·fy·A" value={r.T_allow.toFixed(1)} unit="kN" />
                        <CalcRow label="잔존력 T_res" value={t.T_res.toFixed(1)} unit="kN" />
                        <div style={{ marginTop: 6 }}>
                          <FSChip label="FS 인장 = T_allow / T_res" fs={r.FS} req={r.req} />
                        </div>
                      </>
                    })() : (() => {
                      const r = tension as ReturnType<typeof calcAnchorTension>
                      return <>
                        <CalcRow label="강연선 총단면적 A_strand" value={t.reinf.A_strand.toFixed(1)} unit="mm²" />
                        <CalcRow label="허용인장력 T_allow = min(0.65fpu,0.80fpy)·A" value={r.T_allow.toFixed(1)} unit="kN" />
                        <CalcRow label="잔존력 T_res" value={t.T_res.toFixed(1)} unit="kN" />
                        <div style={{ marginTop: 6 }}>
                          <FSChip label="T_allow / T_res" fs={r.ratio} req={r.req} />
                        </div>
                      </>
                    })()}
                  </div>
                </div>
              )
            })()}

            {/* ═══ C. 보강재→패널 (펀칭전단·패널휨) ══════════════════ */}
            <SectionHead code="C" title="보강재 → 패널 전달 검토"
              sub="KDS 14 20 §22.7 (펀칭전단) · FHWA NHI-14-007 §5.4 (패널휨)" />

            <TierTabs stages={stages} selected={safeSelTier} onChange={setSelTier} />

            {tierCalc && (() => {
              const t = tierCalc
              const ti = safeSelTier + 1
              const cp = t.C_punch
              const cf = t.C_flex
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* 펀칭전단 */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px' }}>
                    <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                      C-1. {ti}단 펀칭전단 — KDS 14 20 : 2022 §22.7
                    </div>
                    <CalcRow label="유효깊이 d_eff = t−c−D_ps/2" value={cp.d_eff.toFixed(1)} unit="mm" />
                    <CalcRow label="임계둘레 b_0 = 4(c_plate+d_eff)" value={cp.b_0.toFixed(1)} unit="mm" />
                    <CalcRow label="콘크리트 강도 fck (열화반영)" value={calc!.fck.toFixed(1)} unit="MPa" />
                    <CalcRow label="공칭전단강도 v_c" value={cp.v_c.toFixed(3)} unit="MPa" />
                    <CalcRow label="φVn = 0.75·v_c·b_0·d_eff" value={cp.phi_V_n.toFixed(1)} unit="kN" />
                    <CalcRow label="소요전단력 Vu = T_res" value={cp.V_u.toFixed(1)} unit="kN" />
                    <div style={{ marginTop: 6 }}>
                      <FSChip label="C-1. φVn / Vu" fs={cp.ratio} req={1.0} />
                    </div>
                  </div>

                  {/* 패널 휨 */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px' }}>
                    <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                      C-2. {ti}단 패널 휨 — FHWA NHI-14-007 §5.4
                    </div>
                    <CalcRow label="등가분포압 q_f = T_res/(sh·sv)" value={cf.q_f.toFixed(2)} unit="kN/m²" />
                    <CalcRow label="소요모멘트 Mu = q_f·sh²/8" value={cf.m_u.toFixed(3)} unit="kN·m/m" />
                    <CalcRow label="단위폭 강선량 A_ps/m" value={cf.A_ps_m.toFixed(1)} unit="mm²/m" />
                    <CalcRow label="극한응력 f_ps" value={cf.f_ps.toFixed(0)} unit="MPa" />
                    <CalcRow label="φMn = 0.85·Mn" value={cf.phi_m_n.toFixed(3)} unit="kN·m/m" />
                    <div style={{ marginTop: 6 }}>
                      <FSChip label="C-2. φMn / Mu" fs={cf.ratio} req={1.0} />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ═══ D. PC패널 단면 검토 ══════════════════════════════════ */}
            <SectionHead code="D" title="PC패널 단면 검토"
              sub="KDS 14 30 : 2022 §4.2 (휨) / §4.3 (전단) · KDS 14 20 : 2022 §4.6 (지압)" />

            <div style={{
              ...KR, fontSize: 10, color: 'var(--text-2)',
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
              borderRadius: 3, padding: '6px 10px', marginBottom: 10,
            }}>
              Coulomb 토압 기반 패널 휨·전단 산정 (H={p01.height} m, q={p03.F.q_surcharge} kN/m²). 대표 단 (1단) 지반정수·보강재 제원 사용.
              <br />
              <span style={{ color: 'var(--text-3)' }}>단별 지반·제원 차이가 큰 경우 단별 입력 탭에서 per-tier 계산 권장.</span>
            </div>

            {calc && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* D-1 휨 */}
                {calc.D_flex && (() => {
                  const r = calc.D_flex!
                  return (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px' }}>
                      <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                        D-1. 휨강도 — KDS 14 30 §4.2
                      </div>
                      <CalcRow label="Ka (Coulomb)" value={r.Ka.toFixed(4)} note="KDS 11 80 20 §4.2.1" />
                      <CalcRow label="평균수평토압 q_avg" value={r.q_avg.toFixed(2)} unit="kN/m²" />
                      <CalcRow label="소요모멘트 Mu" value={r.M_u.toFixed(3)} unit="kN·m" />
                      <CalcRow label="극한응력 f_ps" value={r.f_ps.toFixed(0)} unit="MPa" />
                      <CalcRow label="φMn = 0.85·Mn" value={r.phi_M_n.toFixed(3)} unit="kN·m" />
                      <div style={{ marginTop: 6 }}>
                        <FSChip label="D-1. φMn / Mu" fs={r.ratio} req={1.0} />
                      </div>
                    </div>
                  )
                })()}

                {/* D-2 전단 */}
                {calc.D_shear && (() => {
                  const r = calc.D_shear!
                  return (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px' }}>
                      <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                        D-2. 전단강도 — KDS 14 30 §4.3
                      </div>
                      <CalcRow label="소요전단력 Vu" value={r.V_u.toFixed(3)} unit="kN" />
                      <CalcRow label="복부폭 bw" value={r.bw.toFixed(0)} unit="mm" />
                      <CalcRow label="유효깊이 d_eff" value={r.d_eff.toFixed(1)} unit="mm" />
                      <CalcRow label="Vc = (1/6)√fck·bw·d" value={r.V_c.toFixed(1)} unit="kN" />
                      <CalcRow label="φVc = 0.75·Vc" value={r.phi_V_c.toFixed(1)} unit="kN" />
                      <div style={{ marginTop: 6 }}>
                        <FSChip label="D-2. φVc / Vu" fs={r.ratio} req={1.0} />
                      </div>
                    </div>
                  )
                })()}

                {/* D-3 지압 */}
                {calc.D_bearing && (() => {
                  const r = calc.D_bearing!
                  return (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '8px 10px' }}>
                      <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                        D-3. 지압 — KDS 14 20 §4.6
                      </div>
                      <CalcRow label="지압판 면적 A1" value={r.A1.toFixed(0)} unit="mm²" />
                      <CalcRow label="확산 면적 A2 (≤4A1)" value={r.A2.toFixed(0)} unit="mm²" />
                      <CalcRow label="허용지압강도 f_b,allow" value={r.fb_allow.toFixed(2)} unit="MPa" />
                      <CalcRow label="실제 지압응력 f_b" value={r.fb.toFixed(3)} unit="MPa" />
                      <div style={{ marginTop: 6 }}>
                        <FSChip label="D-3. f_b,allow / f_b" fs={r.ratio} req={1.0} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── 면책 ──────────────────────────────────────────────── */}
            <div style={{
              marginTop: 24, paddingTop: 12,
              borderTop: '1px solid var(--border)',
              ...KR, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6,
            }}>
              [확인필요] KDS 14 30 §4.3 전단강도 — 정확식 V_ci/V_cw 대신 간이식 (1/6)√fck·bw·d 적용 (보수적 하한값).
              본 계산 결과는 입력값 및 KDS 조항 해석에 따라 달라질 수 있으며, 최종 적정성은 진단기술사가 확인하여야 합니다.
            </div>

          </div>
        )}
      </div>

      {/* ════ 우측: FS 종합 판정 ════ */}
      <div style={{
        width: 280, flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
        }}>
          <div style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>FS SUMMARY</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
          }}>
            <span style={{
              ...MONO, fontSize: 20, fontWeight: 700,
              color: passCount === totalCount ? 'var(--ok)' : 'var(--fail)',
            }}>
              {passCount}/{totalCount}
            </span>
            <span style={{ ...KR, fontSize: 10, color: 'var(--text-3)' }}>항목 통과</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {!p03 && (
            <div style={{ ...KR, fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>
              Phase 03 입력 후 표시
            </div>
          )}
          {summary.map((s, i) => {
            const pass = s.fs >= s.req
            const color = pass ? 'var(--ok)' : 'var(--fail)'
            const fsStr = Number.isFinite(s.fs) ? s.fs.toFixed(3) : '∞'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 0', borderBottom: '1px dotted var(--border)',
              }}>
                <span style={{
                  ...MONO, fontSize: 8, fontWeight: 700, color,
                  background: pass ? 'var(--ok-bg)' : 'var(--fail-bg)',
                  border: `1px solid ${color}`,
                  borderRadius: 2, padding: '1px 4px', flexShrink: 0,
                }}>{pass ? 'OK' : 'NG'}</span>
                <span style={{ ...KR, fontSize: 9, color: 'var(--text-2)', flex: 1, lineHeight: 1.3 }}>
                  {s.label}
                </span>
                <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
                  {fsStr}
                </span>
              </div>
            )
          })}
          {summary.length === 0 && p03 && (
            <div style={{ ...KR, fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>
              Phase 03 입력값 확인 후 결과 표시
            </div>
          )}

          {/* KDS 기준 범례 */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ ...MONO, fontSize: 8, color: 'var(--text-3)', marginBottom: 6 }}>적용 기준</div>
            {[
              ['A. 전체안정', `FS ≥ ${FS_REQ.global_static} / ${FS_REQ.global_seismic}`, 'KDS 11 80 20 §4.4'],
              ['B-1. 네일 인발', `FS ≥ ${FS_REQ.nail_pullout_static}`, 'KDS 11 70 15 §4.4.2'],
              ['B-2. 네일 인장', `FS ≥ ${FS_REQ.nail_tension_static}`, 'KDS 11 70 15 §4.4.1'],
              ['B-3. 앵커 인발', `FS ≥ ${FS_REQ.anchor_pullout_static}`, 'KDS 11 70 15 §4.5.2'],
              ['B-4. 앵커 인장', `비 ≥ ${FS_REQ.anchor_tension_static}`, 'KDS 11 70 15 §4.5.1'],
              ['C. 보강재→패널', 'φR/S ≥ 1.0', 'KDS 14 20 §22.7'],
              ['D. 단면검토', 'φR/S ≥ 1.0', 'KDS 14 30 §4.2~4.3'],
            ].map(([item, req, src]) => (
              <div key={item} style={{
                display: 'flex', flexDirection: 'column', gap: 1,
                padding: '3px 0', borderBottom: '1px dotted var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...KR, fontSize: 9, color: 'var(--text-2)', fontWeight: 600 }}>{item}</span>
                  <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>{req}</span>
                </div>
                <span style={{ ...MONO, fontSize: 7, color: 'var(--text-3)' }}>{src}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
