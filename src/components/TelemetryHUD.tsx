import React from 'react';
import { TelemetryPoint, SpeedUnit } from '../types/telemetry';
import { formatSpeed } from '../utils/colormaps';

interface TelemetryHUDProps {
  point: TelemetryPoint;
  totalDistance: number;
  speedUnit: SpeedUnit;
  onToggleSpeedUnit: () => void;
  driverName: string;
  driverCode: string;
  teamColor: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  point,
  totalDistance,
  speedUnit,
  onToggleSpeedUnit,
  driverName,
  driverCode,
  teamColor,
}) => {
  // 15 LED Rev lights calculation
  // RPM ranges between ~9,000 and 12,500
  const minRPM = 9200;
  const maxRPM = 12400;
  const rpmRatio = Math.max(0, Math.min(1, (point.rpm - minRPM) / (maxRPM - minRPM)));
  const activeLeds = Math.round(rpmRatio * 15);
  const isOptimalShift = point.rpm >= 12100;

  // G-Force friction ball coordinates (-5G to +5G mapped to 50px circle)
  const maxG = 5.5;
  const ballX = 50 + (point.latG / maxG) * 40;
  const ballY = 50 - (point.longG / maxG) * 40; // positive accel points forward/up, braking pulls forward/down

  return (
    <div className="instrument-panel bg-slate-950 border border-slate-800 rounded-xl p-4 ">
      {/* Steering Wheel LED Rev Lights Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Engine rev counter</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-100 tabular-nums">{point.rpm} RPM</span>
          </div>
          {isOptimalShift && (
            <span className="text-xs font-medium text-red-400   ">
              Shift up
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
          {Array.from({ length: 15 }).map((_, i) => {
            const isActive = i < activeLeds;
            let ledColorClass = 'bg-slate-800';

            if (isActive) {
              if (isOptimalShift) {
                ledColorClass = 'bg-red-400 ';
              } else if (i < 5) {
                ledColorClass = 'bg-slate-300 ';
              } else if (i < 10) {
                ledColorClass = 'bg-slate-100 ';
              } else {
                ledColorClass = 'bg-red-500 ';
              }
            }

            return (
              <div
                key={i}
                className={`flex-1 h-3 rounded-sm transition-colors duration-75 ${ledColorClass}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Instrumentation Cockpit Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Metric 1: Digital Speedometer */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Velocity</span>
            <button
              onClick={onToggleSpeedUnit}
              className="px-1.5 py-0.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors"
              title="Click to toggle km/h and mph"
            >
              {speedUnit}
            </button>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-medium font-mono text-white tracking-tight tabular-nums">
              {speedUnit === 'mph' ? Math.round(point.speed * 0.621371) : Math.round(point.speed)}
            </span>
            <span className="text-xs font-mono  text-slate-400">{speedUnit}</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-500">
            Pos: {point.distance.toFixed(0)}m / {totalDistance.toFixed(0)}m
          </div>
        </div>

        {/* Metric 2: Gear & DRS */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400">Gear</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-medium font-mono text-slate-100 tabular-nums">
                {point.gear}
              </span>
              <span className="text-xs font-mono text-slate-500">8-spd dual clutch</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono  text-slate-400 block">DRS flap</span>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                point.drs
                  ? 'bg-slate-800 text-slate-100 border-slate-600 '
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {point.drs ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Metric 3: Throttle & Brake Pedals */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
          {/* Throttle Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-emerald-400 font-semibold">Throttle</span>
              <span className="text-white font-mono tabular-nums">{point.throttle}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded transition-colors duration-75"
                style={{ width: `${point.throttle}%` }}
              />
            </div>
          </div>

          {/* Brake Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-rose-400 font-semibold">Brake</span>
              <span className="text-white font-mono tabular-nums">{point.brake}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded transition-colors duration-75"
                style={{ width: `${point.brake}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: G-Force Vector Friction Circle */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block">G-force meter</span>
            <div className="mt-1 text-xs font-mono tabular-nums">
              <div className="text-slate-300">Lat: <span className="font-medium text-white">{point.latG.toFixed(1)}G</span></div>
              <div className="text-slate-300">Long: <span className="font-medium text-white">{point.longG.toFixed(1)}G</span></div>
            </div>
          </div>
          {/* Mini 2D Friction Crosshair Circle */}
          <div className="relative w-16 h-16 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center">
            {/* Inner reference rings */}
            <div className="absolute w-10 h-10 rounded-full border border-slate-800" />
            <div className="absolute w-full h-[1px] bg-slate-800" />
            <div className="absolute h-full w-[1px] bg-slate-800" />

            {/* Dynamic G-force Pip */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-red-500 border border-white  transition-colors duration-75 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${ballX}%`,
                top: `${ballY}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
