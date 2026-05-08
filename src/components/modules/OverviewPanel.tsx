interface FlowPhase {
  id: string
  phase: string
  title: string
  titleEn: string
  color: string
  items: { label: string; subs?: string[] }[]
  kds?: string[]
  branches?: string[]
  methodGuide?: boolean  // Phase 01 공법분류 가이드 패널 표시 여부
}

const PHASES: FlowPhase[] = [
  {
    id: 'basic-info',
    phase: '01',
    title: '기본정보 수집',
    titleEn: 'Basic Information',
    color: '#4A7FA5',
    items: [
      { label: '공법 분류', subs: ['PSP — 소일네일 + PS패널', 'PPP — 영구앵커 + PS패널', '혼용 — 구간별 네일+앵커 병행 (현장 多수)'] },
      { label: '자료 보유 현황', subs: ['설계도면·구조계산서 有 → 설계값 기준', '없음 → 추정값 + 민감도 분석 필수'] },
      { label: '적용 KDS 버전 (시공 시기 기준)', subs: ['2016 이전: 구 기준 적용', '2020 이후: KDS 11 80 20'] },
      { label: '시공방법 확인', subs: ['Top-down (상부→하부 굴착)', 'Bottom-up (기초→상향 시공)'] },
      { label: '옹벽 제원', subs: ['연장 / 높이 / 단수 / 경사각'] },
    ],
    kds: ['KDS 11 80 20'],
    methodGuide: true,
  },
  {
    id: 'site-survey',
    phase: '02',
    title: '현장조사',
    titleEn: 'Site Survey',
    color: '#6B7FA5',
    items: [
      {
        label: '외관조사',
        subs: [
          '패널: 균열(패턴·폭·깊이) / 박리·박락·변색',
          '패널 이격·변위 (기울기·전도·팽출)',
          '앵커·네일 두부: 부식·녹물·보호캡 손상',
          '배수공: 막힘·누수 흔적',
          '기초부: 세굴·침하·부등침하 흔적',
          '배면 비탈면: 균열·용수·식생 이상',
        ],
      },
      {
        label: '비파괴 시험 (선택)',
        subs: [
          '슈미트해머 — 콘크리트 표면강도',
          '초음파속도 — 내부결함',
          '철근탐사 — 배근 위치·피복',
          '탄산화 깊이 — 페놀프탈레인법',
        ],
      },
      {
        label: '코어 채취 (선택)',
        subs: ['압축강도 실측값 확보'],
      },
      {
        label: 'Lift-off Test (선택)',
        subs: ['앵커·네일 잔존 인장력 실측', '미실시 시 → 설계값×시간감소율 가정'],
      },
      {
        label: '지반 자료',
        subs: ['시공 당시 지반조사보고서 활용', '없음 → 문헌값 + 민감도 분석'],
      },
    ],
    branches: ['Lift-off 실시 여부 → Phase 3 잔존인장력 입력 분기', '도면 有/無 → Phase 3 단면 입력 분기'],
  },
  {
    id: 'input',
    phase: '03',
    title: '입력값 확정',
    titleEn: 'Input Parameters',
    color: '#7A6FA5',
    items: [
      {
        label: '단면 / 배근',
        subs: ['도면 有 → 설계 치수·배근 직접 입력', '도면 無 → 철근탐사+외관측정 추정값'],
      },
      {
        label: '재료 강도',
        subs: ['콘크리트: 코어 실측값 or 설계강도×열화감소율', '철근: 설계강도 (부식률→유효단면 감소 입력)'],
      },
      {
        label: 'PS 잔존력',
        subs: ['Lift-off 실측값 직접 입력', '미실측: 초기긴장력×손실율 (마찰·건조수축·크리프·릴랙세이션)'],
      },
      {
        label: '지반 정수',
        subs: ['내부마찰각 φ / 점착력 c / 단위중량 γ / 수평지반반력계수 Ks'],
      },
      {
        label: '앵커·네일 제원',
        subs: ['길이 / 직경 / 수평·수직 간격 / 경사각 / 그라우트 강도'],
      },
      {
        label: '하중 조건',
        subs: ['상재하중 (차량·구조물·비탈면 상부)', '지하수위 / 지진계수 (내진 검토 시)'],
      },
    ],
    kds: ['KDS 11 70 15', 'KDS 14 20', 'KDS 14 30'],
  },
  {
    id: 'stability',
    phase: '04',
    title: '안정성 검토',
    titleEn: 'Stability Analysis',
    color: '#D97757',
    items: [
      {
        label: 'A. 외적 안정  [KDS 11 80 20]',
        subs: [
          '토압 산정 — Coulomb 주동토압 (지진: Mononobe-Okabe)',
          '활동 검토 — FS ≥ 1.5 (지진 시 1.1)',
          '전도 검토 — FS ≥ 1.5 (지진 시 1.1)',
          '지지력 검토 — FS ≥ 2.5 (지진 시 2.0)',
          '자체파괴 검토 — FS ≥ 2.0 (전단·모멘트)',
        ],
      },
      {
        label: 'B. 보강재→패널 전달  [KDS 11 70 15 + FHWA]',
        subs: [
          '앵커·네일 잔존 인장력 확인',
          '패널 펀칭전단 검토 — 두부 집중하중·임계둘레',
          '패널 휨 검토 — 네일 사이 4점지지 단순보 가정',
        ],
      },
      {
        label: 'C. PC 패널 단면  [KDS 14 20 + 14 30]',
        subs: [
          'PS 유효 잔존력 적용',
          '휨강도 검토 (균열모멘트 / 극한모멘트)',
          '전단강도 검토',
          '정착부 지압응력 검토',
        ],
      },
      {
        label: 'D. 전체안정 (원호활동)  [외부 입력]',
        subs: [
          'SLOPE/W 등 외부 프로그램 결과 수동 입력',
          '미입력 시 → 등급판정 제한 (경고)',
        ],
      },
    ],
    kds: ['KDS 11 80 20', 'KDS 11 70 15', 'KDS 14 20', 'KDS 14 30'],
    branches: ['항목별 FS → 합격(✓) / 불합격(✗) 자동 표시', '전체안정 미입력 → 경고 플래그'],
  },
  {
    id: 'grade',
    phase: '05',
    title: '등급 판정',
    titleEn: 'Safety Grade',
    color: '#5A9A6A',
    items: [
      {
        label: '항목별 FS → 상태 등급 산정',
        subs: ['A~D 각 검토항목 FS값 기반'],
      },
      {
        label: '외관조사 상태 등급 결합',
        subs: ['균열·손상·변위 등급 반영'],
      },
      {
        label: '종합 안전등급 결정',
        subs: [
          'a — 문제없음 (정상)',
          'b — 경미한 손상, 모니터링 권고',
          'c — 보수 필요',
          'd — 긴급 보수',
          'e — 즉시 사용 금지 / 재시공',
        ],
      },
      {
        label: '보수보강 의견',
        subs: ['등급별 표준 권고사항 자동 매핑', '진단기술사 검토·확인 필요 명시'],
      },
    ],
    kds: ['시설물 안전 세부지침해설서 (옹벽)'],
  },
  {
    id: 'report',
    phase: '06',
    title: '출력',
    titleEn: 'Report',
    color: '#6A8A5A',
    items: [
      {
        label: '화면 출력',
        subs: ['항목별 FS 표 + 합격/불합격', '등급 판정 결과 요약'],
      },
      {
        label: 'PDF 구조계산서',
        subs: ['전체 입력값 목록 (추적성)', 'KDS 조항 인용 목록', '계산 과정 상세 출력'],
      },
      {
        label: '면책 명시',
        subs: ['KDS 일반 규정 기반 검토임을 명시', '특허 공법 고유 가정과 다를 수 있음'],
      },
    ],
  },
]

