import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Repeat } from 'lucide-react';
import { Sector } from '../types/telemetry';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentIndex: number;
  totalPoints: number;
  onSeek: (index: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  currentTime: number;
  totalTime: number;
  sectors: Sector[];
  onJumpToSector: (sectorNumber: 1 | 2 | 3) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentIndex,
  totalPoints,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  currentTime,
  totalTime,
  sectors,
  onJumpToSector,
  isLooping,
  onToggleLoop,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = (secs % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${remainingSecs}`;
  };

  const progressPercent = totalPoints > 0 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  return (
    <div className="playback-panel bg-slate-950 border border-slate-800 rounded-xl p-4  flex flex-col gap-3">
      {/* Time & Scrubber Rail */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono font-medium text-white tabular-nums shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* Custom Progress Scrubber */}
        <div className="relative flex-1 min-w-0 flex items-center h-11 group cursor-pointer">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-colors duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <input
            aria-label="Lap position"
            type="range"
            min={0}
            max={Math.max(0, totalPoints - 1)}
            value={currentIndex}
            onChange={e => onSeek(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />

          {/* Scrubber thumb handle */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-red-500  pointer-events-none -translate-x-1/2 transition-colors duration-75"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0 text-right">
          {formatTime(totalTime)}
        </span>
      </div>

      {/* Buttons row: Playback controls, multipliers, sector shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
        {/* Play/Pause & Stepping */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(0)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Reset to Lap Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentIndex - 10))}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Step Back 10 Points"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-colors  ${
              isPlaying
                ? 'bg-slate-100 hover:bg-white text-slate-950 '
                : 'bg-red-600 hover:bg-red-500 text-white '
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play lap</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(totalPoints - 1, currentIndex + 10))}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Step Forward 10 Points"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-2 rounded-lg border transition-colors ${
              isLooping
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Repeat Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Playback speed multiplier pills */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          <span className="text-xs font-mono text-slate-500 px-1">Speed</span>
          {[0.5, 1, 2, 4].map(spd => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors ${
                playbackSpeed === spd
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Sector Quick Jump */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-slate-500 mr-1 hidden sm:inline">Sector</span>
          {sectors.map(sec => (
            <button
              key={sec.number}
              onClick={() => onJumpToSector(sec.number)}
              className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-md transition-colors"
            >
              S{sec.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
