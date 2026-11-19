import React, { useState } from 'react';
import { CircuitData } from '../types/telemetry';
import { X, Download, Copy, Check, FileSpreadsheet, FileCode, Archive } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: CircuitData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  circuit,
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const telemetry = circuit.primaryDriver.telemetry;

  const generateCSV = () => {
    const headers = ['Index', 'Distance_m', 'X_m', 'Y_m', 'Speed_kmh', 'Throttle_pct', 'Brake_pct', 'Gear', 'RPM', 'Time_s', 'Lat_G', 'Long_G'];
    const rows = telemetry.map(p => [
      p.index,
      p.distance,
      p.x,
      p.y,
      p.speed,
      p.throttle,
      p.brake,
      p.gear,
      p.rpm,
      p.time,
      p.latG,
      p.longG,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateJSON = () => {
    return JSON.stringify(
      {
        circuit: circuit.name,
        country: circuit.country,
        year: circuit.eventYear,
        driver: circuit.primaryDriver.driverName,
        team: circuit.primaryDriver.team,
        lapTime: circuit.primaryDriver.lapTime,
        telemetry: telemetry,
        brakingZones: circuit.brakingZones,
        highSpeedSections: circuit.highSpeedSections,
        corners: circuit.corners,
      },
      null,
      2
    );
  };

  const exportContent = format === 'csv' ? generateCSV() : generateJSON();

  const handleDownload = () => {
    const blob = new Blob([exportContent], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${circuit.id}_fastf1_telemetry.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden  flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex flex-wrap gap-3 items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-lg font-medium text-white">Export telemetry</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {circuit.name} · {circuit.primaryDriver.driverName} ({circuit.primaryDriver.lapTime})
            </p>
          </div>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Format selection */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                format === 'csv'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 '
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-red-400" />
              <span>CSV Spreadsheet (.csv)</span>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                format === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 '
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Full JSON Object (.json)</span>
            </button>

            <a
              href="/f1-speed-analyser.zip"
              download="f1-speed-analyser.zip"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 transition-colors ml-auto"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>Source Code (.zip)</span>
            </a>
          </div>

          {/* Preview box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 h-64 overflow-y-auto whitespace-pre leading-relaxed">
            {exportContent.slice(0, 4000)}
            {exportContent.length > 4000 && '\n... [Remaining data truncated in preview]'}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap gap-3 items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <span className="text-xs font-mono text-slate-500">
            {telemetry.length} coordinate records ready for export
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
