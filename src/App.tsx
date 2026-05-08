import { useState } from 'react'
import type { ModuleId } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import OverviewPanel from './components/modules/OverviewPanel'
import PlaceholderPanel from './components/modules/PlaceholderPanel'
import BasicInfoPanel from './components/modules/BasicInfoPanel'
import SiteSurveyPanel from './components/modules/SiteSurveyPanel'
import InputPanel from './components/modules/InputPanel'
import { PwasProvider } from './state/PwasContext'

function ModulePanel({ id }: { id: ModuleId }) {
  const show = (mid: ModuleId): React.CSSProperties =>
    ({ display: id === mid ? 'flex' : 'none', flex: 1, overflow: 'hidden' })

  return (
    <>
      <div style={show('overview')}><OverviewPanel /></div>
      <div style={show('basic-info')}><BasicInfoPanel /></div>
      <div style={show('site-survey')}><SiteSurveyPanel /></div>
      <div style={show('input')}><InputPanel /></div>
      <div style={show('stability')}><PlaceholderPanel phase="PHASE 04" title="안정성 검토" /></div>
      <div style={show('grade')}><PlaceholderPanel phase="PHASE 05" title="등급 판정" /></div>
      <div style={show('report')}><PlaceholderPanel phase="PHASE 06" title="출력" /></div>
    </>
  )
}

export default function App() {
  const [active, setActive] = useState<ModuleId>('overview')

  return (
    <PwasProvider>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        height: '100dvh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-outer)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          maxWidth: 'var(--app-max-w)',
          background: 'var(--bg)',
          boxShadow: '0 0 0 1px var(--border)',
        }}>
          <Header />
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar active={active} onSelect={setActive} />
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }} className="fade-in">
              <ModulePanel id={active} />
            </div>
          </div>
        </div>
      </div>
    </PwasProvider>
  )
}
