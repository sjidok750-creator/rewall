export interface WallParams {
  height: number      // 옹벽 높이 H (m)
  length: number      // 연장 L (m)
  stages: number      // 단수 n (= 패널 단 수 = 소단 수 + 1)
  slopeAngle: number  // 비탈면 경사각 θ (°)
  wallThick: number   // 패널 두께 t (m)
  method: 'PSP' | 'PPP' | 'mixed' | ''
  construction: 'top-down' | 'bottom-up' | 'unknown' | ''
}

interface Props {
  params: WallParams
}

// — SVG 캔버스 —
const W = 900
const H_SVG = 580
const PAD = { t: 60, r: 40, b: 60, l: 80 }
const DH = H_SVG - PAD.t - PAD.b

// 패널 전면 경사각 (°) — 실제 시공 약 6° 후방 경사
const LEAN_DEG = 6
const LEAN_RAD = (LEAN_DEG * Math.PI) / 180

// 각 단의 소단 후퇴폭 (m 단위 → 도면상 px 비율로 변환)
const BERM_REAL_M = 0.6  // 소단 후퇴폭

// —— 서브 컴포넌트들 ——

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

function DimLine({ x1, y1, x2, y2, label, side = 'left', fontSize = 10 }: {
  x1: number; y1: number; x2: number; y2: number
  label: string; side?: 'right' | 'left' | 'top' | 'bottom'; fontSize?: number
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const offset = 12
  const tx = side === 'right' ? mx + offset : side === 'left' ? mx - offset : mx
  const ty = side === 'top' ? my - offset : side === 'bottom' ? my + offset + 4 : my + 4

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B857A" strokeWidth="0.8" strokeDasharray="4 3" />
      {(side === 'right' || side === 'left') && <>
        <line x1={x1 - 5} y1={y1} x2={x1 + 5} y2={y1} stroke="#8B857A" strokeWidth="1" />
        <line x1={x2 - 5} y1={y2} x2={x2 + 5} y2={y2} stroke="#8B857A" strokeWidth="1" />
      </>}
      {(side === 'top' || side === 'bottom') && <>
        <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} stroke="#8B857A" strokeWidth="1" />
        <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} stroke="#8B857A" strokeWidth="1" />
      </>}
      <text x={tx} y={ty}
        fontFamily="'JetBrains Mono', monospace"
        fontSize={fontSize} fill="#4A4740" textAnchor="middle"
      >{label}</text>
    </g>
  )
}

// ── 소일네일 (PSP) ──────────────────────────────────────────────
// 전 구간 그라우팅, 짧고 완만(~10°), 두부에 지압판
function SoilNail({ x, y, wallH, pxPerM }: {
  x: number; y: number; wallH: number; pxPerM: number
}) {
  const nailAngle = 12  // ° below horizontal
  const nailAngleRad = (nailAngle * Math.PI) / 180
  const nailLenM = Math.max(3, wallH * 0.65)
  const nailLenPx = nailLenM * pxPerM
  const dx = nailLenPx * Math.cos(nailAngleRad)
  const dy = nailLenPx * Math.sin(nailAngleRad)  // +y = down

  const ex = x + dx
  const ey = y + dy

  return (
    <g>
      {/* 그라우팅 바디 — 그라우트 실린더 표현 (두께 있는 선) */}
      <line x1={x} y1={y} x2={ex} y2={ey}
        stroke="#D97757" strokeWidth="2.5" strokeLinecap="round" />
      {/* 네일 봉 중심선 */}
      <line x1={x} y1={y} x2={ex} y2={ey}
        stroke="#B85E3A" strokeWidth="1" strokeLinecap="round" />
      {/* 두부 지압판 */}
      <rect
        x={x - 5} y={y - 5}
        width={10} height={10}
        fill="#D97757" stroke="#B85E3A" strokeWidth="1"
        rx={1}
        transform={`rotate(${-nailAngle}, ${x}, ${y})`}
      />
      {/* 두부 너트 */}
      <circle cx={x} cy={y} r={3} fill="#B85E3A" />
    </g>
  )
}

