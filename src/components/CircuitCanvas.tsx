import React, { useMemo, useState, useRef } from 'react';
import { CircuitData, ColormapType, SpeedUnit, TelemetryPoint } from '../types/telemetry';
import { getColormapColor, formatSpeed } from '../utils/colormaps';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Layers, Flame, AlertCircle } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: CircuitData;
  currentIndex: number;
  onSeek: (index: number) => void;
  colormap: ColormapType;
  onChangeColormap: (cmap: ColormapType) => void;
  speedUnit: SpeedUnit;
  showBrakingZones: boolean;
  setShowBrakingZones: (show: boolean) => void;
  showHighSpeed: boolean;
  setShowHighSpeed: (show: boolean) => void;
  showCorners: boolean;
  setShowCorners: (show: boolean) => void;
  showSectors: boolean;
  setShowSectors: (show: boolean) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  currentIndex,
  onSeek,
  colormap,
  onChangeColormap,
  speedUnit,
  showBrakingZones,
  setShowBrakingZones,
  showHighSpeed,
  setShowHighSpeed,
  showCorners,
  setShowCorners,
  showSectors,
  setShowSectors,
}) => {
  const telemetry = circuit.primaryDriver.telemetry;
  const currentPoint = telemetry[currentIndex] || telemetry[0];

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute bounding box
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minSpeed = Infinity;
    let maxSpeed = -Infinity;

    telemetry.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      if (pt.speed < minSpeed) minSpeed = pt.speed;
      if (pt.speed > maxSpeed) maxSpeed = pt.speed;
    });

    const paddingX = (maxX - minX) * 0.12;
    const paddingY = (maxY - minY) * 0.12;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY,
      width: (maxX - minX) + paddingX * 2,
      height: (maxY - minY) + paddingY * 2,
      minSpeed: Math.floor(minSpeed),
      maxSpeed: Math.ceil(maxSpeed),
    };
  }, [telemetry]);

  // Coordinate transformation: maps circuit (X, Y) to SVG space (viewBox 0 0 1000 680)
  const viewBoxWidth = 1000;
  const viewBoxHeight = 680;

  const toSvgX = (x: number) => {
    return ((x - bounds.minX) / bounds.width) * viewBoxWidth;
  };

  // Flip Y coordinate so circuit orientation matches reality
  const toSvgY = (y: number) => {
    return viewBoxHeight - ((y - bounds.minY) / bounds.height) * viewBoxHeight;
  };

  // Pre-calculate colored SVG line segments
  const segments = useMemo(() => {
    const list: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      speed: number;
      index: number;
      point: TelemetryPoint;
    }> = [];

    for (let i = 0; i < telemetry.length - 1; i++) {
      const p1 = telemetry[i];
      const p2 = telemetry[i + 1];
      const avgSpeed = (p1.speed + p2.speed) / 2;
      const { hex } = getColormapColor(colormap, avgSpeed, bounds.minSpeed, bounds.maxSpeed);

      list.push({
        x1: toSvgX(p1.x),
        y1: toSvgY(p1.y),
        x2: toSvgX(p2.x),
        y2: toSvgY(p2.y),
        color: hex,
        speed: avgSpeed,
        index: i,
        point: p1,
      });
    }
    return list;
  }, [telemetry, colormap, bounds]);

  // Calculate car heading angle in degrees
  const carAngle = useMemo(() => {
    const nextPt = telemetry[Math.min(telemetry.length - 1, currentIndex + 1)];
    const prevPt = telemetry[Math.max(0, currentIndex - 1)];
    const dx = toSvgX(nextPt.x) - toSvgX(prevPt.x);
    const dy = toSvgY(nextPt.y) - toSvgY(prevPt.y);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, [currentIndex, telemetry]);

  // Handle pan & zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Colormap colorbar gradient ticks
  const colorbarStops = useMemo(() => {
    const stops: Array<{ pct: number; color: string; speed: number }> = [];
    const count = 10;
    for (let i = 0; i <= count; i++) {
      const pct = (i / count) * 100;
      const speedVal = bounds.minSpeed + (i / count) * (bounds.maxSpeed - bounds.minSpeed);
      const { hex } = getColormapColor(colormap, speedVal, bounds.minSpeed, bounds.maxSpeed);
      stops.push({ pct, color: hex, speed: speedVal });
    }
    return stops;
  }, [colormap, bounds]);

  return (
    <div className="map-panel relative flex flex-col w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden  select-none">
      {/* Top Bar HUD within Canvas */}
      <div className="map-toolbar flex flex-wrap items-center justify-between gap-3">
        {/* Left: Circuit Info & Driver Lap */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-lg  ">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white ">{circuit.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium bg-red-600/20 text-red-400 border border-red-500/30">
                {circuit.sessionType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
              <span style={{ color: circuit.primaryDriver.teamColor }} className="font-semibold">
                {circuit.primaryDriver.driverName} ({circuit.primaryDriver.driverCode})
              </span>
              <span>·</span>
              <span className="text-slate-300 font-medium">{circuit.primaryDriver.lapTime}</span>
              <span>·</span>
              <span>{(circuit.circuitLengthM / 1000).toFixed(3)} km</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Layer Visibility Controls */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg  ">
          <button
            onClick={() => setShowBrakingZones(!showBrakingZones)}
            className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showBrakingZones
                ? 'bg-slate-700 text-slate-100 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Braking Zones markers"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="whitespace-nowrap">Braking Zones</span>
          </button>

          <button
            onClick={() => setShowHighSpeed(!showHighSpeed)}
            className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showHighSpeed
                ? 'bg-slate-700 text-slate-100 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle High-Speed Sections markers"
          >
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span className="whitespace-nowrap">High-Speed</span>
          </button>

          <button
            onClick={() => setShowCorners(!showCorners)}
            className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showCorners
                ? 'bg-slate-700 text-slate-100 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Corner Names & Numbers"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">Corners</span>
          </button>

          <button
            onClick={() => setShowSectors(!showSectors)}
            className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              showSectors
                ? 'bg-slate-700 text-slate-100 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Sector Split Lines"
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span className="whitespace-nowrap">Sectors</span>
          </button>
        </div>

        {/* Colormap & Unit Controls */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg  ">
          <span className="text-xs font-mono   text-slate-400 pl-1">Colormap</span>
          <div className="flex items-center gap-1">
            {(['viridis', 'turbo', 'plasma', 'speedHeat'] as ColormapType[]).map(cmap => (
              <button
                key={cmap}
                onClick={() => onChangeColormap(cmap)}
                className={`px-2 py-0.5 text-xs font-mono capitalize rounded transition-colors ${
                  colormap === cmap
                    ? 'bg-slate-700 text-white font-medium border border-slate-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cmap === 'speedHeat' ? 'Heat' : cmap}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'crosshair'} relative`}
      >
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full overflow-visible transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Filter for smooth glowing track effect */}
            <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Colormap Linear Gradient for Colorbar */}
            <linearGradient id="colorbar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {colorbarStops.map(stop => (
                <stop key={stop.pct} offset={`${stop.pct}%`} stopColor={stop.color} />
              ))}
            </linearGradient>

            {/* Checkered pattern for start/finish line */}
            <pattern id="checkered-flag" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="#ffffff" />
              <rect x="3" width="3" height="3" fill="#000000" />
              <rect y="3" width="3" height="3" fill="#000000" />
              <rect x="3" y="3" width="3" height="3" fill="#ffffff" />
            </pattern>
          </defs>

          {/* Background Technical Grid lines */}
          <g opacity="0.12" stroke="#475569" strokeWidth="0.8">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 100} y1="0" x2={i * 100} y2={viewBoxHeight} strokeDasharray="3,6" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`gy-${i}`} x1="0" y1={i * 90} x2={viewBoxWidth} y2={i * 90} strokeDasharray="3,6" />
            ))}
          </g>

          {/* Underlay: Dark Track Asphalt Base */}
          <g>
            {segments.map(seg => (
              <line
                key={`base-${seg.index}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#0f172a"
                strokeWidth="18"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Underlay: Kerb Outline Edge */}
          <g>
            {segments.map(seg => (
              <line
                key={`edge-${seg.index}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Main Speed Colored Segments */}
          <g filter="url(#track-glow)">
            {segments.map(seg => (
              <line
                key={`seg-${seg.index}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={seg.color}
                strokeWidth="6.5"
                strokeLinecap="round"
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={e => {
                  e.stopPropagation();
                  onSeek(seg.index);
                }}
                onMouseEnter={e => {
                  setHoveredPoint(seg.point);
                  setHoveredPos({ x: (seg.x1 + seg.x2) / 2, y: (seg.y1 + seg.y2) / 2 });
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoveredPos(null);
                }}
              />
            ))}
          </g>

          {/* Sectors Split Lines */}
          {showSectors &&
            circuit.sectors.map(sec => {
              const pt = telemetry.find(p => p.distance >= sec.endDistance) || telemetry[telemetry.length - 1];
              const sx = toSvgX(pt.x);
              const sy = toSvgY(pt.y);
              return (
                <g key={`sec-${sec.number}`}>
                  <circle cx={sx} cy={sy} r="6" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
                  <line
                    x1={sx - 15}
                    y1={sy - 15}
                    x2={sx + 15}
                    y2={sy + 15}
                    stroke="#d8b4fe"
                    strokeWidth="3"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={sx + 12}
                    y={sy - 10}
                    fill="#e9d5ff"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none"
                  >
                    Sector {sec.number} split ({sec.splitTime.toFixed(3)}s)
                  </text>
                </g>
              );
            })}

          {/* High-Speed Sections Glow Highlights */}
          {showHighSpeed &&
            circuit.highSpeedSections.map(hs => {
              const startX = toSvgX(hs.startX);
              const startY = toSvgY(hs.startY);
              return (
                <g key={hs.id}>
                  {/* High Speed Marker Pill */}
                  <circle cx={startX} cy={startY} r="8" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                  <rect
                    x={startX + 12}
                    y={startY - 14}
                    width="116"
                    height="28"
                    rx="4"
                    fill="#082f49"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />
                  <text
                    x={startX + 18}
                    y={startY - 1}
                    fill="#7dd3fc"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {hs.hasDRS ? 'DRS straight' : 'High speed'}
                  </text>
                  <text
                    x={startX + 18}
                    y={startY + 10}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {formatSpeed(hs.peakSpeed, speedUnit)}
                  </text>
                </g>
              );
            })}

          {/* Braking Zones Deceleration Callouts */}
          {showBrakingZones &&
            circuit.brakingZones.map(bz => {
              const bx = toSvgX(bz.startX);
              const by = toSvgY(bz.startY);
              const ax = toSvgX(bz.apexX);
              const ay = toSvgY(bz.apexY);

              return (
                <g key={bz.id} className="cursor-pointer" onClick={() => onSeek(telemetry.findIndex(p => p.distance >= bz.startDistance))}>
                  {/* Braking connector arc */}
                  <line
                    x1={bx}
                    y1={by}
                    x2={ax}
                    y2={ay}
                    stroke="#ef4444"
                    strokeWidth="4"
                    strokeDasharray="4,4"
                    opacity="0.8"
                  />

                  {/* Braking point marker */}
                  <circle cx={bx} cy={by} r="9" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />

                  {/* Deceleration Callout Card */}
                  <rect
                    x={bx + 14}
                    y={by - 26}
                    width="134"
                    height="42"
                    rx="5"
                    fill="#450a0a"
                    stroke="#b91c1c"
                    strokeWidth="1.4"
                  />
                  <text
                    x={bx + 20}
                    y={by - 12}
                    fill="#fca5a5"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {bz.name}
                  </text>
                  <text
                    x={bx + 20}
                    y={by + 1}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    -{formatSpeed(bz.speedDelta, speedUnit)}
                  </text>
                  <text
                    x={bx + 20}
                    y={by + 11}
                    fill="#f87171"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {bz.decelerationG}G · {bz.gearDrop}
                  </text>
                </g>
              );
            })}

          {/* Turn / Corner Markers */}
          {showCorners &&
            circuit.corners.map(c => {
              const cx = toSvgX(c.x);
              const cy = toSvgY(c.y);
              return (
                <g key={`corner-${c.number}`}>
                  <circle cx={cx} cy={cy} r="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    T{c.number}
                  </text>
                  <text
                    x={cx}
                    y={cy - 14}
                    textAnchor="middle"
                    fill="#fef3c7"
                    fontSize="9"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    className="select-none"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}

          {/* Start / Finish Checkered Line */}
          {(() => {
            const startPt = telemetry[0];
            const sx = toSvgX(startPt.x);
            const sy = toSvgY(startPt.y);
            return (
              <g>
                <rect x={sx - 12} y={sy - 4} width="24" height="8" fill="url(#checkered-flag)" stroke="#ffffff" strokeWidth="1" />
                <text
                  x={sx}
                  y={sy + 18}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Start / finish
                </text>
              </g>
            );
          })()}

          {/* Interactive Live Car Marker on Circuit */}
          {(() => {
            const carX = toSvgX(currentPoint.x);
            const carY = toSvgY(currentPoint.y);

            return (
              <g transform={`translate(${carX}, ${carY}) rotate(${carAngle})`}>
                {/* Car Velocity Trail & Radar Pulse */}
                <circle cx="0" cy="0" r="16" fill={circuit.primaryDriver.teamColor} opacity="0.35" />
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke={circuit.primaryDriver.teamColor} strokeWidth="3" />

                {/* Arrow pointing in forward driving direction */}
                <polygon
                  points="14,0 4,-6 6,0 4,6"
                  fill="#ffffff"
                  stroke={circuit.primaryDriver.teamColor}
                  strokeWidth="1.5"
                />

                {/* Speed HUD tag anchored to the car */}
                <g transform={`rotate(${-carAngle}) translate(0, -26)`}>
                  <rect
                    x="-38"
                    y="-12"
                    width="76"
                    height="22"
                    rx="4"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {formatSpeed(currentPoint.speed, speedUnit)}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Hover Tooltip Probe */}
          {hoveredPoint && hoveredPos && (
            <g transform={`translate(${hoveredPos.x}, ${hoveredPos.y - 45})`} pointerEvents="none">
              <rect
                x="-75"
                y="-30"
                width="150"
                height="56"
                rx="6"
                fill="#020617"
                stroke="#475569"
                strokeWidth="1.2"
                opacity="0.95"
              />
              <text x="0" y="-14" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                X: {Math.round(hoveredPoint.x)}m · Y: {Math.round(hoveredPoint.y)}m
              </text>
              <text x="0" y="2" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                {formatSpeed(hoveredPoint.speed, speedUnit)}
              </text>
              <text x="0" y="18" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                Gear {hoveredPoint.gear} · Thr {hoveredPoint.throttle}% · Brk {hoveredPoint.brake}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset) */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg  ">
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.25))}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.6, z - 0.25))}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Colorbar / Speed Legend */}
      <div className="absolute bottom-4 left-4 right-20 z-20 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-lg  ">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
          <span className="flex items-center gap-2 font-semibold text-slate-300">
            <span>Speed Scale ({speedUnit})</span>
            <span className="text-xs text-slate-500 font-normal">· Speed colormap</span>
          </span>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="text-blue-400">Min: {formatSpeed(bounds.minSpeed, speedUnit)}</span>
            <span className="text-yellow-400">Max: {formatSpeed(bounds.maxSpeed, speedUnit)}</span>
          </div>
        </div>
        <div className="h-3 w-full rounded-md border border-slate-700/60 overflow-hidden" style={{ background: 'url(#colorbar-gradient)' }}>
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to right, ${colorbarStops.map(s => `${s.color} ${s.pct}%`).join(', ')})`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-slate-500 mt-1 tabular-nums">
          <span>{formatSpeed(bounds.minSpeed, speedUnit)} (Heavy Apex)</span>
          <span>{formatSpeed((bounds.minSpeed + bounds.maxSpeed) / 2, speedUnit)}</span>
          <span>{formatSpeed(bounds.maxSpeed, speedUnit)} (Vmax Straight)</span>
        </div>
      </div>
    </div>
  );
};
