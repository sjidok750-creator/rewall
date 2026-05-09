// ═══════════════════════════════════════════════════════════════════
// PWAS Phase 04 — 안정성 검토 계산 엔진 (순수 TS, 부작용 없음)
//
// 적용 기준:
//   B항: KDS 11 70 15 : 2020 §4.4 (소일네일), §4.5 (영구앵커)
//   C항: KDS 14 20 : 2022 22.7 (펀칭전단), FHWA NHI-14-007 §5.4 (패널휨)
//   D항: KDS 14 30 : 2022 §4.2 (휨강도), §4.3 (전단), KDS 14 20 §4.6 (지압)
//
// 주의: 식 번호·계수는 각 기준 원문 대조 필수. 불확실 항목은 주석 [확인필요] 표시.
// ═══════════════════════════════════════════════════════════════════

// ── FS 기준값 ────────────────────────────────────────────────────
// KDS 11 70 15 : 2020 표 4.4-1 / 표 4.5-1
export const FS_REQ = {
  global_static:          1.5,   // KDS 11 80 20 §4.4
  global_seismic:         1.1,
  nail_pullout_static:    2.0,   // KDS 11 70 15 §4.4.2
  nail_pullout_seismic:   1.5,
  nail_tension_static:    1.67,  // 0.6fy 허용응력 역수
  nail_tension_seismic:   1.33,
  anchor_pullout_static:  2.5,   // KDS 11 70 15 §4.5.2 (영구앵커)
  anchor_pullout_seismic: 1.5,
  anchor_tension_static:  1.0,   // T_allow/T_res ≥ 1 (T_allow = min(0.65fpu,0.8fpy)×As)
  section_flex:           1.0,   // φMn/Mu ≥ 1 (강도설계법)
  section_shear:          1.0,
  bearing:                1.0,
} as const

// ── Coulomb Ka ──────────────────────────────────────────────────
// KDS 11 80 20 : 2020 §4.2.1
// alpha: 벽면 경사각 from horizontal (°) — PSP/PPP 통상 75~90
// phi: 내부마찰각 (°)
// deltaRatio: δ/φ (0.5, 0.667, 1.0)
// beta: 뒷면 경사각 from horizontal (°, 통상 0)
export function calcKa(phi: number, deltaRatio: number, alpha = 90, beta = 0): number {
  const deg = Math.PI / 180
  const φ = phi * deg
  const δ = phi * deltaRatio * deg
  const α = alpha * deg
  const β = beta * deg
  const sinA_phi = Math.sin(α + φ)
  const sinPhi_delta = Math.sin(φ + δ)
  const sinPhi_beta  = Math.sin(φ - β)
  const sinA_delta   = Math.sin(α - δ)
  const sinA_beta    = Math.sin(α + β)
  const denom = Math.sin(α) ** 2 * sinA_delta * (1 + Math.sqrt(sinPhi_delta * sinPhi_beta / (sinA_delta * sinA_beta))) ** 2
  return denom > 0 ? sinA_phi ** 2 / denom : 0.5
}

// ── B-1. 소일네일 인발 (KDS 11 70 15 §4.4.2) ───────────────────
export interface NailPulloutResult {
  D_DH_m: number    // 천공경 (m)
  L_b: number       // 유효결합장 (m)
  q_u: number       // 단위주면마찰저항 (kPa)
  P_ult: number     // 극한인발저항력 (kN)
  FS: number
  req: number
  pass: boolean
}
export function calcNailPullout(D_DH: number, L_b: number, q_u: number, T_res: number): NailPulloutResult {
  const D_DH_m = D_DH / 1000
  const P_ult = Math.PI * D_DH_m * L_b * q_u
  const FS = T_res > 0 ? P_ult / T_res : Infinity
  const req = FS_REQ.nail_pullout_static
  return { D_DH_m, L_b, q_u, P_ult, FS, req, pass: FS >= req }
}

// ── B-2. 소일네일 인장 (KDS 11 70 15 §4.4.1) ───────────────────
// 허용인장력 = 0.60 × fy × A_nail (KDS 11 70 15, 이형철근 기준)
export interface NailTensionResult {
  A_nail: number    // 순단면적 (mm²)
  T_allow: number   // 허용인장력 (kN)
  FS: number        // T_allow / T_res
  req: number
  pass: boolean
}
export function calcNailTension(d: number, t_wall: number, fy_nail: number, T_res: number): NailTensionResult {
  const A_nail = t_wall > 0
    ? Math.PI * ((d / 2) ** 2 - ((d - 2 * t_wall) / 2) ** 2)
    : Math.PI * (d / 2) ** 2
  const T_allow = 0.60 * fy_nail * A_nail / 1000  // kN
  const FS = T_res > 0 ? T_allow / T_res : Infinity
  const req = FS_REQ.nail_tension_static
  return { A_nail, T_allow, FS, req, pass: FS >= req }
}