// ── 영구앵커 (PPP) ──────────────────────────────────────────────
// 자유장(파선) + 정착장(굵은 실선 + 정착블록), 길고 경사 큼(~20°)
function PermanentAnchor({ x, y, wallH, pxPerM }: {
  x: number; y: number; wallH: number; pxPerM: number
}) {
  const anchorAngle = 20  // ° below horizontal
  const anchorAngleRad = (anchorAngle * Math.PI) / 180
  const totalLenM = Math.max(6, wallH * 1.4)
  const freeLenM = totalLenM * 0.55   // 자유장 약 55%, 나머지 45%가 정착장

  const totalPx = totalLenM * pxPerM
  const freePx = freeLenM * pxPerM

  const cosA = Math.cos(anchorAngleRad)
  const sinA = Math.sin(anchorAngleRad)

  // 자유장 끝점
  const fx = x + freePx * cosA
  const fy = y + freePx * sinA
  // 앵커 끝점
  const ex = x + totalPx * cosA
  const ey = y + totalPx * sinA

  return (
    <g>
      {/* 자유장 — 파선 */}
      <line x1={x} y1={y} x2={fx} y2={fy}
        stroke="#4A7FA5" strokeWidth="1.5"
        strokeDasharray="8 4" strokeLinecap="round" />
      {/* 정착장 — 그라우트 실린더 */}
      <line x1={fx} y1={fy} x2={ex} y2={ey}
        stroke="#4A7FA5" strokeWidth="5" strokeLinecap="round" opacity={0.35} />
      <line x1={fx} y1={fy} x2={ex} y2={ey}
        stroke="#4A7FA5" strokeWidth="1.8" strokeLinecap="round" />
      {/* 정착장 끝단 캡 */}
      <circle cx={ex} cy={ey} r={5} fill="#4A7FA5" opacity={0.7} />
      {/* 두부 지압판 + 너트 — 더 두텁게 */}
      <rect
        x={x - 6} y={y - 6}
        width={12} height={12}
        fill="#4A7FA5" stroke="#2A5F85" strokeWidth="1.2"
        rx={1}
        transform={`rotate(${-anchorAngle}, ${x}, ${y})`}
      />
      <rect
        x={x - 3} y={y - 3}
        width={6} height={6}
        fill="#2A5F85"
        rx={0.5}
        transform={`rotate(${-anchorAngle}, ${x}, ${y})`}
      />
    </g>
  )
}

// ── 보강재 오버레이 (단별 1행) ──────────────────────────────────
function ReinforcementOverlay({ method, stageTopYs, wallFaceXs, wallH, pxPerM }: {
  method: string
  stageTopYs: number[]   // 각 단의 상단 y좌표
  wallFaceXs: number[]   // 각 단 중앙 높이의 패널 배면 x좌표
  wallH: number
  pxPerM: number
}) {
  if (!method || stageTopYs.length < 2) return null
  const n = stageTopYs.length - 1  // 단 수

  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const topY = stageTopYs[i]
        const botY = stageTopYs[i + 1]
        const midY = (topY + botY) / 2
        const faceX = wallFaceXs[i]

        const isAnchor = method === 'PPP' || (method === 'mixed' && i % 2 === 1)
        const isNail = method === 'PSP' || (method === 'mixed' && i % 2 === 0)

        if (isAnchor) {
          return <PermanentAnchor key={i} x={faceX} y={midY} wallH={wallH} pxPerM={pxPerM} />
        } else if (isNail) {
          return <SoilNail key={i} x={faceX} y={midY} wallH={wallH} pxPerM={pxPerM} />
        }
        return null
      })}
    </>
  )
}

