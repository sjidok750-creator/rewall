import { useContext } from 'react'
import { PwasCtx, type PwasState } from './PwasContext'

export function usePwas(): PwasState {
  const v = useContext(PwasCtx)
  if (!v) throw new Error('usePwas must be used within PwasProvider')
  return v
}
