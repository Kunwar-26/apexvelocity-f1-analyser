import { CircuitData, Corner, BrakingZone, HighSpeedSection, Sector, TelemetryPoint } from '../../types/telemetry';

// Spa-Francorchamps authentic coordinate waypoints (X, Y in meters)
const SPA_WAYPOINTS = [
  // Start/Finish straight into La Source
  { x: 100, y: 100, speed: 285, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Main Straight" },
  { x: 280, y: 105, speed: 312, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Approach La Source" },
  // Turn 1 La Source Hairpin
  { x: 380, y: 110, speed: 190, gear: 4, throttle: 0, brake: 95, drs: false, desc: "Braking La Source" },
  { x: 420, y: 80, speed: 78, gear: 2, throttle: 20, brake: 15, drs: false, desc: "T1 La Source Apex" },
  { x: 400, y: 30, speed: 115, gear: 2, throttle: 70, brake: 0, drs: false, desc: "Exit La Source" },
  // Downhill run to Eau Rouge
  { x: 320, y: -80, speed: 190, gear: 4, throttle: 100, brake: 0, drs: false, desc: "Downhill descent" },
  { x: 240, y: -220, speed: 260, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Approach Eau Rouge" },
  // Turn 2 & 3: Eau Rouge
  { x: 190, y: -340, speed: 302, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T2 Eau Rouge Left" },
  // Turn 4: Raidillon uphill blind crest
  { x: 175, y: -450, speed: 305, gear: 7, throttle: 100, brake: 0, drs: false, desc: "T3-T4 Raidillon Crest" },
  { x: 170, y: -580, speed: 312, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Kemmel Entry" },
  // Kemmel Straight (Highest speed on circuit)
  { x: 160, y: -850, speed: 332, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Kemmel Straight Mid" },
  { x: 145, y: -1200, speed: 343, gear: 8, throttle: 100, brake: 0, drs: true, desc: "Kemmel Speed Trap" },
  // Turn 5-6-7: Les Combes & Malmedy
  { x: 135, y: -1360, speed: 220, gear: 5, throttle: 0, brake: 90, drs: false, desc: "Braking Les Combes" },
  { x: 110, y: -1450, speed: 142, gear: 4, throttle: 30, brake: 10, drs: false, desc: "T5 Les Combes Right" },
  { x: 60, y: -1490, speed: 155, gear: 4, throttle: 60, brake: 0, drs: false, desc: "T6 Les Combes Left" },
  { x: 0, y: -1470, speed: 178, gear: 4, throttle: 80, brake: 0, drs: false, desc: "T7 Malmedy Right" },
  // Turn 8: Bruxelles / Rivage Downhill Hairpin
  { x: -90, y: -1380, speed: 235, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Downhill descent" },
  { x: -160, y: -1280, speed: 160, gear: 4, throttle: 0, brake: 80, drs: false, desc: "Braking Bruxelles" },
  { x: -210, y: -1220, speed: 105, gear: 3, throttle: 35, brake: 0, drs: false, desc: "T8 Bruxelles Apex" },
  // Turn 9: Speaker's Corner / No-Name
  { x: -260, y: -1280, speed: 168, gear: 4, throttle: 70, brake: 0, drs: false, desc: "T9 Left Hand Sweep" },
  // Turn 10 & 11: Pouhon (Extreme High Speed Double Left)
  { x: -330, y: -1400, speed: 275, gear: 6, throttle: 100, brake: 0, drs: false, desc: "Run to Pouhon" },
  { x: -420, y: -1500, speed: 292, gear: 6, throttle: 90, brake: 15, drs: false, desc: "T10 Pouhon Entry (4.9G)" },
  { x: -520, y: -1540, speed: 288, gear: 6, throttle: 100, brake: 0, drs: false, desc: "T11 Pouhon Mid" },
  { x: -620, y: -1490, speed: 295, gear: 7, throttle: 100, brake: 0, drs: false, desc: "Pouhon Exit" },
  // Turn 12 & 13: Les Fagnes (Campus)
  { x: -680, y: -1380, speed: 260, gear: 6, throttle: 20, brake: 70, drs: false, desc: "Braking Campus" },
  { x: -710, y: -1280, speed: 165, gear: 4, throttle: 40, brake: 0, drs: false, desc: "T12 Campus Right" },
  { x: -690, y: -1180, speed: 175, gear: 4, throttle: 65, brake: 0, drs: false, desc: "T13 Campus Left" },
  // Turn 14 & 15: Stavelot & Curve Paul Frère
  { x: -640, y: -1060, speed: 220, gear: 5, throttle: 100, brake: 0, drs: false, desc: "Run to Stavelot" },
  { x: -580, y: -940, speed: 245, gear: 6, throttle: 100, brake: 0, drs: false, desc: "T14 Stavelot Curve" },
  { x: -500, y: -820, speed: 270, gear: 6, throttle: 100, brake: 0, drs: false, desc: "T15 Paul Frère" },
  // Blanchimont Flat-Out Sweepers (Turns 16 & 17)
  { x: -400, y: -640, speed: 300, gear: 7, throttle: 100, brake: 0, drs: true, desc: "Approach Blanchimont" },
  { x: -280, y: -420, speed: 318, gear: 8, throttle: 100, brake: 0, drs: true, desc: "T16 Blanchimont 1" },
  { x: -160, y: -200, speed: 326, gear: 8, throttle: 100, brake: 0, drs: true, desc: "T17 Blanchimont 2" },
  // Bus Stop Chicane (Turns 18 & 19)
  { x: -60, y: -50, speed: 210, gear: 5, throttle: 0, brake: 95, drs: false, desc: "Braking Bus Stop" },
  { x: 0, y: 15, speed: 82, gear: 2, throttle: 25, brake: 15, drs: false, desc: "T18 Bus Stop Right" },
  { x: 40, y: 50, speed: 95, gear: 2, throttle: 60, brake: 0, drs: false, desc: "T19 Bus Stop Left" },
  { x: 100, y: 100, speed: 285, gear: 6, throttle: 100, brake: 0, drs: true, desc: "Finish Line" },
];

function generateSpaTelemetry(driverVariation = 0): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const steps = 6;
  let dist = 0;
  let time = 0;

  for (let i = 0; i < SPA_WAYPOINTS.length - 1; i++) {
    const p1 = SPA_WAYPOINTS[i];
    const p2 = SPA_WAYPOINTS[i + 1];

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const smoothT = t * t * (3 - 2 * t);
      const x = p1.x + (p2.x - p1.x) * smoothT;
      const y = p1.y + (p2.y - p1.y) * smoothT;
      let speed = p1.speed + (p2.speed - p1.speed) * smoothT + (driverVariation * Math.cos((i * steps + s) * 0.3));
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

      const longG = brake > 10 ? -((brake / 100) * 5.0) : ((throttle / 100) * 1.5);
      const latG = (speed > 250 && (i >= 6 && i <= 8 || i >= 20 && i <= 22 || i >= 29 && i <= 31)) ? 4.9 : (Math.random() * 0.4 - 0.2);

      points.push({
        index: points.length,
        x,
        y,
        distance: Math.round(dist * 10) / 10,
        speed: Math.round(speed * 10) / 10,
        throttle: Math.max(0, Math.min(100, throttle)),
        brake: Math.max(0, Math.min(100, brake)),
        gear: Math.max(1, Math.min(8, gear)),
        rpm: Math.round(9800 + (speed / (gear * 46)) * 2300),
        drs: p1.drs && p2.drs,
        time: Math.round(time * 1000) / 1000,
        latG: Math.round(latG * 10) / 10,
        longG: Math.round(longG * 10) / 10,
      });
    }
  }
  return points;
}

export const SPA_CORNERS: Corner[] = [
  { number: 1, name: "La Source", x: 420, y: 80, distance: 400, apexSpeed: 78, gear: 2, type: 'hairpin' },
  { number: 2, name: "Eau Rouge", x: 190, y: -340, distance: 1100, apexSpeed: 302, gear: 7, type: 'fast' },
  { number: 3, name: "Raidillon (Bottom)", x: 180, y: -400, distance: 1220, apexSpeed: 304, gear: 7, type: 'fast' },
  { number: 4, name: "Raidillon (Crest)", x: 175, y: -450, distance: 1300, apexSpeed: 305, gear: 7, type: 'fast' },
  { number: 5, name: "Les Combes", x: 110, y: -1450, distance: 2950, apexSpeed: 142, gear: 4, type: 'chicane' },
  { number: 6, name: "Les Combes (Turn 6)", x: 60, y: -1490, distance: 3050, apexSpeed: 155, gear: 4, type: 'chicane' },
  { number: 7, name: "Malmedy", x: 0, y: -1470, distance: 3180, apexSpeed: 178, gear: 4, type: 'medium' },
  { number: 8, name: "Bruxelles (Rivage)", x: -210, y: -1220, distance: 3650, apexSpeed: 105, gear: 3, type: 'hairpin' },
  { number: 9, name: "Speakers Corner / No-Name", x: -260, y: -1280, distance: 3950, apexSpeed: 168, gear: 4, type: 'medium' },
  { number: 10, name: "Pouhon (Entry)", x: -420, y: -1500, distance: 4400, apexSpeed: 292, gear: 6, type: 'fast' },
  { number: 11, name: "Pouhon (Mid)", x: -520, y: -1540, distance: 4580, apexSpeed: 288, gear: 6, type: 'fast' },
  { number: 12, name: "Campus", x: -710, y: -1280, distance: 5050, apexSpeed: 165, gear: 4, type: 'medium' },
  { number: 13, name: "Stavelot (Entry)", x: -690, y: -1180, distance: 5200, apexSpeed: 175, gear: 4, type: 'medium' },
  { number: 14, name: "Stavelot (Exit)", x: -580, y: -940, distance: 5480, apexSpeed: 245, gear: 6, type: 'fast' },
  { number: 15, name: "Paul Frère", x: -500, y: -820, distance: 5650, apexSpeed: 270, gear: 6, type: 'fast' },
  { number: 16, name: "Blanchimont 1", x: -280, y: -420, distance: 6250, apexSpeed: 318, gear: 8, type: 'fast' },
  { number: 17, name: "Blanchimont 2", x: -160, y: -200, distance: 6500, apexSpeed: 326, gear: 8, type: 'fast' },
  { number: 18, name: "Bus Stop Chicane (Entry)", x: 0, y: 15, distance: 6850, apexSpeed: 82, gear: 2, type: 'chicane' },
  { number: 19, name: "Bus Stop Chicane (Exit)", x: 40, y: 50, distance: 6920, apexSpeed: 95, gear: 2, type: 'chicane' },
];

export const SPA_BRAKING_ZONES: BrakingZone[] = [
  {
    id: "spa-bz-1",
    name: "La Source (T1)",
    cornerNumber: 1,
    startDistance: 290,
    endDistance: 400,
    entrySpeed: 312,
    minSpeed: 78,
    speedDelta: 234,
    decelerationG: -5.0,
    gearDrop: "7th -> 2nd",
    brakingDistanceM: 110,
    startX: 280,
    startY: 105,
    apexX: 420,
    apexY: 80,
  },
  {
    id: "spa-bz-2",
    name: "Les Combes (T5)",
    cornerNumber: 5,
    startDistance: 2840,
    endDistance: 2950,
    entrySpeed: 343,
    minSpeed: 142,
    speedDelta: 201,
    decelerationG: -4.8,
    gearDrop: "8th -> 4th",
    brakingDistanceM: 110,
    startX: 145,
    startY: -1200,
    apexX: 110,
    apexY: -1450,
  },
  {
    id: "spa-bz-3",
    name: "Bruxelles / Rivage (T8)",
    cornerNumber: 8,
    startDistance: 3560,
    endDistance: 3650,
    entrySpeed: 235,
    minSpeed: 105,
    speedDelta: 130,
    decelerationG: -4.1,
    gearDrop: "5th -> 3rd",
    brakingDistanceM: 90,
    startX: -160,
    startY: -1280,
    apexX: -210,
    apexY: -1220,
  },
  {
    id: "spa-bz-4",
    name: "Campus (T12)",
    cornerNumber: 12,
    startDistance: 4970,
    endDistance: 5050,
    entrySpeed: 260,
    minSpeed: 165,
    speedDelta: 95,
    decelerationG: -3.8,
    gearDrop: "6th -> 4th",
    brakingDistanceM: 80,
    startX: -680,
    startY: -1380,
    apexX: -710,
    apexY: -1280,
  },
  {
    id: "spa-bz-5",
    name: "Bus Stop Chicane (T18)",
    cornerNumber: 18,
    startDistance: 6730,
    endDistance: 6850,
    entrySpeed: 326,
    minSpeed: 82,
    speedDelta: 244,
    decelerationG: -5.1,
    gearDrop: "8th -> 2nd",
    brakingDistanceM: 120,
    startX: -60,
    startY: -50,
    apexX: 0,
    apexY: 15,
  },
];

export const SPA_HIGH_SPEED_SECTIONS: HighSpeedSection[] = [
  {
    id: "spa-hs-1",
    name: "Eau Rouge to Raidillon Compression",
    startDistance: 950,
    endDistance: 1350,
    peakSpeed: 305,
    avgSpeed: 298,
    hasDRS: false,
    lengthM: 400,
    startX: 190,
    startY: -340,
    endX: 175,
    endY: -450,
  },
  {
    id: "spa-hs-2",
    name: "Kemmel Straight (Full DRS Flight)",
    startDistance: 1400,
    endDistance: 2840,
    peakSpeed: 343,
    avgSpeed: 328,
    hasDRS: true,
    lengthM: 1440,
    startX: 170,
    startY: -580,
    endX: 145,
    endY: -1200,
  },
  {
    id: "spa-hs-3",
    name: "Pouhon High-Downforce Double Left",
    startDistance: 4250,
    endDistance: 4800,
    peakSpeed: 295,
    avgSpeed: 290,
    hasDRS: false,
    lengthM: 550,
    startX: -330,
    startY: -1400,
    endX: -620,
    endY: -1490,
  },
  {
    id: "spa-hs-4",
    name: "Blanchimont Sweeper (Flat Out)",
    startDistance: 5900,
    endDistance: 6730,
    peakSpeed: 326,
    avgSpeed: 314,
    hasDRS: true,
    lengthM: 830,
    startX: -400,
    startY: -640,
    endX: -160,
    endY: -200,
  },
];

export const SPA_SECTORS: Sector[] = [
  { number: 1, name: "Sector 1 (La Source & Kemmel Straight)", startDistance: 0, endDistance: 2200, splitTime: 30.125 },
  { number: 2, name: "Sector 2 (Les Combes, Bruxelles & Pouhon)", startDistance: 2200, endDistance: 4950, splitTime: 43.680 },
  { number: 3, name: "Sector 3 (Campus, Blanchimont & Bus Stop)", startDistance: 4950, endDistance: 7004, splitTime: 27.915 },
];

export const spaCircuit: CircuitData = {
  id: "spa",
  name: "Circuit de Spa-Francorchamps",
  grandPrixName: "Belgian Grand Prix",
  location: "Stavelot, Belgium",
  country: "Belgium",
  circuitLengthM: 7004,
  lapRecord: {
    time: "1:41.252",
    driver: "Lewis Hamilton",
    year: 2020,
  },
  eventYear: 2023,
  sessionType: "Pole Position Lap",
  corners: SPA_CORNERS,
  brakingZones: SPA_BRAKING_ZONES,
  highSpeedSections: SPA_HIGH_SPEED_SECTIONS,
  sectors: SPA_SECTORS,
  primaryDriver: {
    driverCode: "VER",
    driverName: "Max Verstappen",
    driverNumber: 1,
    team: "Red Bull Racing",
    teamColor: "#1e41ff",
    carModel: "RB19",
    lapTime: "1:41.720",
    lapTimeSeconds: 101.720,
    compound: "SOFT",
    telemetry: generateSpaTelemetry(0),
  },
  comparisonDriver: {
    driverCode: "LEC",
    driverName: "Charles Leclerc",
    driverNumber: 16,
    team: "Scuderia Ferrari",
    teamColor: "#e80020",
    carModel: "SF-23",
    lapTime: "1:42.540",
    lapTimeSeconds: 102.540,
    compound: "SOFT",
    telemetry: generateSpaTelemetry(-3.2),
  },
};