// ── B-3. 영구앵커 정착부 인발 (KDS 11 70 15 §4.5.2) ────────────
// T_ult = π × D_DH × L_b × τ_u (τ_u ≈ qu from Phase 03-E)
export interface AnchorPulloutResult {
  D_DH_m: number
  L_b: number
  tau_u: number     // 단위주면마찰응력 (kPa)
  T_ult: number     // 극한인발저항력 (kN)
  FS: number
  req: number
  pass: boolean
}
export function calcAnchorPullout(D_DH: number, L_b: number, tau_u: number, T_res: number): AnchorPulloutResult {
  const D_DH_m = D_DH / 1000
  const T_ult = Math.PI * D_DH_m * L_b * tau_u
  const FS = T_res > 0 ? T_ult / T_res : Infinity
  const req = FS_REQ.anchor_pullout_static
  return { D_DH_m, L_b, tau_u, T_ult, FS, req, pass: FS >= req }
}

// ── B-4. 앵커 긴장재 인장 (KDS 11 70 15 §4.5.1) ────────────────
// 허용인장력 T_allow = min(0.65fpu, 0.80fpy) × A_strand
// [확인필요] KDS 11 70 15 §4.5.1 계수 원문 대조 필요
export interface AnchorTensionResult {
  T_allow: number   // kN
  ratio: number     // T_allow / T_res ≥ 1
  req: number
  pass: boolean
}
export function calcAnchorTension(A_strand: number, fpu: number, fpy: number, T_res: number): AnchorTensionResult {
  const T_allow = Math.min(0.65 * fpu, 0.80 * fpy) * A_strand / 1000  // kN
  const ratio = T_res > 0 ? T_allow / T_res : Infinity
  const req = FS_REQ.anchor_tension_static
  return { T_allow, ratio, req, pass: ratio >= req }
}

// ── C-1. 펀칭전단 (KDS 14 20 : 2022 §22.7) ─────────────────────
// 임계단면: 두부 지압판 외곽 d/2 외측 (정사각형 지압판 가정)
// [확인필요] KDS 14 20 22.7.2.1 식 번호 원문 대조 필요
export interface PunchingResult {
  d_eff: number     // 유효깊이 (mm)
  b_0: number       // 임계둘레 (mm)
  v_c: number       // 공칭전단강도 (MPa)
  V_n: number       // 공칭전단력 (kN)
  phi_V_n: number   // 설계전단강도 φVn (kN), φ=0.75
  V_u: number       // 소요전단력 (kN)
  ratio: number     // φVn / Vu
  pass: boolean
}
export function calcPunchingShear(
  t: number, c_act: number, d_ps: number, c_plate: number, fck: number, T_res: number
): PunchingResult {
  const d_eff = t - c_act - d_ps / 2
  const b_0 = 4 * (c_plate + d_eff)
  const beta_c = 1.0   // 정사각형 지압판
  const alpha_s = 40   // 내부지지 (interior support)
  const sqfck = Math.sqrt(fck)
  const v_c1 = (1 + 2 / beta_c) * (1 / 6) * sqfck
  const v_c2 = (alpha_s * d_eff / b_0 + 2) * (1 / 12) * sqfck
  const v_c3 = (1 / 3) * sqfck
  const v_c = Math.min(v_c1, v_c2, v_c3)
  // [단위] v_c [MPa=N/mm²] × b_0 [mm] × d_eff [mm] = N → /1000 = kN
  const V_n = v_c * b_0 * d_eff / 1000
  const phi_V_n = 0.75 * V_n
  const V_u = T_res  // 보강재 잔존력이 패널에 작용하는 집중하중
  const ratio = V_u > 0 ? phi_V_n / V_u : Infinity
  return { d_eff, b_0, v_c, V_n, phi_V_n, V_u, ratio, pass: ratio >= 1.0 }
}

// ── f_ps 산정 (KDS 14 30 : 2022 §4.2.1 식 4.2-1) ───────────────
// [확인필요] γ_p 값 원문 대조 필요
function calcFps(fpu: number, fpy: number, fck: number, rho_p: number): number {
  const ratio = fpy / fpu
  const gamma_p = ratio >= 0.90 ? 0.28 : ratio >= 0.85 ? 0.40 : 0.55
  const beta_1 = fck <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.007 * (fck - 28))
  const f_ps = fpu * (1 - (gamma_p / beta_1) * rho_p * (fpu / fck))
  return Math.min(Math.max(f_ps, 0), fpy)
}

