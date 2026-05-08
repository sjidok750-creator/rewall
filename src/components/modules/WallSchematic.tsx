export interface TierConfig {
  panels: number      // 이 단의 패널 수
  bermWidth: number   // 이 단 하부 소단 폭 (m) — 최하단은 미사용
}

export interface WallParams {
  height: number        // 역산된 전체 높이 H (m)
  length: number        // 연장 L (m)
  stages: number        // 단수 n
  slopeAngle: number    // 비탈면 경사각 θ (°)
  wallThick: number     // 패널 두께 t (m)
  method: 'PSP' | 'PPP' | 'mixed' | ''
  construction: 'top-down' | 'bottom-up' | 'unknown' | ''
  panelHeight: number   // 패널 1장 높이 (m, 전 단 공통)
  tiers: TierConfig[]   // 단별 패널 수 + 소단 폭
}

interface Props {
  params: WallParams
}

// ── SVG 캔버스 ──
const W = 900
const H_SVG = 580
const PAD = { t: 60, r: 60, b: 60, l: 90 }
const DH = H_SVG - PAD.t - PAD.b

// ── 서브 컴포넌트 ──

function HatchPattern({ id, angle = 45, spacing = 7, color = '#C4BFB5' }: {
  id: string; angle?: number; spacing?: number; color?: string
}) {
  return (
    <pattern id={id} width={spacing} height={spacing}
      patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <line x1="0" y1="0" x2="0" y2={spacing} stroke={color} strokeWidth="0.9" />
    </pattern>
  )
}

function DimLine({ x1, y1, x2, y2, label, side = 'left', fs = 10 }: {
  x1: number; y1: number; x2: number; y2: number
  label: string; side?: 'right' | 'left' | 'top' | 'bottom'; fs?: number
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const off = 13
  const tx = side === 'right' ? mx + off : side === 'left' ? mx - off : mx
  const ty = side === 'top' ? my - off : side === 'bottom' ? my + off + 4 : my + 4
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B857A" strokeWidth="0.8" strokeDasharray="4 3" />
      {(side === 'left' || side === 'right') && <>
        <line x1={x1 - 5} y1={y1} x2={x1 + 5} y2={y1} stroke="#8B857A" strokeWidth="1" />
        <line x1={x2 - 5} y1={y2} x2={x2 + 5} y2={y2} stroke="#8B857A" strokeWidth="1" />
      </>}
      {(side === 'top' || side === 'bottom') && <>
        <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} stroke="#8B857A" strokeWidth="1" />
        <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} stroke="#8B857A" strokeWidth="1" />
      </>}
      <text x={tx} y={ty} fontFamily="'JetBrains Mono', monospace"
        fontSize={fs} fill="#4A4740" textAnchor="middle">{label}</text>
    </g>
  )
}

// ── 소일네일 (PSP) ── 짧고 완만(12°), 전 구간 그라우팅
function SoilNail({ x, y, wallH, pxPerM }: {
  x: number; y: number; wallH: number; pxPerM: number
}) {
  const ang = 12
  const rad = (ang * Math.PI) / 180
  const lenPx = Math.max(3, wallH * 0.65) * pxPerM
  const ex = x + lenPx * Math.cos(rad)
  const ey = y + lenPx * Math.sin(rad)
  return (
    <g>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke="#D97757" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={x} y1={y} x2={ex} y2={ey} stroke="#B85E3A" strokeWidth="1" strokeLinecap="round" />
      <rect x={x - 5} y={y - 5} width={10} height={10}
        fill="#D97757" stroke="#B85E3A" strokeWidth="1" rx={1}
        transform={`rotate(${-ang}, ${x}, ${y})`} />
      <circle cx={x} cy={y} r={3} fill="#B85E3A" />
    </g>
  )
}