// ── 범례 ───────────────────────────────────────────────────────
function Legend({ method, x, y }: { method: string; x: number; y: number }) {
  if (!method) return null
  const items: { color: string; dash?: string; thick?: number; label: string }[] = []

  if (method === 'PSP' || method === 'mixed') {
    items.push({ color: '#D97757', thick: 2.5, label: '소일네일 (PSP) — 전 구간 그라우팅' })
  }
  if (method === 'PPP' || method === 'mixed') {
    items.push({ color: '#4A7FA5', dash: '8 4', label: '영구앵커 (PPP) — 자유장 / 정착장' })
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      {items.map((item, i) => (
        <g key={i} transform={`translate(0, ${i * 18})`}>
          <line x1={0} y1={6} x2={28} y2={6}
            stroke={item.color} strokeWidth={item.thick ?? 1.5}
            strokeDasharray={item.dash} />
          {!item.dash && (
            <circle cx={28} cy={6} r={4} fill={item.color} opacity={0.7} />
          )}
          {item.dash && (
            <rect x={22} y={2} width={8} height={8} fill={item.color} opacity={0.6} rx={1} />
          )}
          <text x={36} y={10}
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9" fill="#4A4740">{item.label}</text>
        </g>
      ))}
    </g>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function WallSchematic({ params }: Props) {
  const { height, stages, slopeAngle, method, construction } = params

  const H = Math.max(1, height)
  const theta = Math.max(30, Math.min(85, slopeAngle))
  const n = Math.max(1, Math.min(12, stages))

  // px/m 스케일 (최대 20m 기준)
  const pxPerM = DH / Math.min(H * 1.15, 20)
  const wallHeightPx = H * pxPerM

  // 기준 좌표
  const botY = PAD.t + DH          // 기초 바닥 y
  const topY = botY - wallHeightPx  // 옹벽 상단 y

  // 패널 전면 기준 x (기울어짐 기준점 = 하단)
  const faceBaseX = PAD.l + 70
  // 패널 두께 (도면상 고정 16px — 개념도)
  const panelPxW = 18

  // 패널 경사 오프셋 (상단이 하단보다 leanOffset만큼 우측으로 기울어짐)
  const leanOffset = wallHeightPx * Math.tan(LEAN_RAD)

  // 소단 후퇴폭 (px)
  const bermPx = BERM_REAL_M * pxPerM

  // 단 높이
  const stageHpx = wallHeightPx / n

  // 각 단의 y 경계 (topY → botY, n+1 개)
  const stageTopYs = Array.from({ length: n + 1 }, (_, i) => topY + stageHpx * i)

  // 각 단의 패널 전면/배면 x 좌표 (기울기 + 소단 반영)
  // 단 i (0=최상단)의 상단·하단 전면 x
  const stageFrontX = (i: number, isTop: boolean) => {
    // 패널 전면은 직선 경사면 — 하단 faceBaseX, 상단 faceTopX
    const ratio = isTop ? i / n : (i + 1) / n
    return faceBaseX + leanOffset * (1 - ratio)
  }
  const stageBackX = (i: number, isTop: boolean) => {
    return stageFrontX(i, isTop) + panelPxW
  }

  // 보강재가 나오는 배면 x (각 단 중앙 높이)
  const reinforceFaceXs = Array.from({ length: n }, (_, i) => {
    const midRatio = (i + 0.5) / n
    return faceBaseX + leanOffset * (1 - midRatio) + panelPxW
  })

  // 비탈면 경사 — 패널 배면 상단에서 출발
  const backTopX = stageBackX(0, true)
  const thetaRad = (theta * Math.PI) / 180
  const slopeRun = wallHeightPx / Math.tan(thetaRad)
  const slopeEndX = Math.min(backTopX + slopeRun, W - PAD.r - 20)

  // 기초
  const foundH = 18
  const foundW = panelPxW + 28

  // 라벨
  const methodLabel = method === 'PSP' ? 'PSP — 소일네일 + PS패널'
    : method === 'PPP' ? 'PPP — 영구앵커 + PS패널'
    : method === 'mixed' ? '혼용 — 소일네일 + 영구앵커'
    : '공법 미선택'

  const consLabel = construction === 'top-down' ? 'Top-down'
    : construction === 'bottom-up' ? 'Bottom-up'
    : construction === 'unknown' ? '시공방법 불명'
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H_SVG}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <HatchPattern id="backfill-hatch" angle={45} spacing={8} color="#C4BFB5" />
          <HatchPattern id="ground-hatch" angle={45} spacing={6} color="#A09890" />
          <HatchPattern id="panel-hatch" angle={135} spacing={12} color="#D8D4CC" />
        </defs>

        {/* ── 지반선 ── */}
        <line x1={PAD.l} y1={botY} x2={W - PAD.r} y2={botY}
          stroke="#3A3730" strokeWidth="2" />
        <rect x={PAD.l} y={botY} width={W - PAD.l - PAD.r} height={14}
          fill="url(#ground-hatch)" opacity={0.45} />

        {/* ── 배면토 해칭 ── */}
        <polygon
          points={`
            ${backTopX},${topY}
            ${slopeEndX},${botY}
            ${stageBackX(n - 1, false)},${botY}
            ${stageBackX(0, true)},${topY}
          `}
          fill="url(#backfill-hatch)" opacity={0.55}
          stroke="none"
        />

        {/* ── 비탈면 경사선 ── */}
        <line
          x1={backTopX} y1={topY}
          x2={slopeEndX} y2={botY}
          stroke="#3A3730" strokeWidth="1.2" strokeDasharray="10 4"
        />

        {/* ── 소단 표현 (단 경계마다 수평 소단) ── */}
        {Array.from({ length: n - 1 }, (_, i) => {
          const y = stageTopYs[i + 1]
          const backX = stageBackX(i, false)
          // 소단 수평 거리 (bermPx 만큼 후퇴 — 개념 표현)
          const bermEndX = backX + bermPx * 1.5
          return (
            <g key={i}>
              {/* 소단 수평선 */}
              <line x1={backX} y1={y} x2={bermEndX} y2={y}
                stroke="#6B6560" strokeWidth="1" />
              {/* 소단 상부 경사 연결 */}
              <line x1={bermEndX} y1={y} x2={bermEndX} y2={y - 4}
                stroke="#6B6560" strokeWidth="0.7" />
            </g>
          )
        })}

        {/* ── 기초 ── */}
        <rect
          x={stageFrontX(n - 1, false) - 6}
          y={botY - foundH}
          width={foundW}
          height={foundH}
          fill="#D0CCC4" stroke="#3A3730" strokeWidth="1.2"
        />

        {/* ── 패널 벽체 (단별 사각형, 내부 해칭) ── */}
        {Array.from({ length: n }, (_, i) => {
          const x0f = stageFrontX(i, true)
          const x1f = stageFrontX(i, false)
          const x0b = stageBackX(i, true)
          const x1b = stageBackX(i, false)
          const y0 = stageTopYs[i]
          const y1 = stageTopYs[i + 1]
          const pts = `${x0f},${y0} ${x0b},${y0} ${x1b},${y1} ${x1f},${y1}`

          return (
            <g key={i}>
              <polygon points={pts}
                fill="#EFEDE8" stroke="#1A1915" strokeWidth="1.3" />
              {/* 단 내부 미세 패턴 */}
              <polygon points={pts}
                fill="url(#panel-hatch)" opacity={0.3} />
              {/* 단 번호 */}
              <text
                x={(x0f + x0b) / 2 + (x1f + x1b) / 2 / 2 - (x0f + x0b) / 4}
                y={(y0 + y1) / 2 + 4}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8" fill="#8B857A" textAnchor="middle"
              >{i + 1}</text>
            </g>
          )
        })}

        {/* ── 보강재 오버레이 ── */}
        <ReinforcementOverlay
          method={method}
          stageTopYs={stageTopYs}
          wallFaceXs={reinforceFaceXs}
          wallH={H}
          pxPerM={pxPerM}
        />

        {/* ── 치수선 — H ── */}
        <DimLine
          x1={faceBaseX - 28} y1={topY}
          x2={faceBaseX - 28} y2={botY - foundH}
          label={`H=${H.toFixed(1)}m`}
          side="left"
          fontSize={10}
        />

        {/* ── 단 높이 치수 (단 수 많으면 생략) ── */}
        {n <= 6 && (
          <DimLine
            x1={faceBaseX - 14} y1={topY}
            x2={faceBaseX - 14} y2={topY + stageHpx}
            label={`${(H / n).toFixed(1)}m`}
            side="left"
            fontSize={8}
          />
        )}

        {/* ── 경사각 θ 표기 ── */}
        {slopeRun > 30 && (
          <g>
            {/* 각도 호 */}
            <path
              d={`M ${backTopX + 25},${topY} A 25 25 0 0 1 ${backTopX + 25 * Math.cos(Math.PI / 2 - thetaRad)},${topY + 25 * Math.sin(Math.PI / 2 - thetaRad)}`}
              fill="none" stroke="#4A7FA5" strokeWidth="0.8"
            />
            <text
              x={backTopX + 32}
              y={topY + 22}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10" fill="#4A7FA5"
            >θ={theta}°</text>
          </g>
        )}

        {/* ── 단수 라벨 ── */}
        <text
          x={(stageFrontX(0, true) + stageBackX(0, true)) / 2}
          y={topY - 10}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10" fill="#8B857A" textAnchor="middle"
        >n={n}</text>

        {/* ── 공법 라벨 ── */}
        <text
          x={PAD.l} y={PAD.t - 18}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="11" fill={method ? 'var(--accent)' : '#8B857A'}
          letterSpacing="0.05em"
        >{methodLabel}</text>

        {/* ── 시공방법 뱃지 ── */}
        {consLabel && (
          <g>
            <rect x={W - PAD.r - 90} y={PAD.t - 32} width={90} height={18}
              rx={2} fill="var(--bg-sidebar)" stroke="var(--border)" />
            <text x={W - PAD.r - 45} y={PAD.t - 19}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10" fill="#4A4740" textAnchor="middle"
            >{consLabel}</text>
          </g>
        )}

        {/* ── 범례 ── */}
        <Legend method={method} x={PAD.l} y={H_SVG - 36} />

        {/* ── 단면도 제목 ── */}
        <text
          x={W / 2} y={PAD.t - 18}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill="#8B857A" textAnchor="middle"
          letterSpacing="0.12em"
        >단면 모식도 — SECTION SCHEMATIC</text>
      </svg>
    </div>
  )
}
