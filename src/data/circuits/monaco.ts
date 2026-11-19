import { CircuitData, Corner, BrakingZone, HighSpeedSection, Sector, TelemetryPoint } from '../../types/telemetry';

const MONACO_WAYPOINTS = [
  // Pit straight into Sainte Devote
  { x: 50, y: 0, speed: 270, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Boulevard Albert 1er" },
  { x: 160, y: 10, speed: 288, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Approach Sainte-Devote" },
  // Turn 1 Sainte-Devote
  { x: 230, y: 15, speed: 170, gear: 4, throttle: 0, brake: 90, drs: false, desc: "Braking Sainte-Devote" },
  { x: 270, y: 35, speed: 108, gear: 3, throttle: 35, brake: 0, drs: false, desc: "T1 Sainte-Devote Apex" },
  // Beau Rivage uphill climb
  { x: 300, y: 120, speed: 215, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Beau Rivage Climb" },
  { x: 320, y: 240, speed: 268, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Crest into Massenet" },
  // Massenet & Casino Square
  { x: 300, y: 330, speed: 165, gear: 4, throttle: 40, brake: 25, drs: false, desc: "T2-T3 Massenet Left" },
  { x: 260, y: 380, speed: 135, gear: 3, throttle: 30, brake: 30, drs: false, desc: "T4 Casino Square Right" },
  { x: 210, y: 390, speed: 190, gear: 4, throttle: 90, brake: 0, drs: false, desc: "Descent to Mirabeau" },
  // Mirabeau Haute
  { x: 150, y: 380, speed: 88, gear: 2, throttle: 20, brake: 80, drs: false, desc: "T5 Mirabeau Haute Right" },
  // Grand Hotel / Fairmont Hairpin (Slowest corner on F1 calendar)
  { x: 130, y: 320, speed: 70, gear: 2, throttle: 10, brake: 70, drs: false, desc: "Approach Hairpin" },
  { x: 100, y: 290, speed: 48, gear: 1, throttle: 20, brake: 15, drs: false, desc: "T6 Grand Hotel Hairpin (48 km/h)" },
  // Mirabeau Bas & Portier
  { x: 140, y: 260, speed: 85, gear: 2, throttle: 40, brake: 0, drs: false, desc: "T7 Mirabeau Bas Right" },
  { x: 190, y: 230, speed: 80, gear: 2, throttle: 35, brake: 15, drs: false, desc: "T8 Portier Right" },
  { x: 230, y: 200, speed: 145, gear: 3, throttle: 90, brake: 0, drs: false, desc: "Portier Exit onto Seafront" },
  // The Famous Monaco Tunnel (Flat Out Sweep)
  { x: 260, y: 150, speed: 220, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Tunnel Entry" },
  { x: 250, y: 70, speed: 270, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Tunnel Apex Sweep" },
  { x: 220, y: -20, speed: 286, gear: 7, throttle: 100, brake: 0, drs: false, desc: "Tunnel Exit Speed Peak" },
  // Nouvelle Chicane
  { x: 190, y: -90, speed: 180, gear: 4, throttle: 0, brake: 95, drs: false, desc: "Braking Nouvelle Chicane" },
  { x: 160, y: -130, speed: 82, gear: 2, throttle: 25, brake: 15, drs: false, desc: "T10 Nouvelle Chicane Left" },
  { x: 135, y: -140, speed: 96, gear: 2, throttle: 60, brake: 0, drs: false, desc: "T11 Nouvelle Chicane Right" },
  // Tabac Corner (High speed harbor entry)
  { x: 90, y: -160, speed: 185, gear: 4, throttle: 80, brake: 0, drs: false, desc: "T12 Tabac Left (4.1G)" },
  // Swimming Pool Chicanes (Louis Chiron)
  { x: 40, y: -170, speed: 225, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Approach Swimming Pool" },
  { x: 0, y: -160, speed: 195, gear: 5, throttle: 50, brake: 25, drs: false, desc: "T13 Louis Chiron Entry" },
  { x: -40, y: -145, speed: 132, gear: 3, throttle: 30, brake: 60, drs: false, desc: "T15 Swimming Pool Exit" },
  // La Rascasse & Anthony Noghes
  { x: -50, y: -90, speed: 160, gear: 4, throttle: 80, brake: 0, drs: false, desc: "Run to Rascasse" },
  { x: -45, y: -40, speed: 72, gear: 2, throttle: 20, brake: 85, drs: false, desc: "T18 La Rascasse Hairpin" },
  { x: -20, y: -10, speed: 92, gear: 2, throttle: 45, brake: 0, drs: false, desc: "T19 Anthony Noghes" },
  { x: 50, y: 0, speed: 270, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Finish Line" },
];

function generateMonacoTelemetry(driverVariation = 0): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const steps = 6;
  let dist = 0;
  let time = 0;

  for (let i = 0; i < MONACO_WAYPOINTS.length - 1; i++) {
    const p1 = MONACO_WAYPOINTS[i];
    const p2 = MONACO_WAYPOINTS[i + 1];

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const smoothT = t * t * (3 - 2 * t);
      const x = p1.x + (p2.x - p1.x) * smoothT;
      const y = p1.y + (p2.y - p1.y) * smoothT;
      let speed = p1.speed + (p2.speed - p1.speed) * smoothT + (driverVariation * Math.sin((i * steps + s) * 0.4));
      const throttle = Math.round(p1.throttle + (p2.throttle - p1.throttle) * smoothT);
      const brake = Math.round(p1.brake + (p2.brake - p1.brake) * smoothT);
      const gear = Math.round(p1.gear + (p2.gear - p1.gear) * smoothT);

      if (points.length > 0) {
        const last = points[points.length - 1];
        const stepM = Math.sqrt((x - last.x) ** 2 + (y - last.y) ** 2);
        dist += stepM;
        const avgSpeedMs = (speed / 3.6);
        time += avgSpeedMs > 0 ? stepM / avgSpeedMs : 0.05;
      }

      const longG = brake > 10 ? -((brake / 100) * 4.6) : ((throttle / 100) * 1.4);
      const latG = (speed > 140 && (i === 6 || i === 21 || i === 23)) ? 4.1 : (Math.random() * 0.3 - 0.15);

      points.push({
        index: points.length,
        x,
        y,
        distance: Math.round(dist * 10) / 10,
        speed: Math.round(speed * 10) / 10,
        throttle: Math.max(0, Math.min(100, throttle)),
        brake: Math.max(0, Math.min(100, brake)),
        gear: Math.max(1, Math.min(8, gear)),
        rpm: Math.round(9600 + (speed / (gear * 38)) * 2400),
        drs: p1.drs && p2.drs,
        time: Math.round(time * 1000) / 1000,
        latG: Math.round(latG * 10) / 10,
        longG: Math.round(longG * 10) / 10,
      });
    }
  }
  return points;
}

export const MONACO_CORNERS: Corner[] = [
  { number: 1, name: "Sainte-Dévote", x: 270, y: 35, distance: 340, apexSpeed: 108, gear: 3, type: 'slow' },
  { number: 2, name: "Massenet", x: 300, y: 330, distance: 980, apexSpeed: 165, gear: 4, type: 'medium' },
  { number: 3, name: "Casino Square", x: 260, y: 380, distance: 1140, apexSpeed: 135, gear: 3, type: 'medium' },
  { number: 4, name: "Mirabeau Haute", x: 150, y: 380, distance: 1380, apexSpeed: 88, gear: 2, type: 'slow' },
  { number: 5, name: "Grand Hotel Hairpin (Fairmont)", x: 100, y: 290, distance: 1580, apexSpeed: 48, gear: 1, type: 'hairpin' },
  { number: 6, name: "Mirabeau Bas", x: 140, y: 260, distance: 1720, apexSpeed: 85, gear: 2, type: 'slow' },
  { number: 7, name: "Portier", x: 190, y: 230, distance: 1870, apexSpeed: 80, gear: 2, type: 'slow' },
  { number: 8, name: "The Tunnel (Apex)", x: 250, y: 70, distance: 2240, apexSpeed: 270, gear: 6, type: 'fast' },
  { number: 9, name: "Nouvelle Chicane (T10)", x: 160, y: -130, distance: 2560, apexSpeed: 82, gear: 2, type: 'chicane' },
  { number: 10, name: "Nouvelle Chicane (T11)", x: 135, y: -140, distance: 2620, apexSpeed: 96, gear: 2, type: 'chicane' },
  { number: 11, name: "Tabac", x: 90, y: -160, distance: 2780, apexSpeed: 185, gear: 4, type: 'medium' },
  { number: 12, name: "Louis Chiron (T13)", x: 0, y: -160, distance: 2940, apexSpeed: 195, gear: 5, type: 'fast' },
  { number: 13, name: "Swimming Pool Chicane (T15)", x: -40, y: -145, distance: 3080, apexSpeed: 132, gear: 3, type: 'chicane' },
  { number: 14, name: "La Rascasse", x: -45, y: -40, distance: 3240, apexSpeed: 72, gear: 2, type: 'hairpin' },
  { number: 15, name: "Anthony Noghès", x: -20, y: -10, distance: 3310, apexSpeed: 92, gear: 2, type: 'slow' },
];

export const MONACO_BRAKING_ZONES: BrakingZone[] = [
  {
    id: "mco-bz-1",
    name: "Sainte-Dévote (T1)",
    cornerNumber: 1,
    startDistance: 240,
    endDistance: 340,
    entrySpeed: 288,
    minSpeed: 108,
    speedDelta: 180,
    decelerationG: -4.7,
    gearDrop: "7th -> 3rd",
    brakingDistanceM: 100,
    startX: 230,
    startY: 15,
    apexX: 270,
    apexY: 35,
  },
  {
    id: "mco-bz-2",
    name: "Grand Hotel Hairpin (T5)",
    cornerNumber: 5,
    startDistance: 1490,
    endDistance: 1580,
    entrySpeed: 190,
    minSpeed: 48,
    speedDelta: 142,
    decelerationG: -4.2,
    gearDrop: "4th -> 1st",
    brakingDistanceM: 90,
    startX: 130,
    startY: 320,
    apexX: 100,
    apexY: 290,
  },
  {
    id: "mco-bz-3",
    name: "Nouvelle Chicane (T10)",
    cornerNumber: 9,
    startDistance: 2440,
    endDistance: 2560,
    entrySpeed: 286,
    minSpeed: 82,
    speedDelta: 204,
    decelerationG: -4.9,
    gearDrop: "7th -> 2nd",
    brakingDistanceM: 120,
    startX: 190,
    startY: -90,
    apexX: 160,
    apexY: -130,
  },
  {
    id: "mco-bz-4",
    name: "La Rascasse (T18)",
    cornerNumber: 14,
    startDistance: 3160,
    endDistance: 3240,
    entrySpeed: 160,
    minSpeed: 72,
    speedDelta: 88,
    decelerationG: -4.1,
    gearDrop: "4th -> 2nd",
    brakingDistanceM: 80,
    startX: -50,
    startY: -90,
    apexX: -45,
    apexY: -40,
  },
];

export const MONACO_HIGH_SPEED_SECTIONS: HighSpeedSection[] = [
  {
    id: "mco-hs-1",
    name: "Boulevard Albert 1er (Main Straight)",
    startDistance: 0,
    endDistance: 240,
    peakSpeed: 288,
    avgSpeed: 275,
    hasDRS: true,
    lengthM: 240,
    startX: 50,
    startY: 0,
    endX: 160,
    endY: 10,
  },
  {
    id: "mco-hs-2",
    name: "Beau Rivage Uphill Run",
    startDistance: 450,
    endDistance: 880,
    peakSpeed: 268,
    avgSpeed: 245,
    hasDRS: false,
    lengthM: 430,
    startX: 300,
    startY: 120,
    endX: 320,
    endY: 240,
  },
  {
    id: "mco-hs-3",
    name: "The Tunnel Seafront Descent",
    startDistance: 1950,
    endDistance: 2440,
    peakSpeed: 286,
    avgSpeed: 260,
    hasDRS: false,
    lengthM: 490,
    startX: 230,
    startY: 200,
    endX: 220,
    endY: -20,
  },
];

export const MONACO_SECTORS: Sector[] = [
  { number: 1, name: "Sector 1 (Sainte-Dévote & Casino Square)", startDistance: 0, endDistance: 1250, splitTime: 18.940 },
  { number: 2, name: "Sector 2 (Fairmont Hairpin, Portier & Tunnel)", startDistance: 1250, endDistance: 2480, splitTime: 33.720 },
  { number: 3, name: "Sector 3 (Chicane, Swimming Pool & Rascasse)", startDistance: 2480, endDistance: 3337, splitTime: 18.630 },
];

export const monacoCircuit: CircuitData = {
  id: "monaco",
  name: "Circuit de Monaco",
  grandPrixName: "Monaco Grand Prix",
  location: "Monte Carlo, Monaco",
  country: "Monaco",
  circuitLengthM: 3337,
  lapRecord: {
    time: "1:12.909",
    driver: "Lewis Hamilton",
    year: 2021,
  },
  eventYear: 2024,
  sessionType: "Pole Position Lap",
  corners: MONACO_CORNERS,
  brakingZones: MONACO_BRAKING_ZONES,
  highSpeedSections: MONACO_HIGH_SPEED_SECTIONS,
  sectors: MONACO_SECTORS,
  primaryDriver: {
    driverCode: "LEC",
    driverName: "Charles Leclerc",
    driverNumber: 16,
    team: "Scuderia Ferrari",
    teamColor: "#e80020",
    carModel: "SF-24",
    lapTime: "1:10.270",
    lapTimeSeconds: 70.270,
    compound: "SOFT",
    telemetry: generateMonacoTelemetry(0),
  },
  comparisonDriver: {
    driverCode: "PIA",
    driverName: "Oscar Piastri",
    driverNumber: 81,
    team: "McLaren F1 Team",
    teamColor: "#ff8000",
    carModel: "MCL38",
    lapTime: "1:10.424",
    lapTimeSeconds: 70.424,
    compound: "SOFT",
    telemetry: generateMonacoTelemetry(-1.8),
  },
};
