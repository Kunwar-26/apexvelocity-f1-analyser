import React, { useMemo } from 'react';
import { CircuitData, SpeedUnit } from '../types/telemetry';
import { formatSpeed } from '../utils/colormaps';

interface TelemetryChartsProps {
  circuit: CircuitData;
  currentIndex: number;
  onSeek: (index: number) => void;
  speedUnit: SpeedUnit;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  circuit,
  currentIndex,
  onSeek,
  speedUnit,
}) => {
  const telemetry = circuit.primaryDriver.telemetry;
  const currentPoint = telemetry[currentIndex] || telemetry[0];
  const maxDistance = telemetry[telemetry.length - 1]?.distance || 5000;

  // Chart dimensions
  const chartWidth = 900;
  const speedChartHeight = 160;
  const pedalChartHeight = 90;
  const gearChartHeight = 70;

  // Compute scale boundaries
  const maxSpeed = useMemo(() => {
    return Math.max(...telemetry.map(p => p.speed), 360);
  }, [telemetry]);

  const toChartX = (distance: number) => {
    return (distance / maxDistance) * chartWidth;
  };

  const toSpeedY = (speed: number) => {
    return speedChartHeight - (speed / maxSpeed) * speedChartHeight;
  };

  const toPedalY = (val: number) => {
    return pedalChartHeight - (val / 100) * pedalChartHeight;
  };

  const toGearY = (gear: number) => {
    return gearChartHeight - (gear / 8) * gearChartHeight;
  };

  // Generate SVG path strings
  const speedPath = useMemo(() => {
    return telemetry
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toSpeedY(p.speed).toFixed(1)}`)
      .join(' ');
  }, [telemetry, maxSpeed, maxDistance]);

  const throttlePath = useMemo(() => {
    return telemetry
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toPedalY(p.throttle).toFixed(1)}`)
      .join(' ');
  }, [telemetry, maxDistance]);

  const brakePath = useMemo(() => {
    return telemetry
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toPedalY(p.brake).toFixed(1)}`)
      .join(' ');
  }, [telemetry, maxDistance]);

  const gearPath = useMemo(() => {
    return telemetry
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.distance).toFixed(1)} ${toGearY(p.gear).toFixed(1)}`)
      .join(' ');
  }, [telemetry, maxDistance]);

  const cursorX = toChartX(currentPoint.distance);

  // Handle clicking on charts to seek
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDist = clickRatio * maxDistance;

    // Find nearest point
    let closestIdx = 0;
    let minDiff = Infinity;
    telemetry.forEach((p, idx) => {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    onSeek(closestIdx);
  };

  return (
    <div className="traces-panel bg-slate-950 border border-slate-800 rounded-xl p-5  select-none">
      <div className="flex flex-wrap gap-4 items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-medium text-white tracking-tight">Telemetry traces</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Select a point on a trace to inspect the lap
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-slate-200 flex items-center gap-2 font-semibold">
            <span className="w-2.5 h-0.5 bg-slate-200 inline-block" /> Speed ({formatSpeed(currentPoint.speed, speedUnit)})
          </span>
          <span className="text-emerald-400 flex items-center gap-2 font-semibold">
            <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Throttle ({currentPoint.throttle}%)
          </span>
          <span className="text-rose-400 flex items-center gap-2 font-semibold">
            <span className="w-2.5 h-0.5 bg-rose-400 inline-block" /> Brake ({currentPoint.brake}%)
          </span>
          <span className="text-amber-400 flex items-center gap-2 font-semibold">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Gear ({currentPoint.gear})
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Trace 1: Speed (km/h vs Distance) */}
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Speed / distance</span>
            <span className="text-slate-500">Max: {Math.round(maxSpeed)} km/h</span>
          </div>
          <div className="relative w-full h-[240px] bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${speedChartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair"
              onClick={handleSvgClick}
            >
              {/* Horizontal Reference Grid Lines */}
              {[100, 200, 300].map(s => (
                <g key={`sp-grid-${s}`}>
                  <line
                    x1="0"
                    y1={toSpeedY(s)}
                    x2={chartWidth}
                    y2={toSpeedY(s)}
                    stroke="#303235"
                    strokeWidth="1"
                    strokeDasharray="2,4"
                  />
                  <text x="6" y={toSpeedY(s) - 3} fill="#999ca1" fontSize="9" fontFamily="monospace">
                    {s}
                  </text>
                </g>
              ))}

              {/* Sector Divider Lines */}
              {circuit.sectors.map(sec => {
                const sx = toChartX(sec.endDistance);
                return (
                  <line
                    key={`sec-line-${sec.number}`}
                    x1={sx}
                    y1="0"
                    x2={sx}
                    y2={speedChartHeight}
                    stroke="#676b70"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                );
              })}

              {/* Speed Curve */}
              <path
                d={speedPath}
                fill="none"
                stroke="#c8d1d7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Real-time Cursor Line */}
              <line
                x1={cursorX}
                y1="0"
                x2={cursorX}
                y2={speedChartHeight}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
              <circle
                cx={cursorX}
                cy={toSpeedY(currentPoint.speed)}
                r="4.5"
                fill="#ffffff"
                stroke="#c8d1d7"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Trace 2: Throttle & Brake Pedals (0 - 100% vs Distance) */}
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Pedal inputs</span>
            <span className="text-slate-500">0% – 100%</span>
          </div>
          <div className="relative w-full h-[96px] bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${pedalChartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair"
              onClick={handleSvgClick}
            >
              {/* Midline */}
              <line
                x1="0"
                y1={toPedalY(50)}
                x2={chartWidth}
                y2={toPedalY(50)}
                stroke="#303235"
                strokeWidth="1"
                strokeDasharray="2,4"
              />

              {/* Sector Divider Lines */}
              {circuit.sectors.map(sec => {
                const sx = toChartX(sec.endDistance);
                return (
                  <line
                    key={`sec-line-p-${sec.number}`}
                    x1={sx}
                    y1="0"
                    x2={sx}
                    y2={pedalChartHeight}
                    stroke="#676b70"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                );
              })}

              {/* Throttle (Green) */}
              <path
                d={throttlePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Brake (Red) */}
              <path
                d={brakePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Cursor Line */}
              <line
                x1={cursorX}
                y1="0"
                x2={cursorX}
                y2={pedalChartHeight}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </svg>
          </div>
        </div>

        {/* Trace 3: Gear (1 to 8 vs Distance) */}
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Gear selection (1 - 8)</span>
            <span className="text-slate-500">Current: Gear {currentPoint.gear}</span>
          </div>
          <div className="relative w-full h-[72px] bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${gearChartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full cursor-crosshair"
              onClick={handleSvgClick}
            >
              {/* Sector Divider Lines */}
              {circuit.sectors.map(sec => {
                const sx = toChartX(sec.endDistance);
                return (
                  <line
                    key={`sec-line-g-${sec.number}`}
                    x1={sx}
                    y1="0"
                    x2={sx}
                    y2={gearChartHeight}
                    stroke="#676b70"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                );
              })}

              {/* Gear step curve */}
              <path
                d={gearPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Cursor Line */}
              <line
                x1={cursorX}
                y1="0"
                x2={cursorX}
                y2={gearChartHeight}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </svg>
          </div>
          <div className="trace-axis flex justify-between text-xs font-mono text-slate-500 mt-2">
            <span>0 m</span>
            <span>{(maxDistance * 0.25).toFixed(0)}m</span>
            <span>{(maxDistance * 0.5).toFixed(0)}m</span>
            <span>{(maxDistance * 0.75).toFixed(0)}m</span>
            <span>{maxDistance.toFixed(0)}m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
