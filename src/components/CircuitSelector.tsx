import React from 'react';
import { ALL_CIRCUITS } from '../data/circuits';
import { CircuitData, SpeedUnit } from '../types/telemetry';
import { formatSpeed } from '../utils/colormaps';
function TrackOutline({ circuit }: { circuit: CircuitData }) {
  const points = circuit.primaryDriver.telemetry;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const width = Math.max(...xs) - minX || 1, height = Math.max(...ys) - minY || 1;
  const scale = Math.min(80 / width, 48 / height);
  const path = points.filter((_, i) => i % 3 === 0).map((p, i) => `${i ? 'L' : 'M'} ${(p.x - minX) * scale + (96 - width * scale) / 2} ${64 - ((p.y - minY) * scale + (64 - height * scale) / 2)}`).join(' ');
  return <svg className="track-outline" viewBox="0 0 96 64" aria-hidden="true"><path d={`${path} Z`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
export function CircuitSelector({ selectedCircuitId, onSelectCircuit, speedUnit }: { selectedCircuitId: string; onSelectCircuit: (id: string) => void; speedUnit: SpeedUnit }) {
  return <section className="circuit-section" aria-label="Circuit selection">
    <div className="section-heading"><h2>Select a circuit</h2><span>{ALL_CIRCUITS.length} circuits</span></div>
    <div className="circuit-grid">{ALL_CIRCUITS.map(circuit => {
      const selected = circuit.id === selectedCircuitId;
      return <button key={circuit.id} className={`circuit-card ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => onSelectCircuit(circuit.id)}>
        <div className="circuit-card-top"><span className="circuit-country"><span className="sector-mark" aria-hidden="true" />{circuit.country}</span><TrackOutline circuit={circuit} /></div>
        <h3>{circuit.name}</h3><p>{circuit.primaryDriver.driverName}</p>
        <div className="circuit-data"><span>{circuit.primaryDriver.lapTime}</span><span>{(circuit.circuitLengthM / 1000).toFixed(2)} km</span></div>
        <span className="circuit-peak">Peak {formatSpeed(Math.max(...circuit.primaryDriver.telemetry.map(p => p.speed)), speedUnit)}</span>
      </button>;
    })}</div>
  </section>;
}
