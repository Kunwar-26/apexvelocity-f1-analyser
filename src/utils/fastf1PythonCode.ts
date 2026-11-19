import { CircuitData, ColormapType } from '../types/telemetry';

export function generateFastF1PythonCode(circuit: CircuitData, colormap: ColormapType = 'viridis'): string {
  const cmapName = colormap === 'speedHeat' ? 'coolwarm' : colormap;
  
  return `"""
FastF1 Circuit Speed Mapping & Telemetry Visualization
Project: How Fast Do F1 Cars Really Go Around a Circuit?
Event: ${circuit.grandPrixName} (${circuit.eventYear})
Circuit: ${circuit.name}
Driver: ${circuit.primaryDriver.driverName} (${circuit.primaryDriver.driverCode}) - ${circuit.primaryDriver.team}
Lap Time: ${circuit.primaryDriver.lapTime}
"""

import fastf1
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
import numpy as np

# Enable FastF1 disk cache for fast reloading
fastf1.Cache.enable_cache('fastf1_cache')

# 1. Load Qualifying Session
session = fastf1.get_session(${circuit.eventYear}, '${circuit.country}', 'Q')
session.load()

# 2. Extract Fastest Lap for Driver
fastest_lap = session.laps.pick_driver('${circuit.primaryDriver.driverCode}').pick_fastest()
telemetry = fastest_lap.get_telemetry()

# 3. Extract Positional Coordinates (X, Y) and Speed (km/h)
x = telemetry['X'].to_numpy()
y = telemetry['Y'].to_numpy()
speed = telemetry['Speed'].to_numpy()

# 4. Prepare Segments for Matplotlib LineCollection
# Each line segment connects (x[i], y[i]) to (x[i+1], y[i+1])
points = np.array([x, y]).T.reshape(-1, 1, 2)
segments = np.concatenate([points[:-1], points[1:]], axis=1)

# 5. Create Dark Motorsport Visualization Canvas
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(14, 9), facecolor='#0B0E14')
ax.set_facecolor('#0B0E14')

# 6. Apply Continuous Speed Colormap ('${cmapName}')
cmap = plt.get_cmap('${cmapName}')
norm = plt.Normalize(speed.min(), speed.max())

# Add track surface line with speed color grading
lc = LineCollection(segments, cmap=cmap, norm=norm, linewidth=5.0, capstyle='round')
lc.set_array(speed)
line = ax.add_collection(lc)

# 7. Add High-Speed Sections & Braking Zone Markers
# Braking zones (T1, chicanes, hairpins)
braking_zones = [
${circuit.brakingZones.map(bz => `    {"name": "${bz.name}", "x": ${bz.startX}, "y": ${bz.startY}, "delta": "-${bz.speedDelta} km/h (${bz.decelerationG}G)"},`).join('\n')}
]

for bz in braking_zones:
    ax.scatter(bz['x'], bz['y'], color='#EF4444', s=90, zorder=6, edgecolors='white', linewidth=1.5)
    ax.annotate(
        f"{bz['name']}\\n{bz['delta']}",
        xy=(bz['x'], bz['y']),
        xytext=(15, 15),
        textcoords='offset points',
        fontsize=8,
        color='#FCA5A5',
        fontfamily='monospace',
        arrowprops=dict(arrowstyle="->", color='#EF4444', lw=1)
    )

# 8. Add High-Speed Velocity Zones
high_speed_zones = [
${circuit.highSpeedSections.map(hs => `    {"name": "${hs.name}", "x": ${hs.startX}, "y": ${hs.startY}, "peak": "${hs.peakSpeed} km/h"},`).join('\n')}
]

for hs in high_speed_zones:
    ax.scatter(hs['x'], hs['y'], color='#06B6D4', s=80, zorder=5, edgecolors='white', linewidth=1)

# 9. Format Plot & Colorbar
cbar = fig.colorbar(line, ax=ax, orientation='horizontal', pad=0.04, fraction=0.03, aspect=35)
cbar.set_label('Speed (km/h)', color='#94A3B8', fontsize=11, fontfamily='sans-serif')
cbar.ax.tick_params(labelsize=9, colors='#E2E8F0')

ax.set_title(
    "${circuit.name} — ${circuit.primaryDriver.driverName} Qualifying Lap (${circuit.primaryDriver.lapTime})",
    color='#F8FAFC',
    fontsize=16,
    fontweight='bold',
    pad=20
)
ax.axis('off')
ax.set_aspect('equal')

plt.tight_layout()
plt.savefig('${circuit.id}_speed_map.png', dpi=300, bbox_inches='tight', facecolor='#0B0E14')
plt.show()
`;
}