// ── 공법 분류 가이드 패널 ─────────────────────────────────────────
function MethodGuidePanel() {
  return (
    <div style={{
      marginTop: 10,
      border: '1px solid var(--border)',
      borderLeft: '3px solid #4A7FA5',
      borderRadius: 2,
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-sidebar)',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'var(--text-3)',
          textTransform: 'uppercase' as const,
        }}>공법 선택 기준 — 현장 적용 패턴</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: 'var(--text-3)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          padding: '1px 5px',
          borderRadius: 2,
        }}>KDS 11 70 15 · KDS 11 80 20 · FHWA NHI-14-007</span>
      </div>

      {/* 공법 비교 표 */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* 빈도 요약 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '혼용', sub: '상부 네일 + 하부 앵커', freq: 5, color: '#D97757' },
            { label: 'PSP', sub: 'H ≤ 6m, 지반 양호', freq: 3, color: '#4A7FA5' },
            { label: 'PPP', sub: '지반 불량·중요 구조물 배면', freq: 2, color: '#6B7FA5' },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--bg-panel)',
              border: `1px solid ${item.color}40`,
              borderTop: `2px solid ${item.color}`,
              borderRadius: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  color: item.color,
                }}>{item.label}</span>
                <span style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i < item.freq ? item.color : 'var(--border)',
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* 혼용 상세 설명 */}
        <div style={{
          padding: '8px 10px',
          background: '#FDF3EE',
          border: '1px solid rgba(217,119,87,0.25)',
          borderRadius: 2,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            marginBottom: 5,
          }}>혼용 공법 배치 원칙 (현장 多수)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { pos: '상부 단', method: '소일네일 (PSP)', reason: '토압 작음, 시공 경제적, 지반 조건 충족 시 적용' },
              { pos: '하부 단', method: '영구앵커 (PPP)', reason: '토압·수압 집중, 안정 지반까지 정착장 확보 필요' },
              { pos: '중간 단', method: '지반 변화에 따라 전환', reason: '지반조사 결과·설계자 판단으로 구간 결정' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '56px 100px 1fr',
                gap: 6,
                fontSize: 10,
                lineHeight: 1.4,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'var(--text-3)',
                  paddingTop: 1,
                }}>{row.pos}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{row.method}</span>
                <span style={{ color: 'var(--text-2)' }}>{row.reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 구조 해석 단위 */}
        <div style={{
          padding: '8px 10px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 2,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--text-3)',
            letterSpacing: '0.1em',
            marginBottom: 5,
          }}>구조 해석 단위 (단별 독립 기초 기준)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { item: '외적안정 (활동·전도·지지력)', unit: '단별 독립 검토', note: '각 단이 자체 기초에서 저항' },
              { item: '보강재 → 패널 전달', unit: '단별 독립 검토', note: '각 단 하중을 자기 보강재가 분담' },
              { item: '전체안정 (원호활동)', unit: '전 구간 통합', note: 'SLOPE/W 등 외부 프로그램 — 다단 전체 관통' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '160px 90px 1fr',
                gap: 6,
                fontSize: 10,
                lineHeight: 1.4,
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                paddingBottom: i < 2 ? 3 : 0,
              }}>
                <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{row.item}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: '#4A7FA5',
                }}>{row.unit}</span>
                <span style={{ color: 'var(--text-3)' }}>{row.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 출처 */}
        <div style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap' as const,
        }}>
          {[
            'KDS 11 70 15 : 2020 § 4 (보강재 배치 기준)',
            'KDS 11 80 20 : 2020 § 4.3 (외적안정 검토)',
            'FHWA NHI-14-007 Ch.5 (Soil Nail — 다단 배치)',
          ].map(src => (
            <span key={src} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              color: 'var(--text-3)',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border)',
              padding: '2px 6px',
              borderRadius: 2,
            }}>※ {src}</span>
          ))}
        </div>

      </div>
    </div>
  )
}