// ── 영구앵커 (PPP) ── 길고 경사 큼(20°), 자유장(파선)+정착장(굵은선)
function PermanentAnchor({ x, y, wallH, pxPerM }: {
  x: number; y: number; wallH: number; pxPerM: number
}) {
  const ang = 20
  const rad = (ang * Math.PI) / 180
  const totalPx = Math.max(6, wallH * 1.4) * pxPerM
  const freePx = totalPx * 0.55
  const fx = x + freePx * Math.cos(rad)
  const fy = y + freePx * Math.sin(rad)
  const ex = x + totalPx * Math.cos(rad)
  const ey = y + totalPx * Math.sin(rad)
  return (
    <g>
      <line x1={x} y1={y} x2={fx} y2={fy}
        stroke="#4A7FA5" strokeWidth="1.5" strokeDasharray="8 4" strokeLinecap="round" />
      <line x1={fx} y1={fy} x2={ex} y2={ey}
        stroke="#4A7FA5" strokeWidth="5" strokeLinecap="round" opacity={0.3} />
      <line x1={fx} y1={fy} x2={ex} y2={ey}
        stroke="#4A7FA5" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={5} fill="#4A7FA5" opacity={0.7} />
      <rect x={x - 6} y={y - 6} width={12} height={12}
        fill="#4A7FA5" stroke="#2A5F85" strokeWidth="1.2" rx={1}
        transform={`rotate(${-ang}, ${x}, ${y})`} />
      <rect x={x - 3} y={y - 3} width={6} height={6} fill="#2A5F85" rx={0.5}
        transform={`rotate(${-ang}, ${x}, ${y})`} />
    </g>
  )
}

// ── 범례 ──
function Legend({ method, x, y }: { method: string; x: number; y: number }) {
  if (!method) return null
  const items = []
  if (method === 'PSP' || method === 'mixed')
    items.push({ color: '#D97757', dash: undefined, thick: 2.5, label: '소일네일 (PSP) — 전 구간 그라우팅' })
  if (method === 'PPP' || method === 'mixed')
    items.push({ color: '#4A7FA5', dash: '8 4', thick: 1.5, label: '영구앵커 (PPP) — 자유장 / 정착장' })
  return (
    <g transform={`translate(${x}, ${y})`}>
      {items.map((item, i) => (
        <g key={i} transform={`translate(0, ${i * 18})`}>
          <line x1={0} y1={6} x2={28} y2={6}
            stroke={item.color} strokeWidth={item.thick} strokeDasharray={item.dash} />
          {!item.dash
            ? <circle cx={28} cy={6} r={4} fill={item.color} opacity={0.7} />
            : <rect x={22} y={2} width={8} height={8} fill={item.color} opacity={0.6} rx={1} />
          }
          <text x={36} y={10} fontFamily="'JetBrains Mono', monospace"
            fontSize="9" fill="#4A4740">{item.label}</text>
        </g>
      ))}
    </g>
  )
}

