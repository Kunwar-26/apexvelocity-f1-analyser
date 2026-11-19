import React, { useState, useMemo } from 'react';
import { CircuitData, ColormapType, SpeedUnit } from '../types/telemetry';
import { generateFastF1PythonCode } from '../utils/fastf1PythonCode';
import { formatSpeed } from '../utils/colormaps';
import { Copy, Check, Download, Code2, Database, Filter } from 'lucide-react';

interface PythonFastF1LabProps {
  circuit: CircuitData;
  colormap: ColormapType;
  speedUnit: SpeedUnit;
}

export const PythonFastF1Lab: React.FC<PythonFastF1LabProps> = ({
  circuit,
  colormap,
  speedUnit,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'braking' | 'highSpeed' | 'corners'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const pythonCode = useMemo(() => {
    return generateFastF1PythonCode(circuit, colormap);
  }, [circuit, colormap]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([pythonCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fastf1_${circuit.id}_speed_mapping.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered raw coordinates
  const telemetry = circuit.primaryDriver.telemetry;
  const filteredPoints = useMemo(() => {
    return telemetry.filter(pt => {
      if (filterMode === 'braking' && pt.brake <= 10) return false;
      if (filterMode === 'highSpeed' && pt.speed < 290) return false;
      if (filterMode === 'corners' && pt.speed > 180) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          pt.index.toString().includes(term) ||
          Math.round(pt.speed).toString().includes(term) ||
          Math.round(pt.distance).toString().includes(term)
        );
      }
      return true;
    });
  }, [telemetry, filterMode, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Project Challenge Brief Header Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5  relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LEVEL: BEGINNER TO INTERMEDIATE
              </span>
              <span className="text-xs font-mono text-slate-400">· fastf1 & matplotlib tutorial</span>
            </div>
            <h2 className="text-xl font-medium text-white tracking-tight">
              1. How Fast Do F1 Cars Really Go Around a Circuit?
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Project: Circuit Mapping and Speed Visualisation using FastF1 positional coordinates (X, Y) and Speed (km/h).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Script!' : 'Copy Python Code'}</span>
            </button>

            <button
              onClick={handleDownloadPy}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column: Python Code on Left, Live Raw Coordinates Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python Code Snippet Editor */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5  flex flex-col">
          <div className="flex flex-wrap gap-3 items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white font-mono">
                fastf1_circuit_map.py
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500">Python 3.10+ · FastF1 3.x</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto h-[480px] overflow-y-auto leading-relaxed">
            <pre>{pythonCode}</pre>
          </div>
        </div>

        {/* Live Coordinate Data Inspector */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5  flex flex-col">
          <div className="flex flex-wrap gap-3 items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-sm font-medium text-white font-mono block">
                  FastF1 Telemetry Coordinates
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Showing {filteredPoints.length} of {telemetry.length} data rows
                </span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('braking')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'braking' ? 'bg-rose-500/30 text-rose-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Braking
              </button>
              <button
                onClick={() => setFilterMode('highSpeed')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'highSpeed' ? 'bg-cyan-500/30 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vmax
              </button>
              <button
                onClick={() => setFilterMode('corners')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'corners' ? 'bg-amber-500/30 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Apexes
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="mb-3 relative">
            <input
              type="text"
              placeholder="Search by speed, distance, or point index..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Coordinates Table */}
          <div className="h-[420px] overflow-y-auto border border-slate-800/80 rounded-lg bg-slate-900/40">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 text-xs text-slate-400 ">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">X (m)</th>
                  <th className="p-2">Y (m)</th>
                  <th className="p-2">Speed</th>
                  <th className="p-2">Dist</th>
                  <th className="p-2">Gear</th>
                  <th className="p-2">Thr / Brk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 tabular-nums">
                {filteredPoints.map(p => (
                  <tr key={p.index} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-2 text-slate-500">{p.index}</td>
                    <td className="p-2 text-slate-300">{Math.round(p.x)}</td>
                    <td className="p-2 text-slate-300">{Math.round(p.y)}</td>
                    <td className="p-2 font-medium text-cyan-400">{formatSpeed(p.speed, speedUnit)}</td>
                    <td className="p-2 text-slate-400">{p.distance.toFixed(0)}m</td>
                    <td className="p-2 text-amber-400 font-semibold">{p.gear}</td>
                    <td className="p-2">
                      <span className="text-emerald-400">{p.throttle}%</span> /{' '}
                      <span className="text-rose-400">{p.brake}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
