import * as THREE from 'three';

/**
 * Creates a high-fidelity procedural Formula 1 Car 3D model (Composite 10-part THREE.Group).
 * Includes monocoque chassis, nosecone, front wing with endplates, rear wing with DRS flap,
 * sidepods, halo safety ring, driver cockpit with helmet, and 4 detailed wheels.
 */
export function createF1Car(teamColorHex: string = '#1e41ff'): {
  carGroup: THREE.Group;
  wheels: THREE.Mesh[];
  drsFlap: THREE.Mesh;
  frontWheelsGroup: THREE.Group;
  chassisMesh: THREE.Mesh;
  updateColor: (newColorHex: string) => void;
} {
  const carGroup = new THREE.Group();

  // Materials
  const liveryColor = new THREE.Color(teamColorHex);
  const carPaintMaterial = new THREE.MeshStandardMaterial({
    color: liveryColor,
    roughness: 0.2,
    metalness: 0.75,
  });

  const carbonFiberMaterial = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.5,
    metalness: 0.3,
  });

  const tyreRubberMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    roughness: 0.3,
    metalness: 0.85,
  });

  const helmetMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.6,
  });

  const visorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.9,
  });

  const haloMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.8,
  });

  // 1. Main Monocoque Chassis (Sleek elongated tapered body)
  const chassisGeo = new THREE.BoxGeometry(0.8, 0.45, 2.6);
  const chassisMesh = new THREE.Mesh(chassisGeo, carPaintMaterial);
  chassisMesh.position.set(0, 0.32, 0);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  carGroup.add(chassisMesh);

  // 2. Tapered Nose Cone
  const noseGeo = new THREE.ConeGeometry(0.38, 1.4, 4);
  const noseMesh = new THREE.Mesh(noseGeo, carPaintMaterial);
  noseMesh.rotation.x = Math.PI / 2;
  noseMesh.rotation.y = Math.PI / 4;
  noseMesh.position.set(0, 0.28, 1.85);
  noseMesh.scale.set(0.9, 1.0, 0.55);
  noseMesh.castShadow = true;
  carGroup.add(noseMesh);

  // 3. Front Wing Assembly (Aerodynamic cascade with endplates)
  const frontWingMainGeo = new THREE.BoxGeometry(1.9, 0.05, 0.42);
  const frontWing = new THREE.Mesh(frontWingMainGeo, carbonFiberMaterial);
  frontWing.position.set(0, 0.16, 2.35);
  frontWing.castShadow = true;
  carGroup.add(frontWing);

  // Front Wing Endplates (Left & Right)
  const endplateGeo = new THREE.BoxGeometry(0.04, 0.22, 0.48);
  const leftEndplate = new THREE.Mesh(endplateGeo, carPaintMaterial);
  leftEndplate.position.set(0.95, 0.24, 2.35);
  carGroup.add(leftEndplate);

  const rightEndplate = new THREE.Mesh(endplateGeo, carPaintMaterial);
  rightEndplate.position.set(-0.95, 0.24, 2.35);
  carGroup.add(rightEndplate);

  // 4. Sidepods & Engine Cover
  const sidepodGeo = new THREE.BoxGeometry(0.35, 0.38, 1.4);
  const leftSidepod = new THREE.Mesh(sidepodGeo, carPaintMaterial);
  leftSidepod.position.set(0.55, 0.28, -0.1);
  leftSidepod.castShadow = true;
  carGroup.add(leftSidepod);

  const rightSidepod = new THREE.Mesh(sidepodGeo, carPaintMaterial);
  rightSidepod.position.set(-0.55, 0.28, -0.1);
  rightSidepod.castShadow = true;
  carGroup.add(rightSidepod);

  // Engine Airbox & Shark Fin
  const airboxGeo = new THREE.BoxGeometry(0.32, 0.42, 0.8);
  const airbox = new THREE.Mesh(airboxGeo, carPaintMaterial);
  airbox.position.set(0, 0.65, -0.4);
  airbox.castShadow = true;
  carGroup.add(airbox);

  const sharkFinGeo = new THREE.BoxGeometry(0.04, 0.38, 0.9);
  const sharkFin = new THREE.Mesh(sharkFinGeo, carbonFiberMaterial);
  sharkFin.position.set(0, 0.65, -0.9);
  carGroup.add(sharkFin);

  // 5. Halo Titanium Safety System
  const haloCurve = new THREE.TorusGeometry(0.28, 0.04, 8, 20, Math.PI);
  const halo = new THREE.Mesh(haloCurve, haloMaterial);
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.58, 0.3);
  carGroup.add(halo);

  const haloPillarGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8);
  const haloPillar = new THREE.Mesh(haloPillarGeo, haloMaterial);
  haloPillar.position.set(0, 0.46, 0.58);
  carGroup.add(haloPillar);

  // 6. Cockpit & Driver Helmet
  const helmetGeo = new THREE.SphereGeometry(0.14, 16, 16);
  const helmet = new THREE.Mesh(helmetGeo, helmetMaterial);
  helmet.position.set(0, 0.52, 0.25);
  carGroup.add(helmet);

  const visorGeo = new THREE.BoxGeometry(0.16, 0.06, 0.12);
  const visor = new THREE.Mesh(visorGeo, visorMaterial);
  visor.position.set(0, 0.52, 0.33);
  carGroup.add(visor);

  // 7. Rear Wing Assembly with DRS Flap
  const rearWingPillarsGeo = new THREE.BoxGeometry(0.05, 0.5, 0.1);
  const leftRearPillar = new THREE.Mesh(rearWingPillarsGeo, carbonFiberMaterial);
  leftRearPillar.position.set(0.22, 0.55, -1.35);
  carGroup.add(leftRearPillar);

  const rightRearPillar = new THREE.Mesh(rearWingPillarsGeo, carbonFiberMaterial);
  rightRearPillar.position.set(-0.22, 0.55, -1.35);
  carGroup.add(rightRearPillar);

  const rearMainPlaneGeo = new THREE.BoxGeometry(1.4, 0.04, 0.38);
  const rearMainPlane = new THREE.Mesh(rearMainPlaneGeo, carbonFiberMaterial);
  rearMainPlane.position.set(0, 0.72, -1.4);
  rearMainPlane.castShadow = true;
  carGroup.add(rearMainPlane);

  // Movable DRS Flap
  const drsFlapGeo = new THREE.BoxGeometry(1.36, 0.035, 0.2);
  const drsFlap = new THREE.Mesh(drsFlapGeo, carPaintMaterial);
  drsFlap.position.set(0, 0.82, -1.45);
  carGroup.add(drsFlap);

  // Rear Endplates
  const rearEndplateGeo = new THREE.BoxGeometry(0.04, 0.42, 0.45);
  const leftRearEndplate = new THREE.Mesh(rearEndplateGeo, carPaintMaterial);
  leftRearEndplate.position.set(0.7, 0.68, -1.4);
  carGroup.add(leftRearEndplate);

  const rightRearEndplate = new THREE.Mesh(rearEndplateGeo, carPaintMaterial);
  rightRearEndplate.position.set(-0.7, 0.68, -1.4);
  carGroup.add(rightRearEndplate);

  // 8. Wheels (Front-Left, Front-Right, Rear-Left, Rear-Right)
  const frontWheelsGroup = new THREE.Group();
  carGroup.add(frontWheelsGroup);

  const wheels: THREE.Mesh[] = [];

  function createWheel(isFront: boolean): THREE.Mesh {
    const width = isFront ? 0.32 : 0.42;
    const radius = 0.34;
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelMesh = new THREE.Mesh(wheelGeo, tyreRubberMaterial);
    wheelMesh.castShadow = true;

    // Rim detail
    const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width * 1.02, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    wheelMesh.add(rimMesh);

    return wheelMesh;
  }

  // Front Left & Right
  const flWheel = createWheel(true);
  flWheel.position.set(0.85, 0.34, 1.35);
  frontWheelsGroup.add(flWheel);
  wheels.push(flWheel);

  const frWheel = createWheel(true);
  frWheel.position.set(-0.85, 0.34, 1.35);
  frontWheelsGroup.add(frWheel);
  wheels.push(frWheel);

  // Rear Left & Right
  const rlWheel = createWheel(false);
  rlWheel.position.set(0.88, 0.35, -1.1);
  carGroup.add(rlWheel);
  wheels.push(rlWheel);

  const rrWheel = createWheel(false);
  rrWheel.position.set(-0.88, 0.35, -1.1);
  carGroup.add(rrWheel);
  wheels.push(rrWheel);

  // Floor & Rear Diffuser
  const floorGeo = new THREE.BoxGeometry(1.5, 0.04, 2.8);
  const floor = new THREE.Mesh(floorGeo, carbonFiberMaterial);
  floor.position.set(0, 0.08, 0.2);
  carGroup.add(floor);

  // Rain light / ERS amber LED at rear
  const rainLightGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
  const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rainLight = new THREE.Mesh(rainLightGeo, rainLightMat);
  rainLight.position.set(0, 0.2, -1.45);
  carGroup.add(rainLight);

  // Contact shadow mesh directly beneath car
  const shadowGeo = new THREE.PlaneGeometry(2.4, 4.2);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = new THREE.CanvasTexture(canvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.02, 0.2);
  carGroup.add(shadowPlane);

  return {
    carGroup,
    wheels,
    drsFlap,
    frontWheelsGroup,
    chassisMesh,
    updateColor: (newColorHex: string) => {
      carPaintMaterial.color.set(newColorHex);
    },
  };
}
