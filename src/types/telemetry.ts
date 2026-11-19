export interface TelemetryPoint {
  index: number;
  x: number; // circuit X coordinate in meters
  y: number; // circuit Y coordinate in meters
  distance: number; // distance in meters from start/finish line
  speed: number; // speed in km/h
  throttle: number; // 0 - 100%
  brake: number; // 0 - 100%
  gear: number; // 1 - 8
  rpm: number; // engine RPM
  drs: boolean; // DRS flap open
  time: number; // elapsed time in seconds
  latG: number; // lateral acceleration in G
  longG: number; // longitudinal acceleration in G (positive = acceleration, negative = braking)
}

export interface Corner {
  number: number;
  name: string;
  x: number;
  y: number;
  distance: number;
  apexSpeed: number;
  gear: number;
  type: 'hairpin' | 'slow' | 'medium' | 'fast' | 'chicane';
}

export interface BrakingZone {
  id: string;
  name: string;
  cornerNumber: number;
  startDistance: number;
  endDistance: number;
  entrySpeed: number;
  minSpeed: number;
  speedDelta: number;
  decelerationG: number;
  gearDrop: string;
  brakingDistanceM: number;
  startX: number;
  startY: number;
  apexX: number;
  apexY: number;
}

export interface HighSpeedSection {
  id: string;
  name: string;
  startDistance: number;
  endDistance: number;
  peakSpeed: number;
  avgSpeed: number;
  hasDRS: boolean;
  lengthM: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Sector {
  number: 1 | 2 | 3;
  name: string;
  startDistance: number;
  endDistance: number;
  splitTime: number; // seconds
}

export interface DriverLap {
  driverCode: string;
  driverName: string;
  driverNumber: number;
  team: string;
  teamColor: string;
  carModel: string;
  lapTime: string;
  lapTimeSeconds: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD';
  telemetry: TelemetryPoint[];
}

export interface CircuitData {
  id: string;
  name: string;
  grandPrixName: string;
  location: string;
  country: string;
  circuitLengthM: number;
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  eventYear: number;
  sessionType: 'Qualifying Q3' | 'Pole Position Lap';
  corners: Corner[];
  brakingZones: BrakingZone[];
  highSpeedSections: HighSpeedSection[];
  sectors: Sector[];
  primaryDriver: DriverLap;
  comparisonDriver?: DriverLap;
}

export type ColormapType = 'viridis' | 'turbo' | 'plasma' | 'speedHeat';
export type SpeedUnit = 'km/h' | 'mph';
