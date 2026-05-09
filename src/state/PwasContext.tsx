// ═══════════════════════════════════════════════════════════════════
// PwasContext — Phase 간 데이터 공유
//
// 설계 의도:
//   BasicInfoPanel, SiteSurveyPanel, InputPanel은 내부 useState를 유지하고
//   useEffect로 컨텍스트에 단방향 mirror publish.
//   Phase 04 StabilityPanel은 p01·p03snap·p04Manual을 read-only로 사용.
// ═══════════════════════════════════════════════════════════════════
import { createContext, useState, type ReactNode } from 'react'
import type { Phase01Output, Phase02Output, Phase03Output, Phase04Manual } from '../types'

const DEFAULT_P01: Phase01Output = {
  method: '', construction: '', kds: '2020', docStatus: '',
  stages: 4, slopeAngle: 75, panelHeight: 1.0, panelWidth: 1200, designFck: 40,
  wallThick: 0.25, length: 30, height: 8.0,
  tierPanels: [2, 2, 2, 2],
  tierBerms: [0.5, 0.5, 0.5, 0.5],
  tierMethods: ['PSP', 'PSP', 'PPP', 'PPP'],
}

const DEFAULT_P02: Phase02Output = {
  crackWidth: '', corrosionLoss: '', scourDepth: '', displacement: '', drainBlock: '',
  schmidt: '', ultrasound: '', carbonation: '', coverDepth: '',
  coreFck: '',
  liftoffNail: '', initNail: '', liftoffAnchor: '', initAnchor: '',
  gamma: '', phi: '', cohesion: '', groundMemo: '',
  levelCrack: '', levelScour: '', settlement: '',
}

const DEFAULT_P04: Phase04Manual = {
  entries: [],
  reinfIncluded: true,
}

export interface PwasState {
  p01: Phase01Output
  p02: Phase02Output
  p03snap: Phase03Output | null   // InputPanel publish snapshot
  p04Manual: Phase04Manual
  setP01: (next: Phase01Output) => void
  setP02: (next: Phase02Output) => void
  setP03snap: (next: Phase03Output) => void
  setP04Manual: (next: Phase04Manual) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const PwasCtx = createContext<PwasState | null>(null)

export function PwasProvider({ children }: { children: ReactNode }) {
  const [p01, setP01] = useState<Phase01Output>(DEFAULT_P01)
  const [p02, setP02] = useState<Phase02Output>(DEFAULT_P02)
  const [p03snap, setP03snap] = useState<Phase03Output | null>(null)
  const [p04Manual, setP04Manual] = useState<Phase04Manual>(DEFAULT_P04)

  return (
    <PwasCtx.Provider value={{ p01, p02, p03snap, p04Manual, setP01, setP02, setP03snap, setP04Manual }}>
      {children}
    </PwasCtx.Provider>
  )
}
