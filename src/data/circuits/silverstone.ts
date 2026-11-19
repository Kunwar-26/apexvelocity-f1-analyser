import { CircuitData, Corner, BrakingZone, HighSpeedSection, Sector, TelemetryPoint } from '../../types/telemetry';

const SILVERSTONE_WAYPOINTS = [
  // Start/Finish Hamilton Straight into Abbey
  { x: 200, y: 150, speed: 280, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Hamilton Straight" },
  { x: 340, y: 180, speed: 295, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T1 Abbey Flat" },
  { x: 420, y: 220, speed: 290, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T2 Farm Curve" },
  // Village & The Loop (Infield arena)
  { x: 500, y: 280, speed: 220, gear: 5, throttle: 0, brake: 90, drs: false, desc: "Braking Village" },
  { x: 540, y: 350, speed: 110, gear: 3, throttle: 25, brake: 15, drs: false, desc: "T3 Village Right" },
  { x: 520, y: 430, speed: 88, gear: 2, throttle: 35, brake: 0, drs: false, desc: "T4 The Loop Hairpin" },
  { x: 450, y: 460, speed: 140, gear: 3, throttle: 90, brake: 0, drs: false, desc: "T5 Aintree" },
  // Wellington Straight
  { x: 300, y: 520, speed: 260, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Wellington Straight Start" },
  { x: 100, y: 600, speed: 318, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Wellington Speed Trap" },
  // Brooklands & Luffield
  { x: -30, y: 640, speed: 210, gear: 5, throttle: 0, brake: 85, drs: false, desc: "Braking Brooklands" },
  { x: -120, y: 640, speed: 155, gear: 4, throttle: 40, brake: 0, drs: false, desc: "T6 Brooklands Left" },
  { x: -180, y: 580, speed: 115, gear: 3, throttle: 30, brake: 10, drs: false, desc: "T7 Luffield Right" },
  { x: -160, y: 480, speed: 195, gear: 4, throttle: 85, brake: 0, drs: false, desc: "T8 Woodcote" },
  // Old Pit Straight into Copse
  { x: -100, y: 380, speed: 275, gear: 6, throttle: 100, brake: 0, drs: false, desc: "National Pits Straight" },
  { x: -50, y: 270, speed: 292, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T9 Copse Flat-Out (4.8G)" },
  // Maggotts, Becketts & Chapel Complex
  { x: -30, y: 150, speed: 290, gear: 7, throttle: 90, brake: 10, drs: false, desc: "T10 Maggotts Left" },
  { x: -40, y: 40, speed: 245, gear: 6, throttle: 60, brake: 25, drs: false, desc: "T11 Becketts Right" },
  { x: -90, y: -40, speed: 215, gear: 5, throttle: 40, brake: 30, drs: false, desc: "T12 Becketts Left" },
  { x: -150, y: -100, speed: 265, gear: 6, throttle: 100, brake: 0, drs: false, desc: "T13 Chapel Exit" },
  // Hangar Straight
  { x: -260, y: -200, speed: 305, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Hangar Straight DRS" },
  { x: -450, y: -380, speed: 334, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Hangar Straight Peak" },
  // Stowe Corner
  { x: -530, y: -460, speed: 230, gear: 5, throttle: 0, brake: 85, drs: false, desc: "Braking Stowe" },
  { x: -580, y: -500, speed: 190, gear: 5, throttle: 55, brake: 0, drs: false, desc: "T15 Stowe Right" },
  // Vale & Club Chicane
  { x: -520, y: -400, speed: 250, gear: 6, throttle: 0, brake: 90, drs: false, desc: "Braking Vale" },
  { x: -450, y: -300, speed: 110, gear: 3, throttle: 20, brake: 15, drs: false, desc: "T16 Vale Left" },
  { x: -380, y: -220, speed: 140, gear: 3, throttle: 65, brake: 0, drs: false, desc: "T17 Club Right" },
  { x: -260, y: -100, speed: 210, gear: 5, throttle: 100, brake: 0, drs: false, desc: "T18 Club Exit" },
  { x: -50, y: 20, speed: 265, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Approach Hamilton Straight" },
  { x: 200, y: 150, speed: 280, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Finish Line" },
];

function generateSilverstoneTelemetry(driverVariation = 0): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const steps = 6;
  let dist = 0;
  let time = 0;

  for (let i = 0; i < SILVERSTONE_WAYPOINTS.length - 1; i++) {
    const p1 = SILVERSTONE_WAYPOINTS[i];
    const p2 = SILVERSTONE_WAYPOINTS[i + 1];

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const smoothT = t * t * (3 - 2 * t);
      const x = p1.x + (p2.x - p1.x) * smoothT;
      const y = p1.y + (p2.y - p1.y) * smoothT;
      let speed = p1.speed + (p2.speed - p1.speed) * smoothT + (driverVariation * Math.sin((i * steps + s) * 0.35));
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

      const longG = brake > 10 ? -((brake / 100) * 4.9) : ((throttle / 100) * 1.5);
      const latG = (speed > 240 && (i === 1 || i === 13 || (i >= 14 && i <= 17))) ? 4.8 : (Math.random() * 0.4 - 0.2);

      points.push({
        index: points.length,
        x,
        y,
        distance: Math.round(dist * 10) / 10,
        speed: Math.round(speed * 10) / 10,
        throttle: Math.max(0, Math.min(100, throttle)),
        brake: Math.max(0, Math.min(100, brake)),
        gear: Math.max(1, Math.min(8, gear)),
        rpm: Math.round(9700 + (speed / (gear * 44)) * 2400),
        drs: p1.drs && p2.drs,
        time: Math.round(time * 1000) / 1000,
        latG: Math.round(latG * 10) / 10,
        longG: Math.round(longG * 10) / 10,
      });
    }
  }
  return points;
}

export const SILVERSTONE_CORNERS: Corner[] = [
  { number: 1, name: "Abbey", x: 340, y: 180, distance: 300, apexSpeed: 295, gear: 7, type: 'fast' },
  { number: 2, name: "Farm Curve", x: 420, y: 220, distance: 480, apexSpeed: 290, gear: 7, type: 'fast' },
  { number: 3, name: "Village", x: 540, y: 350, distance: 820, apexSpeed: 110, gear: 3, type: 'slow' },
  { number: 4, name: "The Loop", x: 520, y: 430, distance: 1020, apexSpeed: 88, gear: 2, type: 'hairpin' },
  { number: 5, name: "Aintree", x: 450, y: 460, distance: 1210, apexSpeed: 140, gear: 3, type: 'medium' },
  { number: 6, name: "Brooklands", x: -120, y: 640, distance: 2050, apexSpeed: 155, gear: 4, type: 'medium' },
  { number: 7, name: "Luffield", x: -180, y: 580, distance: 2250, apexSpeed: 115, gear: 3, type: 'slow' },
  { number: 8, name: "Woodcote", x: -160, y: 480, distance: 2450, apexSpeed: 195, gear: 4, type: 'fast' },
  { number: 9, name: "Copse", x: -50, y: 270, distance: 2950, apexSpeed: 292, gear: 7, type: 'fast' },
  { number: 10, name: "Maggotts", x: -30, y: 150, distance: 3300, apexSpeed: 290, gear: 7, type: 'fast' },
  { number: 11, name: "Becketts (T11)", x: -40, y: 40, distance: 3520, apexSpeed: 245, gear: 6, type: 'fast' },
  { number: 12, name: "Becketts (T12)", x: -90, y: -40, distance: 3680, apexSpeed: 215, gear: 5, type: 'fast' },
  { number: 13, name: "Chapel", x: -150, y: -100, distance: 3840, apexSpeed: 265, gear: 6, type: 'fast' },
  { number: 14, name: "Stowe", x: -580, y: -500, distance: 4650, apexSpeed: 190, gear: 5, type: 'medium' },
  { number: 15, name: "Vale", x: -450, y: -300, distance: 5120, apexSpeed: 110, gear: 3, type: 'slow' },
  { number: 16, name: "Club", x: -380, y: -220, distance: 5310, apexSpeed: 140, gear: 3, type: 'medium' },
];

export const SILVERSTONE_BRAKING_ZONES: BrakingZone[] = [
  {
    id: "silv-bz-1",
    name: "Village (T3)",
    cornerNumber: 3,
    startDistance: 710,
    endDistance: 820,
    entrySpeed: 290,
    minSpeed: 110,
    speedDelta: 180,
    decelerationG: -4.8,
    gearDrop: "7th -> 3rd",
    brakingDistanceM: 110,
    startX: 500,
    startY: 280,
    apexX: 540,
    apexY: 350,
  },
  {
    id: "silv-bz-2",
    name: "Brooklands (T6)",
    cornerNumber: 6,
    startDistance: 1950,
    endDistance: 2050,
    entrySpeed: 318,
    minSpeed: 155,
    speedDelta: 163,
    decelerationG: -4.5,
    gearDrop: "8th -> 4th",
    brakingDistanceM: 100,
    startX: -30,
    startY: 640,
    apexX: -120,
    apexY: 640,
  },
  {
    id: "silv-bz-3",
    name: "Stowe (T15)",
    cornerNumber: 15,
    startDistance: 4540,
    endDistance: 4650,
    entrySpeed: 334,
    minSpeed: 190,
    speedDelta: 144,
    decelerationG: -4.6,
    gearDrop: "8th -> 5th",
    brakingDistanceM: 110,
    startX: -530,
    startY: -460,
    apexX: -580,
    apexY: -500,
  },
  {
    id: "silv-bz-4",
    name: "Vale (T16)",
    cornerNumber: 16,
    startDistance: 5020,
    endDistance: 5120,
    entrySpeed: 250,
    minSpeed: 110,
    speedDelta: 140,
    decelerationG: -4.4,
    gearDrop: "6th -> 3rd",
    brakingDistanceM: 100,
    startX: -520,
    startY: -400,
    apexX: -450,
    apexY: -300,
  },
];

export const SILVERSTONE_HIGH_SPEED_SECTIONS: HighSpeedSection[] = [
  {
    id: "silv-hs-1",
    name: "Abbey & Farm Curve Flat-Out",
    startDistance: 0,
    endDistance: 650,
    peakSpeed: 295,
    avgSpeed: 288,
    hasDRS: false,
    lengthM: 650,
    startX: 200,
    startY: 150,
    endX: 420,
    endY: 220,
  },
  {
    id: "silv-hs-2",
    name: "Wellington Straight (DRS 1)",
    startDistance: 1250,
    endDistance: 1950,
    peakSpeed: 318,
    avgSpeed: 295,
    hasDRS: true,
    lengthM: 700,
    startX: 300,
    startY: 520,
    endX: 100,
    endY: 600,
  },
  {
    id: "silv-hs-3",
    name: "Copse Flat-Out Apex (4.8G)",
    startDistance: 2750,
    endDistance: 3150,
    peakSpeed: 292,
    avgSpeed: 285,
    hasDRS: false,
    lengthM: 400,
    startX: -100,
    startY: 380,
    endX: -50,
    endY: 270,
  },
  {
    id: "silv-hs-4",
    name: "Hangar Straight Flight (DRS 2)",
    startDistance: 3850,
    endDistance: 4540,
    peakSpeed: 334,
    avgSpeed: 315,
    hasDRS: true,
    lengthM: 690,
    startX: -260,
    startY: -200,
    endX: -450,
    endY: -380,
  },
];

export const SILVERSTONE_SECTORS: Sector[] = [
  { number: 1, name: "Sector 1 (Abbey, Infield & Wellington)", startDistance: 0, endDistance: 1850, splitTime: 28.210 },
  { number: 2, name: "Sector 2 (Brooklands, Copse & Becketts)", startDistance: 1850, endDistance: 3800, splitTime: 34.650 },
  { number: 3, name: "Sector 3 (Hangar Straight, Stowe & Club)", startDistance: 3800, endDistance: 5891, splitTime: 23.950 },
];

export const silverstoneCircuit: CircuitData = {
  id: "silverstone",
  name: "Silverstone Circuit",
  grandPrixName: "British Grand Prix",
  location: "Silverstone, United Kingdom",
  country: "United Kingdom",
  circuitLengthM: 5891,
  lapRecord: {
    time: "1:27.097",
    driver: "Max Verstappen",
    year: 2020,
  },
  eventYear: 2023,
  sessionType: "Pole Position Lap",
  corners: SILVERSTONE_CORNERS,
  brakingZones: SILVERSTONE_BRAKING_ZONES,
  highSpeedSections: SILVERSTONE_HIGH_SPEED_SECTIONS,
  sectors: SILVERSTONE_SECTORS,
  primaryDriver: {
    driverCode: "VER",
    driverName: "Max Verstappen",
    driverNumber: 1,
    team: "Red Bull Racing",
    teamColor: "#1e41ff",
    carModel: "RB19",
    lapTime: "1:26.720",
    lapTimeSeconds: 86.720,
    compound: "SOFT",
    telemetry: generateSilverstoneTelemetry(0),
  },
  comparisonDriver: {
    driverCode: "NOR",
    driverName: "Lando Norris",
    driverNumber: 4,
    team: "McLaren F1 Team",
    teamColor: "#ff8000",
    carModel: "MCL60",
    lapTime: "1:26.961",
    lapTimeSeconds: 86.961,
    compound: "SOFT",
    telemetry: generateSilverstoneTelemetry(2.0),
  },
};
