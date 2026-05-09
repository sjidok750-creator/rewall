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
  panelHeight: number       // m — 단별 공통 패널 1장 높이
  panelWidth: number        // mm — 패널 폭 B_panel (제조사 사양, Phase 03-A b와 동기화)
  designFck: number         // MPa — 설계기준강도 (도면 확인값, Phase 03-B fck_design과 동기화)
  wallThick: number         // m
  length: number            // m
  height: number            // m  (역산 H)
  tierPanels: number[]            // 단별 패널 수
  tierBerms: number[]             // 단별 소단 폭 (m)
  tierMethods: ('PSP'|'PPP')[]   // 단별 공법 (혼용 시 단마다 다름; 비혼용 시 전단 동일)
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
  // designFck는 Phase 01에서 관리 (도면 확인값 — 현장 측정값 아님)
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
// Tres_method / 6항 손실은 앵커(PC강연선) 전용.
// 네일(이형철근)은 초기긴장력 없음 → Pd_nail(설계 두부력)과 부식 단면감소율만 사용.
export interface SectionC {
  T0_anchor: number      // kN — 앵커 초기긴장력 (시공기록)
  Pd_nail: number        // kN — 네일 설계 두부력/인발저항력 (초기긴장력 아님)
  Tres_anchor: number    // kN
  Tres_nail: number      // kN
  Tres_method: 'measured' | 'estimated'  // 앵커 전용
  loss_friction: number  // % — 앵커 전용
  loss_anchor: number    // % — 앵커 전용
  loss_elastic: number   // % — 앵커 전용
  loss_shrinkage: number // % — 앵커 전용
  loss_creep: number     // % — 앵커 전용
  loss_relax: number     // % — 앵커 전용
  _origin: OriginMap<SectionC>
  _confirmed: ConfirmMap<SectionC>
}

// D. 보강재 제원 (단별 입력 가능)
export interface ReinfTier {
  reinf_type: 'nail' | 'anchor'
  L: number              // 길이 (m)
  d: number              // 외경 (mm)
  t_wall: number         // 강관 두께 (mm) — 강관네일 전용
  fy_nail: number        // 이형철근/강관 항복강도 (MPa) — 네일 전용 (SD400: 400)
  fpy_strand: number     // PC강연선 항복강도 (MPa) — 앵커 전용 (1580)
  fpu_strand: number     // PC강연선 인장강도 (MPa) — 앵커 전용 (1860)
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

// G. 기초부 시공현황 (레벨링 콘크리트 — 비구조부재, 시공기록용)
// 레벨링 콘크리트는 무근콘크리트로 구조기초 검토 대상이 아님.
// ds·tL·Df는 전체안정해석(SLOPE/W) 경계조건 입력 참고값으로만 사용.
export interface BaseTier {
  ds: number                // 세굴 깊이 (m) — Phase 02 자동 이월
  tL: number                // 레벨링 두께 (m)
  Df: number                // 묻힘깊이 (m)
}
export interface SectionG {
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