function PhaseCard({ phase }: { phase: FlowPhase }) {
  const isHighlight = phase.id === 'stability'

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `1px solid ${isHighlight ? 'rgba(217,119,87,0.35)' : 'var(--border)'}`,
      borderTop: `3px solid ${phase.color}`,
      borderRadius: 3,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Phase Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          color: phase.color,
          letterSpacing: '0.08em',
          background: `${phase.color}18`,
          padding: '2px 7px',
          borderRadius: 2,
        }}>
          {phase.phase ? `PHASE ${phase.phase}` : '개요'}
        </span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.2 }}>
            {phase.title}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--text-3)',
            letterSpacing: '0.06em',
            marginTop: 1,
          }}>
            {phase.titleEn}
          </div>
        </div>
      </div>

      {/* KDS 기준 */}
      {phase.kds && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {phase.kds.map(k => (
            <span key={k} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--text-3)',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border)',
              padding: '1px 6px',
              borderRadius: 2,
              letterSpacing: '0.04em',
            }}>
              {k}
            </span>
          ))}
        </div>
      )}

      {/* 항목 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {phase.items.map((item, i) => (
          <div key={i}>
            <div style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--text-1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              lineHeight: 1.35,
            }}>
              <span style={{
                color: phase.color,
                fontSize: 10,
                marginTop: 2,
                flexShrink: 0,
              }}>▸</span>
              {item.label}
            </div>
            {item.subs && (
              <div style={{ marginLeft: 16, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {item.subs.map((s, j) => (
                  <div key={j} style={{
                    fontSize: 11,
                    color: 'var(--text-2)',
                    display: 'flex',
                    gap: 5,
                    lineHeight: 1.4,
                  }}>
                    <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>·</span>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 공법 분류 가이드 */}
      {phase.methodGuide && <MethodGuidePanel />}

      {/* 분기 조건 */}
      {phase.branches && (
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--text-3)',
            letterSpacing: '0.1em',
            marginBottom: 2,
          }}>
            BRANCH
          </div>
          {phase.branches.map((b, i) => (
            <div key={i} style={{
              fontSize: 10.5,
              color: 'var(--warn)',
              display: 'flex',
              gap: 5,
              lineHeight: 1.4,
            }}>
              <span style={{ flexShrink: 0 }}>⎇</span>
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Arrow() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      flexShrink: 0,
      paddingTop: 32,
    }}>
      <div style={{ width: 1, height: 24, background: 'var(--border-2)' }} />
      <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
        <path d="M5 7 L0 0 L10 0 Z" fill="var(--border-2)" />
      </svg>
    </div>
  )
}

