import * as THREE from 'three';
import { CircuitData, ColormapType } from '../../types/telemetry';
import { getColormapColor } from '../../utils/colormaps';

export function create3DTrack(
  circuit: CircuitData,
  colormap: ColormapType,
  scaleFactor: number = 0.2
): {
  trackMesh: THREE.Mesh;
  trackCurve: THREE.CatmullRomCurve3;
  trackPoints3D: THREE.Vector3[];
  speedValues: number[];
  kerbsMesh: THREE.Mesh;
  markersGroup: THREE.Group;
} {
  const telemetry = circuit.primaryDriver.telemetry;
  const markersGroup = new THREE.Group();

  // Find speed bounds
  let minSpeed = Infinity;
  let maxSpeed = -Infinity;
  telemetry.forEach(p => {
    if (p.speed < minSpeed) minSpeed = p.speed;
    if (p.speed > maxSpeed) maxSpeed = p.speed;
  });

  // Calculate center of mass to center the track around origin (0, 0, 0)
  let sumX = 0;
  let sumY = 0;
  telemetry.forEach(p => {
    sumX += p.x;
    sumY += p.y;
  });
  const centerX = sumX / telemetry.length;
  const centerY = sumY / telemetry.length;

  // Convert to 3D points (X -> X, Y -> -Z, height = 0)
  const trackPoints3D: THREE.Vector3[] = [];
  const speedValues: number[] = [];

  telemetry.forEach(p => {
    const x = (p.x - centerX) * scaleFactor;
    const z = -(p.y - centerY) * scaleFactor;
    // subtle elevation variations (especially for Spa or Monaco)
    let y = 0;
    if (circuit.id === 'spa') {
      // Eau Rouge uphill climb and Blanchimont descent
      y = Math.sin((p.distance / circuit.circuitLengthM) * Math.PI * 2) * 12;
    } else if (circuit.id === 'monaco') {
      // Beau Rivage uphill and tunnel descent
      y = Math.cos((p.distance / circuit.circuitLengthM) * Math.PI * 2) * 8;
    }
    trackPoints3D.push(new THREE.Vector3(x, y, z));
    speedValues.push(p.speed);
  });

  // Create smooth CatmullRom spline
  const trackCurve = new THREE.CatmullRomCurve3(trackPoints3D, true, 'centripetal');

  // Build Road Ribbon Geometry with vertex colors from colormap
  const trackWidth = 3.6; // Road width in 3D units
  const numPoints = trackPoints3D.length;

  const vertices: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const curr = trackPoints3D[i];
    const next = trackPoints3D[(i + 1) % numPoints];
    const prev = trackPoints3D[(i - 1 + numPoints) % numPoints];

    // Tangent direction
    const forward = new THREE.Vector3().subVectors(next, prev).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    // Perpendicular sideways vector
    const right = new THREE.Vector3().crossVectors(forward, up).normalize().multiplyScalar(trackWidth * 0.5);

    // Left and right edges
    const leftPt = new THREE.Vector3().copy(curr).sub(right);
    const rightPt = new THREE.Vector3().copy(curr).add(right);

    vertices.push(leftPt.x, leftPt.y, leftPt.z);
    vertices.push(rightPt.x, rightPt.y, rightPt.z);

    // Color from colormap
    const spd = speedValues[i];
    const { rgb } = getColormapColor(colormap, spd, minSpeed, maxSpeed);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    colors.push(r, g, b);
    colors.push(r, g, b);

    normals.push(0, 1, 0);
    normals.push(0, 1, 0);

    const u = i / numPoints;
    uvs.push(0, u * 20);
    uvs.push(1, u * 20);

    if (i < numPoints - 1) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    } else {
      // Close loop
      const idx = i * 2;
      indices.push(idx, idx + 1, 0);
      indices.push(idx + 1, 1, 0);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);

  const roadMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const trackMesh = new THREE.Mesh(roadGeo, roadMat);
  trackMesh.receiveShadow = true;

  // Build Red/White FIA Kerbs along outer edges
  const kerbGeo = new THREE.BufferGeometry();
  const kerbVerts: number[] = [];
  const kerbColors: number[] = [];
  const kerbIndices: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const curr = trackPoints3D[i];
    const next = trackPoints3D[(i + 1) % numPoints];
    const prev = trackPoints3D[(i - 1 + numPoints) % numPoints];
    const forward = new THREE.Vector3().subVectors(next, prev).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const kerbWidth = 0.5;
    const outerRight1 = new THREE.Vector3().copy(curr).addScaledVector(right, trackWidth * 0.5);
    const outerRight2 = new THREE.Vector3().copy(curr).addScaledVector(right, trackWidth * 0.5 + kerbWidth);

    kerbVerts.push(outerRight1.x, outerRight1.y + 0.02, outerRight1.z);
    kerbVerts.push(outerRight2.x, outerRight2.y + 0.04, outerRight2.z);

    // Alternate red and white
    const isRed = Math.floor(i / 2) % 2 === 0;
    const kr = isRed ? 0.95 : 0.95;
    const kg = isRed ? 0.1 : 0.95;
    const kb = isRed ? 0.1 : 0.95;

    kerbColors.push(kr, kg, kb);
    kerbColors.push(kr, kg, kb);

    if (i < numPoints - 1) {
      const idx = i * 2;
      kerbIndices.push(idx, idx + 1, idx + 2);
      kerbIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbVerts, 3));
  kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbColors, 3));
  kerbGeo.setIndex(kerbIndices);

  const kerbMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const kerbsMesh = new THREE.Mesh(kerbGeo, kerbMat);

  // 3D Markers: Braking Zones (Red Holographic Pillars)
  circuit.brakingZones.forEach(bz => {
    const x = (bz.startX - centerX) * scaleFactor;
    const z = -(bz.startY - centerY) * scaleFactor;

    // Glowing red beacon pillar
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 12);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.55,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, 2.5, z);
    markersGroup.add(pillar);

    // Glowing top sphere
    const sphereGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, 5.2, z);
    markersGroup.add(sphere);
  });

  // 3D Markers: High-Speed Sections (Cyan DRS Arches)
  circuit.highSpeedSections.forEach(hs => {
    const x = (hs.startX - centerX) * scaleFactor;
    const z = -(hs.startY - centerY) * scaleFactor;

    const archGeo = new THREE.TorusGeometry(3.5, 0.15, 8, 16, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.75,
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(x, 0, z);
    markersGroup.add(arch);
  });

  // 3D Markers: Start/Finish Line Gantry
  const startPt = trackPoints3D[0];
  const gantryGeo = new THREE.BoxGeometry(trackWidth * 1.5, 0.4, 0.4);
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.8 });
  const gantry = new THREE.Mesh(gantryGeo, gantryMat);
  gantry.position.set(startPt.x, 3.2, startPt.z);
  markersGroup.add(gantry);

  return {
    trackMesh,
    trackCurve,
    trackPoints3D,
    speedValues,
    kerbsMesh,
    markersGroup,
  };
}
