// ═══════════════════════════════════════════════════════════════════
// PWAS — 전역 타입 정의
// ═══════════════════════════════════════════════════════════════════

export type ModuleId = 'overview' | 'basic-info' | 'site-survey' | 'input' | 'stability' | 'grade' | 'report'

// ── 출처 뱃지 (값의 신뢰도 등급) ──────────────────────────────────
// measured  : 코어·Lift-off 등 직접 실측 (신뢰도 100)
// drawing   : 준공도면·시공기록 (신뢰도 80)
// phase02   : Phase 02 측정값 자동 이월 (신뢰도 75)
// auto      : 본 시스템 자동 산정 (신뢰도 70)
// estimated : 사용자 추정값 (신뢰도 50)
// empirical : 경험값·통상값 사용 (신뢰도 30)
// none      : 미입력 (0)
export type Provenance =
  | 'measured' | 'drawing' | 'phase02' | 'auto'
  | 'estimated' | 'empirical' | 'none'

// ── Phase 01 출력 (다른 Phase에서 참조할 핵심 제원) ───────────────
export interface Phase01Output {
  method: 'PSP' | 'PPP' | 'mixed' | ''
  construction: 'top-down' | 'bottom-up' | 'unknown' | ''
  kds: '2020' | '2016'
  docStatus: '' | 'full' | 'drawing-only' | 'partial' | 'none'
  stages: number
  slopeAngle: number
  panelHeight: number       // m
  wallThick: number         // m
  length: number            // m
  height: number            // m  (역산 H)
  tierPanels: number[]      // 단별 패널 수
  tierBerms: number[]       // 단별 소단 폭 (m)
}

// ── Phase 02 출력 (현장조사 측정값) ───────────────────────────────
// 문자열 그대로 유지 (NONE 토큰 포함). InputPanel에서 safeNum으로 변환.
export interface Phase02Output {
  // A. 외관
  crackWidth: string
  corrosionLoss: string
  scourDepth: string        // mm
  displacement: string
  drainBlock: string
  // B. NDT
  schmidt: string
  ultrasound: string
  carbonation: string
  coverDepth: string        // mm
  // C. Core
  coreFck: string           // MPa
  designFck: string         // MPa
  // D. Lift-off
  liftoffNail: string       // kN
  initNail: string
  liftoffAnchor: string
  initAnchor: string
  // E. 지반
  gamma: string
  phi: string
  cohesion: string
  groundMemo: string
  // F. 레벨링
  levelCrack: string        // mm
  levelScour: string        // mm
  settlement: string        // mm
}

// ── Phase 03 입력값 확정 ─────────────────────────────────────────
// 7개 섹션 (A: 단면·배근, B: 재료강도, C: PS잔존력, D: 보강재,
//          E: 지반정수, F: 하중조건, G: 기초폭 B)

// 출처 메타 — 각 필드별 출처를 추적
export type OriginMap<T> = { [K in keyof T]?: Provenance }
export type ConfirmMap<T> = { [K in keyof T]?: boolean }

// A. 단면·배근
export interface SectionA {
  t: number              // 패널 두께 (mm)
  b: number              // 패널 폭 B_panel (mm) — 패널 1장 실제 폭, 제조사 사양 확인. 단위 m 해석 아님.
  c_design: number       // 설계 피복 (mm)
  c_act: number          // 실측 피복 (mm)
  d_main: string         // 주철근 (예: D13)
  s_main: number         // 주철근 간격 (mm)
  ps_type: string        // PS강재 종류
  d_ps: number           // PS강재 직경 (mm)
  n_ps: number           // PS강재 개수
  _origin: OriginMap<SectionA>
  _confirmed: ConfirmMap<SectionA>
}

// B. 재료 강도
export interface SectionB {
  fck_design: number     // 설계기준강도 (MPa)
  fck_core: number       // 코어 실측 (MPa)
  fck_use: 'measured' | 'design-eta'
  eta_deg: number        // 열화감소율 (%)
  fy_design: number      // 철근 항복강도 (MPa)
  rebar_loss: number     // 부식 단면감소율 (%)
  fpy: number            // PS강재 항복 (MPa)
  fpu: number            // PS강재 인장 (MPa)
  _origin: OriginMap<SectionB>
  _confirmed: ConfirmMap<SectionB>
}

// C. PS 잔존력
export interface SectionC {
  T0_anchor: number      // kN
  T0_nail: number        // kN
  Tres_anchor: number    // kN
  Tres_nail: number      // kN
  Tres_method: 'measured' | 'estimated'
  loss_friction: number  // %
  loss_anchor: number    // %
  loss_elastic: number   // %
  loss_shrinkage: number // %
  loss_creep: number     // %
  loss_relax: number     // %
  _origin: OriginMap<SectionC>
  _confirmed: ConfirmMap<SectionC>
}

// D. 보강재 제원 (단별 입력 가능)
export interface ReinfTier {
  reinf_type: 'nail' | 'anchor'
  L: number              // 길이 (m)
  d: number              // 외경 (mm)
  t_wall: number         // 강관 두께 (mm)
  fy_steel: number       // 강관 항복 (MPa)
  sh: number             // 수평 간격 (m)
  sv: number             // 수직 간격 (m)
  alpha: number          // 경사각 (°)
  fcg: number            // 그라우트 강도 (MPa)
  Lf: number             // 자유장 (앵커, m)
  Lb: number             // 정착장 (앵커, m)
}
export interface SectionD {
  tierMode: 'uniform' | 'per-tier'
  tiers: ReinfTier[]
}

// E. 지반 정수 (단별 입력 가능)
export interface SoilTier {
  gamma: number          // kN/m³
  phi: number            // °
  cohesion: number       // kPa
  delta_ratio: 0.5 | 0.667 | 1.0
  Ks: number             // kN/m³
  qu: number             // kPa
  qu_method: 'report' | 'N-value' | 'terzaghi'
  N_value: number
}
export interface SectionE {
  tierMode: 'uniform' | 'per-tier'
  tiers: SoilTier[]
}

// F. 하중 조건 (내진검토 제외 — 향후 별도 모듈로 추가 예정)
export interface SectionF {
  q_surcharge: number       // kN/m²
  q_type: 'vehicle' | 'structure' | 'none'
  gwl: number               // m (저면 기준, -99 = 없음)
  gwl_ref: 'base' | 'top'
  _origin: OriginMap<SectionF>
}

// G. 기초 폭 B (단별)
export interface BaseTier {
  B: number                 // 기초 폭 (m)
  ds: number                // 세굴 깊이 (m)
  tL: number                // 레벨링 두께 (m)
  Df: number                // 묻힘깊이 (m)
}
export interface SectionG {
  B_mode: 'uniform' | 'per-tier'
  tiers: BaseTier[]
}

export interface Phase03Output {
  A: SectionA
  B: SectionB
  C: SectionC
  D: SectionD
  E: SectionE
  F: SectionF
  G: SectionG
}
