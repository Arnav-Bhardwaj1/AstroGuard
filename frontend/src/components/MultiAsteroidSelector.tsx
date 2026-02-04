import React, { useState } from 'react';
import { Asteroid } from '../types';
import { Plus, X, Rocket, AlertTriangle } from 'lucide-react';

interface AsteroidEntry {
  asteroid: Asteroid;
  impactLat: number;
  impactLon: number;
  mitigationDeltaV: number;
}

interface MultiAsteroidSelectorProps {
  asteroids: Asteroid[];
  selectedEntries: AsteroidEntry[];
  onEntriesChange: (entries: AsteroidEntry[]) => void;
  maxAsteroids?: number;
}

export const MultiAsteroidSelector: React.FC<MultiAsteroidSelectorProps> = ({
  asteroids,
  selectedEntries,
  onEntriesChange,
  maxAsteroids = 3
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const addAsteroid = (asteroid: Asteroid) => {
    if (selectedEntries.length >= maxAsteroids) return;

    const newEntry: AsteroidEntry = {
      asteroid,
      impactLat: 34.05 + selectedEntries.length * 15,
      impactLon: -118.24 + selectedEntries.length * 20,
      mitigationDeltaV: 0
    };

    onEntriesChange([...selectedEntries, newEntry]);
    setShowAddForm(false);
  };

  const removeAsteroid = (index: number) => {
    const newEntries = selectedEntries.filter((_, i) => i !== index);
    onEntriesChange(newEntries);
  };

  const updateEntry = (index: number, updates: Partial<AsteroidEntry>) => {
    const newEntries = selectedEntries.map((entry, i) =>
      i === index ? { ...entry, ...updates } : entry
    );
    onEntriesChange(newEntries);
  };

  const availableAsteroids = asteroids.filter(
    a => !selectedEntries.some(e => e.asteroid.id === a.id)
  );

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-space-800 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center">
          <Rocket className="mr-2" size={18} />
          Multi-Asteroid Scenario
        </h3>
        <span className="text-xs text-space-400">
          {selectedEntries.length}/{maxAsteroids} selected
        </span>
      </div>

      {selectedEntries.length === 0 ? (
        <div className="text-center py-4 text-space-400">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <p className="text-sm">Add asteroids to simulate multiple impacts</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {selectedEntries.map((entry, index) => (
            <div
              key={entry.asteroid.id}
              className="bg-space-700 rounded-lg p-3"
              style={{ borderLeft: `3px solid ${colors[index]}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[index] }}
                  />
                  <span className="font-medium text-white text-sm">
                    {entry.asteroid.name}
                  </span>
                </div>
                <button
                  onClick={() => removeAsteroid(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-space-400">Lat</label>
                  <input
                    type="number"
                    value={entry.impactLat}
                    onChange={(e) => updateEntry(index, { impactLat: parseFloat(e.target.value) })}
                    className="w-full p-1 bg-space-600 rounded text-white"
                    step="1"
                  />
                </div>
                <div>
                  <label className="text-space-400">Lon</label>
                  <input
                    type="number"
                    value={entry.impactLon}
                    onChange={(e) => updateEntry(index, { impactLon: parseFloat(e.target.value) })}
                    className="w-full p-1 bg-space-600 rounded text-white"
                    step="1"
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="text-space-400 text-xs">Deflection ΔV</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={entry.mitigationDeltaV}
                  onChange={(e) => updateEntry(index, { mitigationDeltaV: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-space-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-space-400 text-right">
                  {entry.mitigationDeltaV.toFixed(1)} m/s
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEntries.length < maxAsteroids && (
        showAddForm ? (
          <div className="bg-space-700 rounded-lg p-3">
            <div className="text-sm text-white mb-2">Select an asteroid:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {availableAsteroids.map((asteroid) => (
                <button
                  key={asteroid.id}
                  onClick={() => addAsteroid(asteroid)}
                  className="w-full text-left p-2 text-sm bg-space-600 hover:bg-space-500 rounded text-white"
                >
                  {asteroid.name} - {asteroid.diameter.toFixed(1)}km
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-full mt-2 text-sm text-space-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 border-2 border-dashed border-space-600 rounded-lg text-space-400 hover:border-asteroid-500 hover:text-asteroid-400 transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-1" />
            Add Asteroid
          </button>
        )
      )}
    </div>
  );
};

export type { AsteroidEntry };