// ── C-2. 패널 휨 (FHWA NHI-14-007 §5.4 + KDS 14 30) ────────────
// 하중모델: 보강재 두부력 → 등가분포압 q_f = T_res/(sh×sv)
// 모멘트:   1방향 근사 m_u = q_f × sh² / 8 (보수적 상한)
// 단면:     패널 PS강선 (단위폭 기준) 강도설계법
export interface PanelFlexResult {
  q_f: number       // 등가 분포압 (kN/m²)
  m_u: number       // 소요모멘트 (kN·m/m)
  A_ps_m: number    // 단위폭당 PS강선 면적 (mm²/m)
  d_p: number       // PS강선 유효깊이 (mm)
  f_ps: number      // 극한 PS강선 응력 (MPa)
  m_n: number       // 공칭 휨강도 (kN·m/m)
  phi_m_n: number   // 설계 휨강도 φMn (kN·m/m), φ=0.85
  ratio: number     // φMn / Mu
  pass: boolean
}
export function calcPanelFlex(
  T_res: number, sh: number, sv: number,
  n_ps: number, d_ps: number, panelWidth: number,
  t: number, c_act: number, fck: number, fpu: number, fpy: number
): PanelFlexResult {
  const q_f = T_res / (sh * sv)                    // kN/m²
  const m_u = q_f * sh * sh / 8                    // kN·m/m
  const A_ps_total = n_ps * Math.PI * (d_ps / 2) ** 2  // mm² per panel
  const A_ps_m = A_ps_total * 1000 / panelWidth    // mm²/m
  const d_p = t - c_act - d_ps / 2                 // mm
  const rho_p = d_p > 0 ? A_ps_m / (1000 * d_p) : 0
  const f_ps = calcFps(fpu, fpy, fck, rho_p)
  const a = 0.85 * fck * 1000 > 0 ? A_ps_m * f_ps / (0.85 * fck * 1000) : 0  // mm
  const m_n = A_ps_m * f_ps * (d_p - a / 2) / 1e6  // kN·m/m
  const phi_m_n = 0.85 * m_n
  const ratio = m_u > 0 ? phi_m_n / m_u : Infinity
  return { q_f, m_u, A_ps_m, d_p, f_ps, m_n, phi_m_n, ratio, pass: ratio >= 1.0 }
}

// ── D-1. PC패널 단면 휨강도 (KDS 14 30 : 2022 §4.2) ────────────
// 하중: Coulomb 토압 + 상재하중에 의한 패널 휨모멘트 (단별 평균 압력 × sv²/8)
export interface SectionFlexResult {
  Ka: number
  q_avg: number     // 단별 평균 수평토압 (kN/m²)
  M_u: number       // 소요 휨모멘트 (kN·m, per panel)
  A_ps: number      // 패널당 PS강선 면적 (mm²)
  d_p: number       // mm
  f_ps: number      // MPa
  a: number         // 등가응력블록 깊이 (mm)
  M_n: number       // 공칭 휨강도 (kN·m, per panel)
  phi_M_n: number   // φMn (kN·m)
  ratio: number
  pass: boolean
}
export function calcSectionFlex(
  t: number, c_act: number, d_ps: number, n_ps: number, panelWidth: number,
  fck: number, fpu: number, fpy: number,
  gamma: number, phi_deg: number, delta_ratio: number,
  slopeAngle: number,
  H: number, q_surcharge: number, sv: number
): SectionFlexResult {
  const Ka = calcKa(phi_deg, delta_ratio, slopeAngle)
  const q_avg = (gamma * H / 2 * Ka + q_surcharge * Ka)  // kN/m² (중간깊이 기준)
  const b_panel_m = panelWidth / 1000                     // m
  const M_u = q_avg * b_panel_m * sv ** 2 / 8            // kN·m per panel
  const A_ps = n_ps * Math.PI * (d_ps / 2) ** 2          // mm²
  const d_p = t - c_act - d_ps / 2                       // mm
  const rho_p = d_p > 0 && panelWidth > 0 ? A_ps / (panelWidth * d_p) : 0
  const f_ps = calcFps(fpu, fpy, fck, rho_p)
  const a = 0.85 * fck * panelWidth > 0 ? A_ps * f_ps / (0.85 * fck * panelWidth) : 0  // mm
  const M_n = A_ps * f_ps * (d_p - a / 2) / 1e6         // kN·m
  const phi_M_n = 0.85 * M_n
  const ratio = M_u > 0 ? phi_M_n / M_u : Infinity
  return { Ka, q_avg, M_u, A_ps, d_p, f_ps, a, M_n, phi_M_n, ratio, pass: ratio >= 1.0 }
}

