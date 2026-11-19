import React from 'react';
import { CircuitData, SpeedUnit } from '../types/telemetry';
import { formatSpeed } from '../utils/colormaps';
import { AlertCircle, Flame, Navigation, ArrowDownRight, Zap } from 'lucide-react';

interface BrakingZonesInspectorProps {
  circuit: CircuitData;
  onJumpToDistance: (distance: number) => void;
  speedUnit: SpeedUnit;
}

export const BrakingZonesInspector: React.FC<BrakingZonesInspectorProps> = ({
  circuit,
  onJumpToDistance,
  speedUnit,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 ">
          <span className="text-xs font-mono  text-slate-400 block">Total Braking Events</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-medium font-mono text-rose-500 tabular-nums">
              {circuit.brakingZones.length}
            </span>
            <span className="text-xs font-mono text-slate-500">Zones</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 ">
          <span className="text-xs font-mono  text-slate-400 block">Peak Deceleration</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-medium font-mono text-white tabular-nums">
              {Math.min(...circuit.brakingZones.map(b => b.decelerationG))}G
            </span>
            <span className="text-xs font-mono text-rose-400">Heavy stopping</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 ">
          <span className="text-xs font-mono  text-slate-400 block">Circuit Top Velocity</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-medium font-mono text-cyan-400 tabular-nums">
              {formatSpeed(Math.max(...circuit.highSpeedSections.map(h => h.peakSpeed)), speedUnit)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 ">
          <span className="text-xs font-mono  text-slate-400 block">Fastest Flat-Out Section</span>
          <div className="mt-1 text-sm font-medium text-slate-200 truncate">
            {circuit.highSpeedSections[0]?.name || 'Main Straight'}
          </div>
          <span className="text-xs font-mono text-slate-500">
            {circuit.highSpeedSections[0]?.lengthM}m full throttle
          </span>
        </div>
      </div>

      {/* Two-Column Analysis: Braking Zones vs High-Speed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Braking Zones */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 ">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white tracking-tight">Deceleration & Braking Zones</h3>
              <p className="text-xs text-slate-400 font-mono">
                Aerodynamic load, mechanical grip, and gear downshifts
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {circuit.brakingZones.map(bz => (
              <div
                key={bz.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 rounded-lg p-4 transition-colors duration-150 flex flex-col gap-3 group"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-medium flex items-center justify-center">
                      T{bz.cornerNumber}
                    </span>
                    <span className="font-semibold text-white text-sm">{bz.name}</span>
                  </div>

                  <button
                    onClick={() => onJumpToDistance(bz.startDistance)}
                    className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Jump to Stop</span>
                  </button>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div>
                    <span className="text-xs text-slate-500 block ">Speed Drop</span>
                    <span className="font-medium text-rose-400 tabular-nums flex items-center gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      -{formatSpeed(bz.speedDelta, speedUnit)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {formatSpeed(bz.entrySpeed, speedUnit)} → {formatSpeed(bz.minSpeed, speedUnit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block ">Deceleration</span>
                    <span className="font-medium text-white tabular-nums">
                      {bz.decelerationG} G
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {bz.gearDrop}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block ">Stopping Dist</span>
                    <span className="font-medium text-slate-300 tabular-nums">
                      {bz.brakingDistanceM} meters
                    </span>
                    <span className="text-xs text-slate-500 block">
                      at {bz.startDistance}m mark
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: High-Speed Sections */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 ">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white tracking-tight">High-Speed & Flat-Out Sections</h3>
              <p className="text-xs text-slate-400 font-mono">
                Full-throttle straights, DRS activation, and high-G sweepers
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {circuit.highSpeedSections.map(hs => (
              <div
                key={hs.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 rounded-lg p-4 transition-colors duration-150 flex flex-col gap-3 group"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{hs.name}</span>
                    {hs.hasDRS && (
                      <span className="flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Zap className="w-3 h-3" /> DRS ZONE
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onJumpToDistance(hs.startDistance)}
                    className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Jump to Run</span>
                  </button>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div>
                    <span className="text-xs text-slate-500 block ">Peak Velocity</span>
                    <span className="font-medium text-cyan-400 tabular-nums">
                      {formatSpeed(hs.peakSpeed, speedUnit)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Avg: {formatSpeed(hs.avgSpeed, speedUnit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block ">Length</span>
                    <span className="font-medium text-white tabular-nums">
                      {hs.lengthM} meters
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Full Throttle
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block ">Track Range</span>
                    <span className="font-medium text-slate-300 tabular-nums">
                      {hs.startDistance}m – {hs.endDistance}m
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Sector position
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
