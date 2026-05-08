export interface WallParams {
  height: number      // 옹벽 높이 H (m)
  length: number      // 연장 L (m) — 정면도용
  stages: number      // 단수 n
  slopeAngle: number  // 비탈면 경사각 θ (°)
  wallThick: number   // 패널 두께 t (m)
  method: 'PSP' | 'PPP' | 'mixed' | ''
  construction: 'top-down' | 'bottom-up' | 'unknown' | ''
}

interface Props {
  params: WallParams
}

const W = 480
const H_SVG = 360
const PAD = { t: 36, r: 24, b: 48, l: 56 }

// 실제 그리기 영역
const DH = H_SVG - PAD.t - PAD.b  // 276

// 치수선 컴포넌트
function DimLine({ x1, y1, x2, y2, label, side = 'right' }: {
  x1: number; y1: number; x2: number; y2: number
  label: string; side?: 'right' | 'left' | 'top' | 'bottom'
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const offset = 10
  const tx = side === 'right' ? mx + offset : side === 'left' ? mx - offset : mx
  const ty = side === 'top' ? my - offset : side === 'bottom' ? my + offset + 4 : my + 4

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B857A" strokeWidth="0.8" strokeDasharray="3 2" />
      {/* 끝점 tick */}
      {(side === 'right' || side === 'left') && <>
        <line x1={x1-4} y1={y1} x2={x1+4} y2={y1} stroke="#8B857A" strokeWidth="0.8" />
        <line x1={x2-4} y1={y2} x2={x2+4} y2={y2} stroke="#8B857A" strokeWidth="0.8" />
      </>}
      {(side === 'top' || side === 'bottom') && <>
        <line x1={x1} y1={y1-4} x2={x1} y2={y1+4} stroke="#8B857A" strokeWidth="0.8" />
        <line x1={x2} y1={y2-4} x2={x2} y2={y2+4} stroke="#8B857A" strokeWidth="0.8" />
      </>}
      <text x={tx} y={ty}
        fontFamily="'JetBrains Mono', monospace"
        fontSize="9" fill="#4A4740" textAnchor="middle"
      >{label}</text>
    </g>
  )
}

// 45° 해칭 패턴 (배면토)
function HatchPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#C4BFB5" strokeWidth="1" />
    </pattern>
  )
}

// 네일/앵커 오버레이
function ReinforcementOverlay({ method, stages, wallX, wallTopY, wallBotY }: {
  method: string; stages: number
  wallX: number; wallTopY: number; wallBotY: number
}) {
  if (!method) return null
  const n = Math.max(1, Math.min(stages, 8))
  const spacing = (wallBotY - wallTopY) / (n + 1)

  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const y = wallTopY + spacing * (i + 1)
        const isAnchor = method === 'PPP' || (method === 'mixed' && i % 2 === 1)
        const isPsp = method === 'PSP' || (method === 'mixed' && i % 2 === 0)
        const len = isAnchor ? 90 : 55
        const color = isAnchor ? '#4A7FA5' : '#D97757'

        return (
          <g key={i}>
            {/* 보강재 선 */}
            <line
              x1={wallX} y1={y}
              x2={wallX + len} y2={y - (isAnchor ? len * 0.25 : len * 0.15)}
              stroke={color} strokeWidth={isAnchor ? 1.2 : 1}
              strokeDasharray={isPsp ? '4 2' : 'none'}
            />
            {/* 앵커 정착단 */}
            {isAnchor && (
              <rect
                x={wallX + len - 4}
                y={y - len * 0.25 - 4}
                width={8} height={8}
                fill={color} opacity={0.8}
                rx={1}
              />
            )}
            {/* 두부(head) */}
            <circle cx={wallX} cy={y} r={2.5} fill={color} />
          </g>
        )
      })}
    </>
  )
}