// ── 메인 컴포넌트 ──
export default function WallSchematic({ params }: Props) {
  const { height, stages, slopeAngle, method, construction,
          panelHeight, tiers } = params

  const H = Math.max(1, height)
  const theta = Math.max(30, Math.min(85, slopeAngle))
  const n = Math.max(1, Math.min(12, stages))
  const ph = Math.max(0.3, panelHeight)

  // tiers 배열 길이를 n에 맞춤 (방어)
  const safeTiers = Array.from({ length: n }, (_, i) =>
    tiers[i] ?? { panels: 2, bermWidth: 0.5 }
  )

  // px/m 스케일
  const pxPerM = DH / Math.min(H * 1.15, 30)
  const wallHpx = H * pxPerM

  const botY = PAD.t + DH
  const topY = botY - wallHpx

  const panelWpx = 16
  const levelH = 14
  const baseX = PAD.l + 60

  // 누적 소단 폭 합산으로 각 단 x 계산 (tier 0=최상단, n-1=최하단)
  // 최하단(n-1)의 frontX = baseX
  // 단 i의 frontX = baseX + Σ bermWidth[k] for k = i..(n-2) (px)
  const cumulativeBermPx = (i: number) => {
    let sum = 0
    for (let k = i; k < n - 1; k++) {
      sum += safeTiers[k].bermWidth * pxPerM
    }
    return sum
  }
  const tierFrontX = (i: number) => baseX + cumulativeBermPx(i)
  const tierBackX  = (i: number) => tierFrontX(i) + panelWpx

  // 각 단 y — 단별 패널 수에 따른 가변 높이
  // topY에서 아래로 쌓음
  const tierTopYArr: number[] = []
  const tierBotYArr: number[] = []
  let curY = topY
  for (let i = 0; i < n; i++) {
    const tierH = safeTiers[i].panels * ph * pxPerM
    tierTopYArr.push(curY)
    tierBotYArr.push(curY + tierH)
    curY += tierH
  }
  const tierTopY = (i: number) => tierTopYArr[i] ?? topY
  const tierBotY = (i: number) => tierBotYArr[i] ?? botY

  // 비탈면
  const thetaRad = (theta * Math.PI) / 180
  const slopeStartX = tierBackX(0)
  const slopeStartY = tierTopY(0)
  const slopeRun = wallHpx / Math.tan(thetaRad)

  const methodLabel = method === 'PSP' ? 'PSP — 소일네일 + PS패널'
    : method === 'PPP' ? 'PPP — 영구앵커 + PS패널'
    : method === 'mixed' ? '혼용 — 소일네일 + 영구앵커'
    : '공법 미선택'

  const consLabel = construction === 'top-down' ? 'Top-down'
    : construction === 'bottom-up' ? 'Bottom-up'
    : construction === 'unknown' ? '시공방법 불명'
    : ''

  return (
    <div style={{ width: '100%' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H_SVG}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <HatchPattern id="backfill-hatch" angle={45} spacing={8} color="#C4BFB5" />
          <HatchPattern id="ground-hatch" angle={45} spacing={6} color="#A09890" />
        </defs>

        {/* ── 지반선 ── */}
        <line x1={PAD.l} y1={botY} x2={W - PAD.r} y2={botY}
          stroke="#3A3730" strokeWidth="2" />
        <rect x={PAD.l} y={botY} width={W - PAD.l - PAD.r} height={14}
          fill="url(#ground-hatch)" opacity={0.4} />

        {/* ── 비탈면 경사선 + 배면토 ──
             실제 형태: 각 소단 끝에서 θ 경사로 다음 소단까지 이어지는 꺾인 선
             소단 수평 → θ 경사 → 소단 수평 → θ 경사 ... 반복
        ── */}
        {(() => {
          // 경사선 꺾임점 계산
          // 각 단 i의 배면 상단에서 경사 θ로 내려가다가 다음 단 배면 상단에서 멈춤
          // 최상단: tierBackX(0), tierTopY(0) 에서 출발
          // 최하단 지나서 → 지반선까지 연장

          const pts: [number, number][] = []
          pts.push([tierBackX(0), tierTopY(0)])  // 최상단 출발

          for (let i = 0; i < n - 1; i++) {
            // i단 배면 하단 (소단 위)
            const bx = tierBackX(i)
            const by = tierBotY(i)
            // θ 경사로 내려가면 소단 끝 x는 다음 단 배면 상단
            const nextBx = tierBackX(i + 1)
            // 경사선이 by 높이에서 nextBx까지 가는 y 계산
            // 실제: 소단 위 지표는 수평이고, 배면 경사는 소단 위에서 시작
            pts.push([bx, by])           // 소단 시작 (수평 이동)
            pts.push([nextBx, by])       // 소단 끝 (다음 단 배면 x)
          }
          // 최하단 배면 하단 → 지반선까지 θ로 연장
          const lastBx = tierBackX(n - 1)
          const lastBy = tierBotY(n - 1)
          pts.push([lastBx, lastBy])
          // θ 경사로 지반선까지
          const finalX = Math.min(lastBx + (botY - lastBy) / Math.tan(thetaRad), W - PAD.r - 10)
          pts.push([finalX, botY])

          const polyPoints = pts.map(([x, y]) => `${x},${y}`).join(' ')

          // 배면토 폴리곤: 경사선 + 우측 지반 + 최하단 배면
          const backfillPts = [
            ...pts,
            [W - PAD.r, botY],
            [tierBackX(n - 1), botY],
            [tierBackX(n - 1), tierTopY(n - 1)],
            // 각 단 배면을 거슬러 올라감
            ...Array.from({ length: n - 1 }, (_, k) => {
              const ii = n - 1 - k
              return [
                [tierBackX(ii), tierTopY(ii)],
                [tierBackX(ii - 1), tierBotY(ii - 1)],
              ]
            }).flat(),
          ].map(([x, y]) => `${x},${y}`).join(' ')

          return (
            <g>
              {/* 배면토 해칭 */}
              <polygon points={backfillPts}
                fill="url(#backfill-hatch)" opacity={0.45} stroke="none" />
              {/* 비탈면 경사선 (꺾인 실선) */}
              <polyline points={polyPoints}
                fill="none" stroke="#3A3730" strokeWidth="1.3"
                strokeDasharray="none" />
            </g>
          )
        })()}

        {/* ── 레벨링 콘크리트 — 단별 독립 기초 ── */}
        {Array.from({ length: n }, (_, i) => {
          const fx = tierFrontX(i)
          const by = i < n - 1 ? tierBotY(i) : botY
          const isBottom = i === n - 1
          const lh = isBottom ? levelH : Math.round(levelH * 0.5)
          return (
            <g key={`level-${i}`}>
              <rect x={fx - 4} y={by - lh} width={panelWpx + 8} height={lh}
                fill={isBottom ? '#C8C4BC' : '#D4D0C8'}
                stroke="#3A3730" strokeWidth={isBottom ? 1.2 : 0.7} />
              {isBottom && (
                <text x={fx + panelWpx / 2} y={by - 2}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7" fill="#6B6560" textAnchor="middle">레벨링</text>
              )}
            </g>
          )
        })}

        {/* ── 단별 패널 + 소단 ── */}
        {Array.from({ length: n }, (_, i) => {
          const tier = safeTiers[i]
          const pph = tier.panels                       // 이 단의 패널 수
          const fx  = tierFrontX(i)
          const bx  = tierBackX(i)
          const ty  = tierTopY(i)
          const by  = i < n - 1 ? tierBotY(i) : botY - levelH
          const panelHpx = (by - ty) / pph             // 패널 1장 px 높이
          const thisBermPx = tier.bermWidth * pxPerM   // 이 단 소단 폭 px

          return (
            <g key={i}>
              {/* 패널들 */}
              {Array.from({ length: pph }, (_, j) => {
                const py = ty + j * panelHpx
                return (
                  <g key={j}>
                    <rect x={fx} y={py} width={panelWpx} height={panelHpx}
                      fill="#EFEDE8" stroke="#1A1915" strokeWidth="1.2" />
                    <line x1={fx + 2} y1={py + panelHpx / 2}
                      x2={bx - 2} y2={py + panelHpx / 2}
                      stroke="#D8D4CC" strokeWidth="0.5" />
                  </g>
                )
              })}

              {/* 뒤채움재 */}
              {i < n - 1 && (
                <rect x={bx} y={ty} width={thisBermPx * 0.6} height={by - ty}
                  fill="#D4C8B0" opacity={0.4} stroke="none" />
              )}

              {/* 소단 수평선 */}
              {i < n - 1 && (
                <g>
                  <line x1={fx} y1={by} x2={tierFrontX(i + 1)} y2={by}
                    stroke="#5A5550" strokeWidth="1.2" />
                  {thisBermPx > 12 && (
                    <DimLine
                      x1={tierBackX(i)} y1={by + 10}
                      x2={tierFrontX(i + 1)} y2={by + 10}
                      label={`${tier.bermWidth.toFixed(1)}m`}
                      side="bottom" fs={7}
                    />
                  )}
                </g>
              )}

              {/* 단 번호 */}
              <text x={fx - 12} y={(ty + (by)) / 2 + 4}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="9" fill="#8B857A" textAnchor="middle">{i + 1}</text>

              {/* 보강재 — 패널 1장당 1개 */}
              {method && Array.from({ length: pph }, (_, j) => {
                const panelMidY = ty + (j + 0.5) * panelHpx
                const globalIdx = safeTiers.slice(0, i).reduce((s, t) => s + t.panels, 0) + j
                const isAnchor = method === 'PPP' || (method === 'mixed' && globalIdx % 2 === 0)
                const isNail   = method === 'PSP' || (method === 'mixed' && globalIdx % 2 === 1)
                if (isAnchor) return <PermanentAnchor key={j} x={bx} y={panelMidY} wallH={H} pxPerM={pxPerM} />
                if (isNail)   return <SoilNail key={j} x={bx} y={panelMidY} wallH={H} pxPerM={pxPerM} />
                return null
              })}
            </g>
          )
        })}

        {/* ── 치수선 — 전체 높이 H ── */}
        <DimLine
          x1={baseX - 32} y1={topY}
          x2={baseX - 32} y2={botY - levelH}
          label={`H=${H.toFixed(1)}m`}
          side="left"
        />

        {/* ── 최하단 단 높이 치수 ── */}
        {n <= 8 && (
          <DimLine
            x1={baseX - 16} y1={tierTopY(n - 1)}
            x2={baseX - 16} y2={tierBotY(n - 1)}
            label={`${(safeTiers[n-1].panels * ph).toFixed(1)}m`}
            side="left" fs={8}
          />
        )}

        {/* ── 경사각 θ ── */}
        {slopeRun > 30 && (
          <g>
            <path
              d={`M ${slopeStartX + 28},${slopeStartY} A 28 28 0 0 1 ${slopeStartX + 28 * Math.cos(Math.PI / 2 - thetaRad)},${slopeStartY + 28 * Math.sin(Math.PI / 2 - thetaRad)}`}
              fill="none" stroke="#4A7FA5" strokeWidth="0.9"
            />
            <text x={slopeStartX + 36} y={slopeStartY + 26}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10" fill="#4A7FA5">θ={theta}°</text>
          </g>
        )}

        {/* ── 단수 라벨 ── */}
        <text
          x={(tierFrontX(0) + tierBackX(0)) / 2} y={topY - 10}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10" fill="#8B857A" textAnchor="middle"
        >n={n} (총 {safeTiers.reduce((s,t)=>s+t.panels,0)}장)</text>

        {/* ── 공법 라벨 ── */}
        <text x={PAD.l} y={PAD.t - 18}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="11" fill={method ? 'var(--accent)' : '#8B857A'}
          letterSpacing="0.05em">{methodLabel}</text>

        {/* ── 시공방법 뱃지 ── */}
        {consLabel && (
          <g>
            <rect x={W - PAD.r - 96} y={PAD.t - 34} width={96} height={18}
              rx={2} fill="var(--bg-sidebar)" stroke="var(--border)" />
            <text x={W - PAD.r - 48} y={PAD.t - 21}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10" fill="#4A4740" textAnchor="middle">{consLabel}</text>
          </g>
        )}

        {/* ── 중앙 제목 ── */}
        <text x={W / 2} y={PAD.t - 18}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="#8B857A" textAnchor="middle" letterSpacing="0.12em"
        >단면 모식도 — SECTION SCHEMATIC</text>

        {/* ── 범례 ── */}
        <Legend method={method} x={PAD.l} y={H_SVG - 36} />
      </svg>
    </div>
  )
}
