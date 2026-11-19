/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getCircuitById, ALL_CIRCUITS } from './data/circuits';
import { ColormapType, SpeedUnit } from './types/telemetry';
import { Header } from './components/Header';
import { CircuitSelector } from './components/CircuitSelector';
import { CircuitCanvas } from './components/CircuitCanvas';
import { CircuitScene3D } from './components/three/CircuitScene3D';
import { TelemetryHUD } from './components/TelemetryHUD';
import { PlaybackControls } from './components/PlaybackControls';
import { TelemetryCharts } from './components/TelemetryCharts';
import { BrakingZonesInspector } from './components/BrakingZonesInspector';
import { DriverComparison } from './components/DriverComparison';
import { PythonFastF1Lab } from './components/PythonFastF1Lab';
import { ExportModal } from './components/ExportModal';
import { GitHubPushModal } from './components/GitHubPushModal';
import { Gauge, MapPin, Zap, Timer, Activity, Box, Sparkles } from 'lucide-react';
import { formatSpeed } from './utils/colormaps';

export default function App() {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('monza');
  const [activeTab, setActiveTab] = useState<'3d' | 'map' | 'telemetry' | 'braking' | 'comparison' | 'code'>('3d');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [colormap, setColormap] = useState<ColormapType>('viridis');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('km/h');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState<boolean>(false);

  // Layer toggles
  const [showBrakingZones, setShowBrakingZones] = useState<boolean>(true);
  const [showHighSpeed, setShowHighSpeed] = useState<boolean>(true);
  const [showCorners, setShowCorners] = useState<boolean>(true);
  const [showSectors, setShowSectors] = useState<boolean>(true);

  const currentCircuit = useMemo(() => {
    return getCircuitById(selectedCircuitId);
  }, [selectedCircuitId]);

  const telemetry = currentCircuit.primaryDriver.telemetry;
  const currentPoint = telemetry[currentIndex] || telemetry[0];
  const totalPoints = telemetry.length;
  const totalTime = telemetry[telemetry.length - 1]?.time || 80;
  const currentTime = currentPoint?.time || 0;

  // Handle circuit change
  const handleSelectCircuit = (id: string) => {
    setSelectedCircuitId(id);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(25, Math.round(90 / playbackSpeed));
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= totalPoints - 1) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, isLooping, totalPoints]);

  // Jump to distance helper
  const handleJumpToDistance = (targetDistance: number) => {
    let closestIndex = 0;
    let minDiff = Infinity;
    telemetry.forEach((pt, idx) => {
      const diff = Math.abs(pt.distance - targetDistance);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    setCurrentIndex(closestIndex);
    setActiveTab('map');
  };

  // Jump to sector helper
  const handleJumpToSector = (sectorNumber: 1 | 2 | 3) => {
    const targetSector = currentCircuit.sectors.find(s => s.number === sectorNumber);
    if (!targetSector) return;
    handleJumpToDistance(targetSector.startDistance);
  };

  return (
    <div className="app-shell">
      {/* Top Bar Header compliant with contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGitModal={() => setIsGitModalOpen(true)}
      />

      {/* Main Workspace Content */}
      <main className="workspace">
        <section className="session-heading">
          <div className="session-copy">
            <div className="session-meta"><span className="sector-mark" aria-hidden="true" />{currentCircuit.grandPrixName} <span>/ {currentCircuit.eventYear}</span></div>
            <h1>The lap, corner by corner</h1>
            <p>Explore the lap through speed, braking and racing lines</p>
          </div>
          <dl className="session-stats">
            <div><dt>Reference lap</dt><dd>{currentCircuit.primaryDriver.lapTime}</dd></div>
            <div><dt>Circuit length</dt><dd>{(currentCircuit.circuitLengthM / 1000).toFixed(3)}<small> km</small></dd></div>
            <div><dt>Peak speed</dt><dd>{formatSpeed(Math.max(...telemetry.map(p => p.speed)), speedUnit)}</dd></div>
          </dl>
        </section>

        {/* Grand Prix Circuit Selector Bar */}
        <CircuitSelector
          selectedCircuitId={selectedCircuitId}
          onSelectCircuit={handleSelectCircuit}
          speedUnit={speedUnit}
        />

        {/* Tab-driven Main Workspace */}
        {activeTab === '3d' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Three.js 3D Interactive Circuit & Moving F1 Car */}
            <CircuitScene3D
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              colormap={colormap}
              speedUnit={speedUnit}
              isPlaying={isPlaying}
            />

            {/* Steering Wheel HUD & Cockpit Telemetry Instruments */}
            <TelemetryHUD
              point={currentPoint}
              totalDistance={currentCircuit.circuitLengthM}
              speedUnit={speedUnit}
              onToggleSpeedUnit={() => setSpeedUnit(s => (s === 'km/h' ? 'mph' : 'km/h'))}
              driverName={currentCircuit.primaryDriver.driverName}
              driverCode={currentCircuit.primaryDriver.driverCode}
              teamColor={currentCircuit.primaryDriver.teamColor}
            />

            {/* Playback Controls & Timeline Scrubber */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentIndex={currentIndex}
              totalPoints={totalPoints}
              onSeek={setCurrentIndex}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              currentTime={currentTime}
              totalTime={totalTime}
              sectors={currentCircuit.sectors}
              onJumpToSector={handleJumpToSector}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping(!isLooping)}
            />

            {/* Synchronized Telemetry Traces */}
            <TelemetryCharts
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              speedUnit={speedUnit}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Interactive SVG Circuit Speed Canvas */}
            <CircuitCanvas
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              colormap={colormap}
              onChangeColormap={setColormap}
              speedUnit={speedUnit}
              showBrakingZones={showBrakingZones}
              setShowBrakingZones={setShowBrakingZones}
              showHighSpeed={showHighSpeed}
              setShowHighSpeed={setShowHighSpeed}
              showCorners={showCorners}
              setShowCorners={setShowCorners}
              showSectors={showSectors}
              setShowSectors={setShowSectors}
            />

            {/* Steering Wheel HUD & Cockpit Telemetry Instruments */}
            <TelemetryHUD
              point={currentPoint}
              totalDistance={currentCircuit.circuitLengthM}
              speedUnit={speedUnit}
              onToggleSpeedUnit={() => setSpeedUnit(s => (s === 'km/h' ? 'mph' : 'km/h'))}
              driverName={currentCircuit.primaryDriver.driverName}
              driverCode={currentCircuit.primaryDriver.driverCode}
              teamColor={currentCircuit.primaryDriver.teamColor}
            />

            {/* Playback Controls & Timeline Scrubber */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentIndex={currentIndex}
              totalPoints={totalPoints}
              onSeek={setCurrentIndex}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              currentTime={currentTime}
              totalTime={totalTime}
              sectors={currentCircuit.sectors}
              onJumpToSector={handleJumpToSector}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping(!isLooping)}
            />

            {/* Quick Synchronized Telemetry Preview Below Map */}
            <TelemetryCharts
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              speedUnit={speedUnit}
            />
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Full-width Telemetry Traces with Synchronized HUD */}
            <TelemetryHUD
              point={currentPoint}
              totalDistance={currentCircuit.circuitLengthM}
              speedUnit={speedUnit}
              onToggleSpeedUnit={() => setSpeedUnit(s => (s === 'km/h' ? 'mph' : 'km/h'))}
              driverName={currentCircuit.primaryDriver.driverName}
              driverCode={currentCircuit.primaryDriver.driverCode}
              teamColor={currentCircuit.primaryDriver.teamColor}
            />

            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentIndex={currentIndex}
              totalPoints={totalPoints}
              onSeek={setCurrentIndex}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              currentTime={currentTime}
              totalTime={totalTime}
              sectors={currentCircuit.sectors}
              onJumpToSector={handleJumpToSector}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping(!isLooping)}
            />

            <TelemetryCharts
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              speedUnit={speedUnit}
            />
          </div>
        )}

        {activeTab === 'braking' && (
          <div className="animate-fade-in">
            <BrakingZonesInspector
              circuit={currentCircuit}
              onJumpToDistance={handleJumpToDistance}
              speedUnit={speedUnit}
            />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="animate-fade-in">
            <DriverComparison
              circuit={currentCircuit}
              currentIndex={currentIndex}
              onSeek={setCurrentIndex}
              speedUnit={speedUnit}
            />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="animate-fade-in">
            <PythonFastF1Lab
              circuit={currentCircuit}
              colormap={colormap}
              speedUnit={speedUnit}
            />
          </div>
        )}
      </main>

      {/* Export Data Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        circuit={currentCircuit}
      />

      {/* GitHub Repository Push Modal */}
      <GitHubPushModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        repoUrl="https://github.com/Kunwar-26/apexvelocity-f1-analyser"
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            <span>ApexVelocity</span>
            <span className="mx-2">·</span>
            <span>Circuit analysis workspace</span>
          </div>
          <div>
            Simulated telemetry · FastF1 export available in Python lab
          </div>
        </div>
      </footer>
    </div>
  );
}
