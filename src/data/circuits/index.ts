import { monzaCircuit } from './monza';
import { spaCircuit } from './spa';
import { silverstoneCircuit } from './silverstone';
import { monacoCircuit } from './monaco';
import { CircuitData } from '../../types/telemetry';

export const ALL_CIRCUITS: CircuitData[] = [
  monzaCircuit,
  spaCircuit,
  silverstoneCircuit,
  monacoCircuit,
];

export function getCircuitById(id: string): CircuitData {
  const found = ALL_CIRCUITS.find(c => c.id === id);
  return found || monzaCircuit;
}