export default function WallSchematic({ params }: Props) {
  const { height, stages, slopeAngle, method, construction } = params

  const H = Math.max(1, height)
  const theta = Math.max(10, Math.min(80, slopeAngle))
  const n = Math.max(1, stages)

  // 좌표 계산 — 단면도
  const originX = PAD.l + 40   // 패널 전면 x
  const botY = PAD.t + DH      // 기초 바닥
  const topY = botY - (DH * Math.min(H, 20) / 20)  // 옹벽 상단 (최대 20m 스케일)

  const wallW = 12             // 패널 두께 (도면상 고정)
  const slopeRun = (botY - topY) / Math.tan((theta * Math.PI) / 180)
  const backfillRight = Math.min(originX + wallW + slopeRun, W - PAD.r)

  // 기초 영역
  const foundH = 14
  const foundW = wallW + 20

  // 라벨
  const methodLabel = method === 'PSP' ? 'PSP — 소일네일 + PS패널'
    : method === 'PPP' ? 'PPP — 영구앵커 + PS패널'
    : method === 'mixed' ? '혼용 — 네일 + 앵커 병행'
    : '공법 미선택'

  const consLabel = construction === 'top-down' ? 'Top-down'
    : construction === 'bottom-up' ? 'Bottom-up'
    : construction === 'unknown' ? '불명'
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* 제목 */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.12em',
        color: 'var(--text-3)',
        padding: '0 0 6px 0',
        textTransform: 'uppercase',
      }}>
        단면 모식도 — Section Schematic
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H_SVG}`} style={{ overflow: 'visible' }}>
        <defs>
          <HatchPattern id="backfill-hatch" />
          <HatchPattern id="ground-hatch" />
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8B857A" />
          </marker>
        </defs>

        {/* 지반선 (하단) */}
        <line
          x1={PAD.l} y1={botY}
          x2={W - PAD.r} y2={botY}
          stroke="#4A4740" strokeWidth="1.5"
        />
        {/* 지반 해칭 */}
        <rect x={PAD.l} y={botY} width={W - PAD.l - PAD.r} height={12} fill="url(#ground-hatch)" opacity={0.5} />

        {/* 배면토 해칭 영역 */}
        <polygon
          points={`
            ${originX + wallW},${topY}
            ${Math.min(backfillRight, W - PAD.r)},${topY}
            ${Math.min(backfillRight, W - PAD.r)},${botY}
            ${originX + wallW},${botY}
          `}
          fill="url(#backfill-hatch)"
          opacity={0.6}
        />

        {/* 비탈면 경사선 */}
        <line
          x1={originX + wallW} y1={topY}
          x2={Math.min(backfillRight, W - PAD.r)} y2={botY}
          stroke="#4A4740" strokeWidth="1" strokeDasharray="6 3"
        />

        {/* 기초 */}
        <rect
          x={originX - 4} y={botY - foundH}
          width={foundW} height={foundH}
          fill="#D8D4CC" stroke="#4A4740" strokeWidth="1"
        />

        {/* 패널 벽체 */}
        <rect
          x={originX} y={topY}
          width={wallW} height={botY - topY - foundH + 2}
          fill="#EFEDE7" stroke="#1A1915" strokeWidth="1.2"
        />

        {/* 단 구분선 */}
        {Array.from({ length: n - 1 }).map((_, i) => {
          const y = topY + ((botY - topY) / n) * (i + 1)
          return (
            <line key={i}
              x1={originX} y1={y}
              x2={originX + wallW} y2={y}
              stroke="#8B857A" strokeWidth="0.5"
            />
          )
        })}

        {/* 보강재 오버레이 */}
        <ReinforcementOverlay
          method={method}
          stages={n}
          wallX={originX + wallW}
          wallTopY={topY}
          wallBotY={botY - foundH}
        />

        {/* 치수선 — 높이 H */}
        <DimLine
          x1={originX - 24} y1={topY}
          x2={originX - 24} y2={botY - foundH}
          label={`H=${H.toFixed(1)}m`}
          side="left"
        />

        {/* 치수선 — 경사각 θ */}
        {slopeRun > 20 && (
          <text
            x={originX + wallW + 14}
            y={topY + 18}
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9" fill="#4A7FA5"
          >θ={theta}°</text>
        )}

        {/* 단수 라벨 */}
        <text
          x={originX + wallW / 2}
          y={topY - 6}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8" fill="#8B857A" textAnchor="middle"
        >n={n}</text>

        {/* 공법 라벨 */}
        <text
          x={PAD.l} y={PAD.t - 8}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9" fill={method ? 'var(--accent)' : '#8B857A'}
        >{methodLabel}</text>

        {/* 시공방법 뱃지 */}
        {consLabel && (
          <g>
            <rect x={W - PAD.r - 64} y={PAD.t - 20} width={64} height={14} rx={2}
              fill="var(--bg-sidebar)" stroke="var(--border)" />
            <text x={W - PAD.r - 32} y={PAD.t - 9}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="8.5" fill="#4A4740" textAnchor="middle"
            >{consLabel}</text>
          </g>
        )}

        {/* 범례 */}
        <g transform={`translate(${PAD.l}, ${H_SVG - 20})`}>
          {method === 'PSP' || method === 'mixed' ? <>
            <line x1={0} y1={6} x2={18} y2={6} stroke="#D97757" strokeWidth="1" strokeDasharray="4 2" />
            <text x={22} y={9} fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#8B857A">네일(PSP)</text>
          </> : null}
          {method === 'PPP' || method === 'mixed' ? <>
            <line x1={method === 'mixed' ? 80 : 0} y1={6} x2={(method === 'mixed' ? 80 : 0) + 18} y2={6}
              stroke="#4A7FA5" strokeWidth="1.2" />
            <rect x={(method === 'mixed' ? 80 : 0) + 14} y={2} width={8} height={8} fill="#4A7FA5" rx={1} opacity={0.8} />
            <text x={(method === 'mixed' ? 80 : 0) + 26} y={9}
              fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#8B857A">앵커(PPP)</text>
          </> : null}
        </g>
      </svg>
    </div>
  )
}
