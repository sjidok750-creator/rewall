// ═══════════════════════════════════════════════════════════════════
// PwasContext — Phase 간 데이터 공유 (Phase 01·02 mirror → Phase 03 이월)
//
// 설계 의도:
//   기존 BasicInfoPanel, SiteSurveyPanel은 내부 useState를 그대로 유지하고
//   useEffect로 컨텍스트에 단방향 mirror만 publish.
//   Phase 03 InputPanel은 컨텍스트에서 read-only로 받아 자동 이월에 사용.
// ═══════════════════════════════════════════════════════════════════
import { createContext, useState, type ReactNode } from 'react'
import type { Phase01Output, Phase02Output } from '../types'

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

export interface PwasState {
  p01: Phase01Output
  p02: Phase02Output
  setP01: (next: Phase01Output) => void
  setP02: (next: Phase02Output) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const PwasCtx = createContext<PwasState | null>(null)

export function PwasProvider({ children }: { children: ReactNode }) {
  const [p01, setP01] = useState<Phase01Output>(DEFAULT_P01)
  const [p02, setP02] = useState<Phase02Output>(DEFAULT_P02)
  return <PwasCtx.Provider value={{ p01, p02, setP01, setP02 }}>{children}</PwasCtx.Provider>
}