// ── D-2. PC패널 전단강도 (KDS 14 30 : 2022 §4.3) ────────────────
// 간이식 V_c = (1/6)√fck × bw × d (PS콘크리트 최소값 근사)
// [확인필요] KDS 14 30 §4.3 V_ci/V_cw 정확식 원문 대조 필요
export interface SectionShearResult {
  Ka: number
  V_u: number       // 소요전단력 (kN, per panel)
  bw: number        // 복부폭 = 패널폭 (mm)
  d_eff: number     // 유효깊이 (mm)
  V_c: number       // 콘크리트 전단강도 (kN)
  phi_V_c: number   // φVc (kN), φ=0.75
  ratio: number
  pass: boolean
}
export function calcSectionShear(
  t: number, c_act: number, d_ps: number, panelWidth: number,
  fck: number,
  gamma: number, phi_deg: number, delta_ratio: number,
  slopeAngle: number,
  H: number, q_surcharge: number, sv: number
): SectionShearResult {
  const Ka = calcKa(phi_deg, delta_ratio, slopeAngle)
  const q_avg = (gamma * H / 2 * Ka + q_surcharge * Ka)
  const b_panel_m = panelWidth / 1000
  const V_u = q_avg * b_panel_m * sv / 2   // kN per panel (등분포하중 절반)
  const bw = panelWidth
  const d_eff = t - c_act - d_ps / 2
  const V_c = (1 / 6) * Math.sqrt(fck) * bw * d_eff / 1000  // kN
  const phi_V_c = 0.75 * V_c
  const ratio = V_u > 0 ? phi_V_c / V_u : Infinity
  return { Ka, V_u, bw, d_eff, V_c, phi_V_c, ratio, pass: ratio >= 1.0 }
}

// ── D-3. 정착부 지압응력 (KDS 14 20 : 2022 §4.6.1) ──────────────
// f_b,allow = 0.85 × fck × √(A2/A1) ≤ 1.7 × fck
// A1: 지압판 면적, A2: 30° 확산 후 동심 면적 (최대 4A1)
export interface BearingResult {
  A1: number        // 지압판 면적 (mm²)
  A2: number        // 확산 면적 (mm², ≤ 4A1)
  fb_allow: number  // 허용지압강도 (MPa)
  fb: number        // 실제 지압응력 (MPa)
  ratio: number     // fb_allow / fb
  pass: boolean
}
export function calcBearing(c_plate: number, t: number, fck: number, T_res: number): BearingResult {
  const A1 = c_plate ** 2
  const c_spread = c_plate + t              // 패널두께만큼 확산 (30° 근사)
  const A2 = Math.min(c_spread ** 2, 4 * A1)
  const fb_allow = Math.min(0.85 * fck * Math.sqrt(A2 / A1), 1.7 * fck)
  const fb = T_res > 0 ? T_res * 1000 / A1 : 0  // MPa (kN → N, /mm²)
  const ratio = fb > 0 ? fb_allow / fb : Infinity
  return { A1, A2, fb_allow, fb, ratio, pass: ratio >= 1.0 }
}

// ── 잔존력 산정 헬퍼 (Phase 03-C 값 통합) ────────────────────────
import type { Phase03Output } from '../types'

export function getTresFinalNail(p03: Phase03Output): number {
  if (p03.C.Tres_method === 'measured') return p03.C.Tres_nail
  return p03.C.Pd_nail * (1 - p03.B.rebar_loss / 100)
}

export function getTresFinalAnchor(p03: Phase03Output): number {
  const loss = p03.C.loss_friction + p03.C.loss_anchor + p03.C.loss_elastic
    + p03.C.loss_shrinkage + p03.C.loss_creep + p03.C.loss_relax
  if (p03.C.Tres_method === 'measured') return p03.C.Tres_anchor
  return p03.C.T0_anchor * (1 - loss / 100)
}

export function getFckFinal(p03: Phase03Output): number {
  if (p03.B.fck_use === 'measured' && p03.B.fck_core > 0) return p03.B.fck_core
  return p03.B.fck_design * (1 - p03.B.eta_deg / 100)
}

// ── 단별 보강재 인덱스 조회 ──────────────────────────────────────
export function getTierReinf(p03: Phase03Output, i: number) {
  return p03.D.tierMode === 'uniform' ? p03.D.tiers[0] : p03.D.tiers[i]
}
export function getTierSoil(p03: Phase03Output, i: number) {
  return p03.E.tierMode === 'uniform' ? p03.E.tiers[0] : p03.E.tiers[i]
}