export default function OverviewPanel() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* 상단 타이틀 바 */}
      <div style={{
        padding: '12px 24px 11px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
            PSP / PPP 옹벽 — 안전성·안정성 평가 흐름도
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            color: 'var(--text-3)',
            letterSpacing: '0.08em',
            marginTop: 2,
          }}>
            SAFETY &amp; STABILITY ASSESSMENT WORKFLOW
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            { label: 'PSP', desc: '소일네일 + PS패널' },
            { label: 'PPP', desc: '영구앵커 + PS패널' },
          ].map(t => (
            <div key={t.label} style={{
              padding: '4px 10px',
              background: 'var(--accent-bg)',
              border: '1px solid rgba(217,119,87,0.3)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{t.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 흐름도 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>

        {/* 상단 안내 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 3,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 11.5,
          color: 'var(--text-2)',
          lineHeight: 1.6,
        }}>
          본 프로그램은 <strong style={{ color: 'var(--text-1)' }}>기존 PSP/PPP 옹벽의 현재 상태</strong>를 평가하는 도구입니다.
          현장조사·실측값을 입력하고 KDS 기준에 따라 안정성을 검토합니다.
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            color: 'var(--text-3)',
            marginLeft: 8,
          }}>
            KDS 11 80 20 · KDS 11 70 15 · KDS 14 20
          </span>
        </div>

        {/* Phase 카드 흐름 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
          {PHASES.map((phase, idx) => (
            <div key={phase.id}>
              <div className="fade-in">
                <PhaseCard phase={phase} />
              </div>
              {idx < PHASES.length - 1 && <Arrow />}
            </div>
          ))}
        </div>

        {/* 하단 주의사항 */}
        <div style={{
          marginTop: 24,
          padding: '10px 14px',
          background: 'var(--warn-bg)',
          border: '1px solid rgba(184,101,10,0.25)',
          borderRadius: 3,
          fontSize: 11,
          color: 'var(--warn)',
          lineHeight: 1.6,
        }}>
          ⚠️ 본 결과는 KDS 일반 규정 기반 검토이며, PSP/PPP 특허 공법 고유 가정과 다를 수 있습니다.
          최종 안전등급 판정은 관련 분야 진단기술사의 검토·확인이 필요합니다.
        </div>
      </div>
    </div>
  )
}
