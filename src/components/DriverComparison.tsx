import React, { useMemo } from 'react';
import { CircuitData, SpeedUnit } from '../types/telemetry';
import { formatSpeed } from '../utils/colormaps';
import { ArrowUpRight, ArrowDownRight, GitCompare } from 'lucide-react';

interface DriverComparisonProps {
  circuit: CircuitData;
  currentIndex: number;
  onSeek: (index: number) => void;
  speedUnit: SpeedUnit;
}

export const DriverComparison: React.FC<DriverComparisonProps> = ({
  circuit,
  currentIndex,
  onSeek,
  speedUnit,
}) => {
  const d1 = circuit.primaryDriver;
  const d2 = circuit.comparisonDriver || circuit.primaryDriver;

  const t1 = d1.telemetry;
  const t2 = d2.telemetry;

  const pt1 = t1[currentIndex] || t1[0];
  const pt2 = t2[currentIndex] || t2[0];

  const maxDistance = t1[t1.length - 1]?.distance || 5000;
  const maxSpeed = Math.max(...t1.map(p => p.speed), ...t2.map(p => p.speed), 350);

  const chartWidth = 900;
  const chartHeight = 220;

  const toChartX = (dist: number) => (dist / maxDistance) * chartWidth;
  const toSpeedY = (spd: number) => chartHeight - (spd / maxSpeed) * chartHeight;

  // Paths
  const pathD1 = useMemo(() => {
    return t1
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toSpeedY(p.speed).toFixed(1)}`)
      .join(' ');
  }, [t1, maxSpeed, maxDistance]);

  const pathD2 = useMemo(() => {
    return t2
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toSpeedY(p.speed).toFixed(1)}`)
      .join(' ');
  }, [t2, maxSpeed, maxDistance]);

  // Speed Delta line (center line at Y = 50, +30km/h up, -30km/h down)
  const deltaChartHeight = 90;
  const toDeltaY = (delta: number) => {
    const clamped = Math.max(-25, Math.min(25, delta));
    return deltaChartHeight / 2 - (clamped / 25) * (deltaChartHeight / 2);
  };

  const pathDelta = useMemo(() => {
    return t1
      .map((p, i) => {
        const p2 = t2[i] || p;
        const delta = p.speed - p2.speed;
        return `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toDeltaY(delta).toFixed(1)}`;
      })
      .join(' ');
  }, [t1, t2, maxDistance]);

  const cursorX = toChartX(pt1.distance);
  const currentDelta = pt1.speed - pt2.speed;

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetDist = ratio * maxDistance;
    let closestIdx = 0;
    let minDiff = Infinity;
    t1.forEach((p, idx) => {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    onSeek(closestIdx);
  };

  // Stats
  const d1MaxSpeed = Math.max(...t1.map(p => p.speed));
  const d2MaxSpeed = Math.max(...t2.map(p => p.speed));
  const d1MinSpeed = Math.min(...t1.map(p => p.speed));
  const d2MinSpeed = Math.min(...t2.map(p => p.speed));

  return (
    <div className="flex flex-col gap-6">
      {/* Driver Cards Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver 1 Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5  relative overflow-hidden">
          <div
            className="absolute top-0 left-0 bottom-0 w-1.5"
            style={{ backgroundColor: d1.teamColor }}
          />
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-medium text-white tracking-tight">{d1.driverName}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  #{d1.driverNumber} · {d1.driverCode}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                {d1.team} · {d1.carModel} · {d1.compound} Tyre
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono  text-slate-500 block">Qualifying time</span>
              <span className="text-2xl font-medium font-mono text-white tabular-nums">
                {d1.lapTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
            <div>
              <span className="text-xs text-slate-500 block ">Current Speed</span>
              <span className="font-medium text-cyan-400 tabular-nums">
                {formatSpeed(pt1.speed, speedUnit)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block ">Max Speed</span>
              <span className="font-medium text-white tabular-nums">
                {formatSpeed(d1MaxSpeed, speedUnit)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block ">Min Apex Speed</span>
              <span className="font-medium text-slate-300 tabular-nums">
                {formatSpeed(d1MinSpeed, speedUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* Driver 2 Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5  relative overflow-hidden">
          <div
            className="absolute top-0 left-0 bottom-0 w-1.5"
            style={{ backgroundColor: d2.teamColor }}
          />
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-medium text-white tracking-tight">{d2.driverName}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  #{d2.driverNumber} · {d2.driverCode}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                {d2.team} · {d2.carModel} · {d2.compound} Tyre
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono  text-slate-500 block">Qualifying time</span>
              <span className="text-2xl font-medium font-mono text-white tabular-nums">
                {d2.lapTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
            <div>
              <span className="text-xs text-slate-500 block ">Current Speed</span>
              <span className="font-medium text-rose-400 tabular-nums">
                {formatSpeed(pt2.speed, speedUnit)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block ">Max Speed</span>
              <span className="font-medium text-white tabular-nums">
                {formatSpeed(d2MaxSpeed, speedUnit)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block ">Min Apex Speed</span>
              <span className="font-medium text-slate-300 tabular-nums">
                {formatSpeed(d2MinSpeed, speedUnit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual Speed Overlay Chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 ">
        <div className="flex flex-wrap gap-3 items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-medium text-white tracking-tight">Direct Speed Overlay</h3>
              <p className="text-xs text-slate-400 font-mono">
                Comparing corner entry, apex minimums, and straight-line top speeds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-2 font-medium" style={{ color: d1.teamColor }}>
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: d1.teamColor }} />
              {d1.driverCode} ({formatSpeed(pt1.speed, speedUnit)})
            </span>
            <span className="flex items-center gap-2 font-medium" style={{ color: d2.teamColor }}>
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: d2.teamColor }} />
              {d2.driverCode} ({formatSpeed(pt2.speed, speedUnit)})
            </span>
          </div>
        </div>

        <div className="relative w-full h-[220px] bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full cursor-crosshair"
            onClick={handleChartClick}
          >
            {/* Grid */}
            {[100, 200, 300].map(s => (
              <g key={`grid-d-${s}`}>
                <line
                  x1="0"
                  y1={toSpeedY(s)}
                  x2={chartWidth}
                  y2={toSpeedY(s)}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2,4"
                />
                <text x="6" y={toSpeedY(s) - 3} fill="#475569" fontSize="9" fontFamily="monospace">
                  {s}
                </text>
              </g>
            ))}

            {/* Driver 2 Curve */}
            <path
              d={pathD2}
              fill="none"
              stroke={d2.teamColor}
              strokeWidth="2"
              strokeDasharray="4,2"
              strokeLinecap="round"
            />

            {/* Driver 1 Curve */}
            <path
              d={pathD1}
              fill="none"
              stroke={d1.teamColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Cursor Line */}
            <line
              x1={cursorX}
              y1="0"
              x2={cursorX}
              y2={chartHeight}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
          </svg>
        </div>

        {/* Delta Trace Chart */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-slate-300 font-semibold">SPEED DELTA (Δv = {d1.driverCode} - {d2.driverCode})</span>
            <span
              className={`font-medium tabular-nums flex items-center gap-1 ${
                currentDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {currentDelta >= 0 ? '+' : ''}{formatSpeed(currentDelta, speedUnit)}
            </span>
          </div>
          <div className="relative w-full h-[90px] bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${deltaChartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair"
              onClick={handleChartClick}
            >
              {/* Center Zero Line */}
              <line
                x1="0"
                y1={deltaChartHeight / 2}
                x2={chartWidth}
                y2={deltaChartHeight / 2}
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Delta Curve */}
              <path
                d={pathDelta}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Cursor Line */}
              <line
                x1={cursorX}
                y1="0"
                x2={cursorX}
                y2={deltaChartHeight}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
