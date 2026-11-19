import { CircuitData, Corner, BrakingZone, HighSpeedSection, Sector, TelemetryPoint, DriverLap } from '../../types/telemetry';

// Monza authentic waypoints (X, Y in meters relative to paddock origin, speed target, gear, throttle, brake)
const MONZA_WAYPOINTS = [
  // Start/Finish straight (Rettifilo)
  { x: 0, y: 0, speed: 310, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Main Straight" },
  { x: 250, y: 3, speed: 335, gear: 8, throttle: 100, brake: 0, drs: true, desc: "DRS Zone 1" },
  { x: 550, y: 8, speed: 352, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Speed Trap Peak" },
  // Heavy Braking into Turn 1 (Variante del Rettifilo)
  { x: 670, y: 12, speed: 240, gear: 6, throttle: 0, brake: 100, drs: false, desc: "Braking Zone 1" },
  { x: 740, y: 16, speed: 110, gear: 3, throttle: 0, brake: 100, drs: false, desc: "Heavy Decel" },
  { x: 770, y: 35, speed: 74, gear: 2, throttle: 15, brake: 15, drs: false, desc: "T1 Apex" },
  { x: 785, y: 70, speed: 82, gear: 2, throttle: 40, brake: 0, drs: false, desc: "T2 Chicane Apex" },
  { x: 790, y: 120, speed: 150, gear: 3, throttle: 90, brake: 0, drs: false, desc: "Exit Rettifilo" },
  // Curva Grande (Biassono) - Sweeping right flat-out
  { x: 800, y: 220, speed: 230, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Run to Curva Grande" },
  { x: 830, y: 360, speed: 280, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Curva Grande Entry" },
  { x: 875, y: 520, speed: 304, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T3 Apex Curva Grande" },
  { x: 920, y: 700, speed: 318, gear: 7, throttle: 100, brake: 0, drs: false, desc: "Curva Grande Exit" },
  { x: 940, y: 920, speed: 334, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Approach Roggia" },
  // Variante della Roggia (Turns 4 & 5)
  { x: 948, y: 1040, speed: 210, gear: 5, throttle: 0, brake: 95, drs: false, desc: "Braking Zone 2" },
  { x: 935, y: 1090, speed: 118, gear: 3, throttle: 15, brake: 10, drs: false, desc: "T4 Roggia Left Apex" },
  { x: 915, y: 1130, speed: 124, gear: 3, throttle: 45, brake: 0, drs: false, desc: "T5 Roggia Right Apex" },
  { x: 890, y: 1200, speed: 195, gear: 4, throttle: 95, brake: 0, drs: false, desc: "Roggia Exit" },
  // Run to Lesmo 1
  { x: 850, y: 1300, speed: 260, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Run to Lesmo 1" },
  // Curve di Lesmo (Turn 6)
  { x: 810, y: 1370, speed: 190, gear: 4, throttle: 10, brake: 75, drs: false, desc: "Braking Lesmo 1" },
  { x: 750, y: 1410, speed: 172, gear: 4, throttle: 55, brake: 0, drs: false, desc: "T6 Lesmo 1 Apex" },
  { x: 670, y: 1430, speed: 220, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Short straight" },
  // Curva di Lesmo 2 (Turn 7)
  { x: 590, y: 1435, speed: 185, gear: 4, throttle: 0, brake: 70, drs: false, desc: "Braking Lesmo 2" },
  { x: 520, y: 1420, speed: 158, gear: 4, throttle: 40, brake: 0, drs: false, desc: "T7 Lesmo 2 Apex" },
  // Serraglio straight & Under the bridge
  { x: 440, y: 1370, speed: 235, gear: 5, throttle: 100, brake: 0, drs: true, desc: "Serraglio Exit" },
  { x: 340, y: 1260, speed: 290, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Under Old Oval Bridge" },
  { x: 260, y: 1130, speed: 322, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Serraglio Straight High Speed" },
  { x: 200, y: 1010, speed: 338, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Approach Ascari" },
  // Variante Ascari (Turns 8, 9, 10)
  { x: 160, y: 920, speed: 230, gear: 5, throttle: 0, brake: 85, drs: false, desc: "Braking Zone 4" },
  { x: 130, y: 860, speed: 174, gear: 4, throttle: 30, brake: 15, drs: false, desc: "T8 Ascari Left Apex" },
  { x: 95, y: 810, speed: 198, gear: 4, throttle: 70, brake: 0, drs: false, desc: "T9 Ascari Right" },
  { x: 65, y: 740, speed: 232, gear: 5, throttle: 90, brake: 0, drs: false, desc: "T10 Ascari Exit Apex" },
  // Rettifilo di Back Straight into Parabolica
  { x: 40, y: 620, speed: 285, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Back Straight" },
  { x: 15, y: 450, speed: 320, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Back Straight High Speed" },
  { x: -5, y: 310, speed: 340, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Approach Parabolica" },
  // Curva Parabolica (Curva Alboreto - Turn 11)
  { x: -20, y: 200, speed: 220, gear: 5, throttle: 0, brake: 80, drs: false, desc: "Braking Zone 5" },
  { x: -50, y: 120, speed: 194, gear: 5, throttle: 50, brake: 0, drs: false, desc: "T11 Parabolica Apex" },
  { x: -60, y: 50, speed: 225, gear: 5, throttle: 80, brake: 0, drs: false, desc: "Parabolica Mid Corner" },
  { x: -45, y: -20, speed: 260, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Parabolica Exit" },
  { x: -15, y: -10, speed: 290, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Onto Main Straight" },
  { x: 0, y: 0, speed: 310, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Finish Line" },
];

// Helper to interpolate between waypoints with smooth physics
function generateDenseTelemetry(waypoints: typeof MONZA_WAYPOINTS, driverVariation = 0): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const totalSubsteps = 6;
  let accumulatedDistance = 0;
  let accumulatedTime = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];

    for (let step = 0; step < totalSubsteps; step++) {
      const t = step / totalSubsteps;
      // Hermite / cubic-like blend for positions
      const smoothT = t * t * (3 - 2 * t);

      const x = p1.x + (p2.x - p1.x) * smoothT;
      const y = p1.y + (p2.y - p1.y) * smoothT;

      let speed = p1.speed + (p2.speed - p1.speed) * smoothT;
      if (driverVariation !== 0) {
        // slight driver delta: driver B carries slightly different apex speed / brake point
        speed += Math.sin((i * totalSubsteps + step) * 0.4) * driverVariation;
      }

      const throttle = Math.round(p1.throttle + (p2.throttle - p1.throttle) * smoothT);
      const brake = Math.round(p1.brake + (p2.brake - p1.brake) * smoothT);
      const gear = Math.round(p1.gear + (p2.gear - p1.gear) * smoothT);
      const drs = p1.drs && p2.drs;

      // RPM estimation based on gear and speed
      const rpm = Math.min(12500, Math.max(9200, Math.round(9500 + (speed / (gear * 45)) * 2400)));

      // Step distance
      let stepDist = 0;
      if (points.length > 0) {
        const lastP = points[points.length - 1];
        stepDist = Math.sqrt((x - lastP.x) ** 2 + (y - lastP.y) ** 2);
        accumulatedDistance += stepDist;
        const avgSpeedMs = (speed / 3.6);
        const dt = avgSpeedMs > 0 ? stepDist / avgSpeedMs : 0.05;
        accumulatedTime += dt;
      }

      // G-force calculation
      const longG = brake > 10 ? -((brake / 100) * 5.2) : ((throttle / 100) * 1.6);
      const latG = (speed > 160 && (i >= 5 && i <= 8 || i >= 13 && i <= 16 || i >= 23 && i <= 26 || i >= 29)) 
        ? Math.sin(t * Math.PI) * 4.4 : (Math.random() * 0.4 - 0.2);

      points.push({
        index: points.length,
        x,
        y,
        distance: Math.round(accumulatedDistance * 10) / 10,
        speed: Math.round(speed * 10) / 10,
        throttle: Math.max(0, Math.min(100, throttle)),
        brake: Math.max(0, Math.min(100, brake)),
        gear: Math.max(1, Math.min(8, gear)),
        rpm,
        drs,
        time: Math.round(accumulatedTime * 1000) / 1000,
        latG: Math.round(latG * 10) / 10,
        longG: Math.round(longG * 10) / 10,
      });
    }
  }

  return points;
}

const monzaTelemetryVerstappen = generateDenseTelemetry(MONZA_WAYPOINTS, 0);
const monzaTelemetryLeclerc = generateDenseTelemetry(MONZA_WAYPOINTS, 2.5);

export const MONZA_CORNERS: Corner[] = [
  { number: 1, name: "Variante del Rettifilo (T1)", x: 770, y: 35, distance: 780, apexSpeed: 74, gear: 2, type: 'chicane' },
  { number: 2, name: "Variante del Rettifilo (T2)", x: 785, y: 70, distance: 830, apexSpeed: 82, gear: 2, type: 'chicane' },
  { number: 3, name: "Curva Grande (Biassono)", x: 875, y: 520, distance: 1450, apexSpeed: 304, gear: 7, type: 'fast' },
  { number: 4, name: "Variante della Roggia (T4)", x: 935, y: 1090, distance: 2050, apexSpeed: 118, gear: 3, type: 'chicane' },
  { number: 5, name: "Variante della Roggia (T5)", x: 915, y: 1130, distance: 2110, apexSpeed: 124, gear: 3, type: 'chicane' },
  { number: 6, name: "Curva di Lesmo 1", x: 750, y: 1410, distance: 2520, apexSpeed: 172, gear: 4, type: 'medium' },
  { number: 7, name: "Curva di Lesmo 2", x: 520, y: 1420, distance: 2820, apexSpeed: 158, gear: 4, type: 'medium' },
  { number: 8, name: "Variante Ascari (T8)", x: 130, y: 860, distance: 3750, apexSpeed: 174, gear: 4, type: 'fast' },
  { number: 9, name: "Variante Ascari (T9)", x: 95, y: 810, distance: 3820, apexSpeed: 198, gear: 4, type: 'fast' },
  { number: 10, name: "Variante Ascari (T10)", x: 65, y: 740, distance: 3900, apexSpeed: 232, gear: 5, type: 'fast' },
  { number: 11, name: "Curva Parabolica (Alboreto)", x: -50, y: 120, distance: 4850, apexSpeed: 194, gear: 5, type: 'medium' },
];

export const MONZA_BRAKING_ZONES: BrakingZone[] = [
  {
    id: "monza-bz-1",
    name: "Variante del Rettifilo (T1)",
    cornerNumber: 1,
    startDistance: 670,
    endDistance: 780,
    entrySpeed: 352,
    minSpeed: 74,
    speedDelta: 278,
    decelerationG: -5.2,
    gearDrop: "8th -> 2nd",
    brakingDistanceM: 110,
    startX: 670,
    startY: 12,
    apexX: 770,
    apexY: 35,
  },
  {
    id: "monza-bz-2",
    name: "Variante della Roggia (T4)",
    cornerNumber: 4,
    startDistance: 1960,
    endDistance: 2050,
    entrySpeed: 334,
    minSpeed: 118,
    speedDelta: 216,
    decelerationG: -4.8,
    gearDrop: "8th -> 3rd",
    brakingDistanceM: 90,
    startX: 948,
    startY: 1040,
    apexX: 935,
    apexY: 1090,
  },
  {
    id: "monza-bz-3",
    name: "Curva di Lesmo 1 (T6)",
    cornerNumber: 6,
    startDistance: 2450,
    endDistance: 2520,
    entrySpeed: 260,
    minSpeed: 172,
    speedDelta: 88,
    decelerationG: -3.8,
    gearDrop: "6th -> 4th",
    brakingDistanceM: 70,
    startX: 810,
    startY: 1370,
    apexX: 750,
    apexY: 1410,
  },
  {
    id: "monza-bz-4",
    name: "Curva di Lesmo 2 (T7)",
    cornerNumber: 7,
    startDistance: 2750,
    endDistance: 2820,
    entrySpeed: 220,
    minSpeed: 158,
    speedDelta: 62,
    decelerationG: -3.5,
    gearDrop: "5th -> 4th",
    brakingDistanceM: 70,
    startX: 590,
    startY: 1435,
    apexX: 520,
    apexY: 1420,
  },
  {
    id: "monza-bz-5",
    name: "Variante Ascari (T8)",
    cornerNumber: 8,
    startDistance: 3660,
    endDistance: 3750,
    entrySpeed: 338,
    minSpeed: 174,
    speedDelta: 164,
    decelerationG: -4.5,
    gearDrop: "8th -> 4th",
    brakingDistanceM: 90,
    startX: 160,
    startY: 920,
    apexX: 130,
    apexY: 860,
  },
  {
    id: "monza-bz-6",
    name: "Curva Parabolica (Alboreto)",
    cornerNumber: 11,
    startDistance: 4760,
    endDistance: 4850,
    entrySpeed: 340,
    minSpeed: 194,
    speedDelta: 146,
    decelerationG: -4.2,
    gearDrop: "8th -> 5th",
    brakingDistanceM: 90,
    startX: -20,
    startY: 200,
    apexX: -50,
    apexY: 120,
  },
];

export const MONZA_HIGH_SPEED_SECTIONS: HighSpeedSection[] = [
  {
    id: "monza-hs-1",
    name: "Rettifilo Main Straight (DRS 1)",
    startDistance: 0,
    endDistance: 670,
    peakSpeed: 352,
    avgSpeed: 331,
    hasDRS: true,
    lengthM: 670,
    startX: 0,
    startY: 0,
    endX: 670,
    endY: 12,
  },
  {
    id: "monza-hs-2",
    name: "Curva Grande Full Throttle Sweep",
    startDistance: 950,
    endDistance: 1950,
    peakSpeed: 334,
    avgSpeed: 298,
    hasDRS: false,
    lengthM: 1000,
    startX: 800,
    startY: 220,
    endX: 940,
    endY: 920,
  },
  {
    id: "monza-hs-3",
    name: "Serraglio Straight (DRS 2)",
    startDistance: 2950,
    endDistance: 3660,
    peakSpeed: 338,
    avgSpeed: 308,
    hasDRS: true,
    lengthM: 710,
    startX: 440,
    startY: 1370,
    endX: 200,
    endY: 1010,
  },
  {
    id: "monza-hs-4",
    name: "Rettifilo di Ritorno (Back Straight)",
    startDistance: 4050,
    endDistance: 4760,
    peakSpeed: 340,
    avgSpeed: 312,
    hasDRS: true,
    lengthM: 710,
    startX: 40,
    startY: 620,
    endX: -5,
    endY: 310,
  },
];

export const MONZA_SECTORS: Sector[] = [
  { number: 1, name: "Sector 1 (Variante del Rettifilo & Curva Grande)", startDistance: 0, endDistance: 1650, splitTime: 26.852 },
  { number: 2, name: "Sector 2 (Roggia, Lesmos & Serraglio)", startDistance: 1650, endDistance: 3500, splitTime: 27.214 },
  { number: 3, name: "Sector 3 (Ascari & Parabolica Alboreto)", startDistance: 3500, endDistance: 5793, splitTime: 26.229 },
];

export const monzaCircuit: CircuitData = {
  id: "monza",
  name: "Autodromo Nazionale Monza",
  grandPrixName: "Italian Grand Prix",
  location: "Monza, Italy",
  country: "Italy",
  circuitLengthM: 5793,
  lapRecord: {
    time: "1:21.046",
    driver: "Rubens Barrichello",
    year: 2004,
  },
  eventYear: 2023,
  sessionType: "Pole Position Lap",
  corners: MONZA_CORNERS,
  brakingZones: MONZA_BRAKING_ZONES,
  highSpeedSections: MONZA_HIGH_SPEED_SECTIONS,
  sectors: MONZA_SECTORS,
  primaryDriver: {
    driverCode: "VER",
    driverName: "Max Verstappen",
    driverNumber: 1,
    team: "Red Bull Racing",
    teamColor: "#1e41ff",
    carModel: "RB19",
    lapTime: "1:20.295",
    lapTimeSeconds: 80.295,
    compound: "SOFT",
    telemetry: monzaTelemetryVerstappen,
  },
  comparisonDriver: {
    driverCode: "SAI",
    driverName: "Carlos Sainz",
    driverNumber: 55,
    team: "Scuderia Ferrari",
    teamColor: "#e80020",
    carModel: "SF-23",
    lapTime: "1:20.294",
    lapTimeSeconds: 80.294,
    compound: "SOFT",
    telemetry: monzaTelemetryLeclerc,
  },
};
