import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CircuitData, ColormapType, SpeedUnit } from '../../types/telemetry';
import { createF1Car } from './F1Car3D';
import { create3DTrack } from './Track3D';
import { Eye, Video, Crosshair, Compass, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { formatSpeed } from '../../utils/colormaps';

interface CircuitScene3DProps {
  circuit: CircuitData;
  currentIndex: number;
  onSeek: (index: number) => void;
  colormap: ColormapType;
  speedUnit: SpeedUnit;
  isPlaying: boolean;
}

export type CameraMode = 'chase' | 'cockpit' | 'broadcast' | 'orbit';

export const CircuitScene3D: React.FC<CircuitScene3DProps> = ({
  circuit,
  currentIndex,
  onSeek,
  colormap,
  speedUnit,
  isPlaying,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [sparksEnabled, setSparksEnabled] = useState<boolean>(true);

  // References to keep animation loop stable without recreating Three.js scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carObjectsRef = useRef<ReturnType<typeof createF1Car> | null>(null);
  const trackDataRef = useRef<ReturnType<typeof create3DTrack> | null>(null);
  const currentIndexRef = useRef<number>(currentIndex);
  currentIndexRef.current = currentIndex;
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  // Orbit controls state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitSphericalRef = useRef({ theta: 0.8, phi: 0.6, radius: 120 });

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101213);
    scene.fog = new THREE.FogExp2(0x101213, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    camera.position.set(0, 40, 90);
    cameraRef.current = camera;

    // 3. Renderer with PBR color pipeline
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(120, 160, 100);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 400;
      sunLight.shadow.bias = -0.0005;
      const d = 150;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    // 5. Ground Plane with subtle grid
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Build 3D Track & Markers
    const trackData = create3DTrack(circuit, colormap, 0.22);
    trackDataRef.current = trackData;
    scene.add(trackData.trackMesh);
    scene.add(trackData.kerbsMesh);
    scene.add(trackData.markersGroup);

    // 7. Build Procedural 3D F1 Car
    const car = createF1Car(circuit.primaryDriver.teamColor);
    carObjectsRef.current = car;
    scene.add(car.carGroup);

    // 8. Titanium sparks particles system
    const sparkCount = 80;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVels: THREE.Vector3[] = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = -100;
      sparkPositions[i * 3 + 2] = 0;
      sparkVels.push(new THREE.Vector3());
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Mouse Drag for Orbit Cam
    const handleMouseDown = (e: MouseEvent) => {
      if (cameraModeRef.current !== 'orbit') return;
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || cameraModeRef.current !== 'orbit') return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      orbitSphericalRef.current.theta -= deltaX * 0.008;
      orbitSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitSphericalRef.current.phi + deltaY * 0.008));
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (cameraModeRef.current !== 'orbit') return;
      orbitSphericalRef.current.radius = Math.max(15, Math.min(350, orbitSphericalRef.current.radius + e.deltaY * 0.1));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel);

    // 11. Animation Tick Loop
    let animationFrameId: number;
    let prevTime = performance.now();
    const carPosSmoothed = new THREE.Vector3();
    const carForwardSmoothed = new THREE.Vector3(0, 0, 1);

    const tick = (now: number) => {
      const delta = (now - prevTime) / 1000;
      prevTime = now;

      const idx = currentIndexRef.current;
      const pts = trackData.trackPoints3D;

      if (pts.length > 0) {
        const currIdx = Math.max(0, Math.min(pts.length - 1, idx));
        const nextIdx = (currIdx + 1) % pts.length;
        const targetPt = pts[currIdx];
        const nextPt = pts[nextIdx];

        // Smooth position damping
        carPosSmoothed.lerp(targetPt, 0.35);
        car.carGroup.position.copy(carPosSmoothed);

        // Heading direction
        const dir = new THREE.Vector3().subVectors(nextPt, targetPt).normalize();
        if (dir.lengthSq() > 0.001) {
          carForwardSmoothed.lerp(dir, 0.25);
          // Set car rotation along direction vector
          const targetRotY = Math.atan2(carForwardSmoothed.x, carForwardSmoothed.z);
          car.carGroup.rotation.y = targetRotY;

          // Physics body pitch & roll
          const currPtTelemetry = circuit.primaryDriver.telemetry[currIdx];
          if (currPtTelemetry) {
            // Braking dive
            const pitchAngle = (currPtTelemetry.brake / 100) * 0.04 - (currPtTelemetry.throttle / 100) * 0.02;
            car.chassisMesh.rotation.x = pitchAngle;

            // Cornering roll
            const rollAngle = -(currPtTelemetry.latG / 5) * 0.05;
            car.chassisMesh.rotation.z = rollAngle;

            // Front wheels steering angle
            car.frontWheelsGroup.rotation.y = rollAngle * 2.2;

            // DRS Flap open/close animation
            car.drsFlap.rotation.x = currPtTelemetry.drs ? -0.45 : 0;

            // Spin wheels
            const wheelSpinSpeed = (currPtTelemetry.speed / 3.6) * delta * 5;
            car.wheels.forEach(w => {
              w.rotation.x += wheelSpinSpeed;
            });

            // Titanium sparks when braking hard or high-speed compression
            if (currPtTelemetry.brake > 60 || currPtTelemetry.speed > 310) {
              const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
              const rearPos = new THREE.Vector3(0, 0.1, -1.5).applyMatrix4(car.carGroup.matrixWorld);
              for (let s = 0; s < 4; s++) {
                const sIdx = Math.floor(Math.random() * sparkCount);
                posAttr.setXYZ(sIdx, rearPos.x + (Math.random() - 0.5) * 0.4, rearPos.y, rearPos.z + (Math.random() - 0.5) * 0.4);
                sparkVels[sIdx].set((Math.random() - 0.5) * 4, Math.random() * 2, -carForwardSmoothed.z * 15 + (Math.random() - 0.5) * 5);
              }
              posAttr.needsUpdate = true;
            }
          }
        }

        // Camera positioning based on mode
        const mode = cameraModeRef.current;
        if (mode === 'chase') {
          // Dynamic third-person chase cam
          const chaseOffset = new THREE.Vector3(0, 3.2, -7.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.carGroup.rotation.y);
          const camTargetPos = new THREE.Vector3().copy(carPosSmoothed).add(chaseOffset);
          camera.position.lerp(camTargetPos, 0.12);
          const lookAhead = new THREE.Vector3(0, 1.2, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.carGroup.rotation.y);
          camera.lookAt(new THREE.Vector3().copy(carPosSmoothed).add(lookAhead));
        } else if (mode === 'cockpit') {
          // Cockpit / Halo POV
          const cockpitOffset = new THREE.Vector3(0, 0.65, 0.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.carGroup.rotation.y);
          camera.position.copy(carPosSmoothed).add(cockpitOffset);
          const frontLook = new THREE.Vector3(0, 0.55, 12).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.carGroup.rotation.y);
          camera.lookAt(new THREE.Vector3().copy(carPosSmoothed).add(frontLook));
        } else if (mode === 'broadcast') {
          // Elevated TV Broadcast tracking cam
          const broadcastCamX = Math.cos((currIdx / pts.length) * Math.PI * 2) * 80;
          const broadcastCamZ = Math.sin((currIdx / pts.length) * Math.PI * 2) * 80;
          const broadcastPos = new THREE.Vector3(broadcastCamX, 45, broadcastCamZ);
          camera.position.lerp(broadcastPos, 0.05);
          camera.lookAt(carPosSmoothed);
        } else if (mode === 'orbit') {
          // Free Orbit camera around car or track center
          const { theta, phi, radius } = orbitSphericalRef.current;
          const ox = carPosSmoothed.x + radius * Math.sin(phi) * Math.sin(theta);
          const oy = carPosSmoothed.y + radius * Math.cos(phi);
          const oz = carPosSmoothed.z + radius * Math.sin(phi) * Math.cos(theta);
          camera.position.set(ox, oy, oz);
          camera.lookAt(carPosSmoothed);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      trackData.trackMesh.geometry.dispose();
      if (Array.isArray(trackData.trackMesh.material)) {
        trackData.trackMesh.material.forEach(m => m.dispose());
      } else {
        trackData.trackMesh.material.dispose();
      }
    };
  }, [circuit, colormap]);

  const currentPt = circuit.primaryDriver.telemetry[currentIndex] || circuit.primaryDriver.telemetry[0];

  return (
    <section className="scene-panel" aria-label="3D circuit simulation">
      <div className="scene-toolbar">
        <div className="scene-title"><span className="sector-mark" aria-hidden="true" /><div><h2>{circuit.name}</h2><p>{circuit.primaryDriver.driverName} <span> / {circuit.primaryDriver.carModel}</span></p></div></div>
        <div className="camera-controls" aria-label="Camera view">
          {([{id: 'chase', label: 'Chase', icon: Video}, {id: 'cockpit', label: 'Cockpit', icon: Eye}, {id: 'broadcast', label: 'TV heli', icon: Compass}, {id: 'orbit', label: 'Orbit', icon: Crosshair}] as const).map(({id, label, icon: Icon}) => <button key={id} onClick={() => setCameraMode(id)} aria-pressed={cameraMode === id}><Icon />{label}</button>)}
        </div>
      </div>
      <div className="scene-stage">
        <div ref={mountRef} className="scene-canvas cursor-grab active:cursor-grabbing" />
        <div className="scene-caption"><span>{isPlaying ? 'Lap playback' : 'Playback paused'}</span><span>{cameraMode === 'orbit' ? 'Drag to orbit · Scroll to zoom' : 'Speed mapped circuit'}</span></div>
        <div className="scene-readout"><span>Speed</span><strong>{Math.round(speedUnit === 'mph' ? currentPt.speed * 0.621371 : currentPt.speed)}</strong><span>{speedUnit}</span></div>
      </div>
      <div className="scene-dock">
        <button className="quiet-button" aria-expanded={!isCinemaMode} onClick={() => setIsCinemaMode(!isCinemaMode)}>{isCinemaMode ? <ChevronDown /> : <ChevronUp />}{isCinemaMode ? 'Show instruments' : 'Hide instruments'}</button>
        {!isCinemaMode && <div className="scene-dock-metrics"><span>Gear <strong>{currentPt.gear}</strong></span><span>Throttle <strong>{currentPt.throttle}%</strong></span><span>Brake <strong>{currentPt.brake}%</strong></span><span>DRS <strong>{currentPt.drs ? 'Open' : 'Closed'}</strong></span></div>}
      </div>
    </section>
  );
};
