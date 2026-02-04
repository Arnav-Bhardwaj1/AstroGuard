import React from 'react';
import { CombinedEffects, MultiAsteroidResult } from '../utils/api';
import { Zap, Target, Scale, Waves, Activity, Globe, AlertTriangle } from 'lucide-react';

interface MultiResultsDisplayProps {
  individualResults: MultiAsteroidResult[];
  combinedEffects: CombinedEffects;
  isSimulating: boolean;
}

export const MultiResultsDisplay: React.FC<MultiResultsDisplayProps> = ({
  individualResults,
  combinedEffects,
  isSimulating
}) => {
  if (isSimulating) {
    return (
      <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
          <Activity className="mr-2 animate-pulse" />
          Multi-Impact Analysis in Progress
        </h2>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-space-700 rounded w-3/4"></div>
          <div className="h-4 bg-space-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!combinedEffects || individualResults.length === 0) {
    return (
      <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
          <Globe className="mr-2" />
          Multi-Asteroid Analysis
        </h2>
        <div className="text-center text-space-300">
          <div className="text-6xl mb-4">🌍</div>
          <p className="text-lg">Configure asteroids and run simulation</p>
        </div>
      </div>
    );
  }

  const formatEnergy = (mt: number): string => {
    if (mt >= 1e9) return `${(mt / 1e9).toFixed(1)} Teratons`;
    if (mt >= 1e6) return `${(mt / 1e6).toFixed(1)} Gigatons`;
    if (mt >= 1e3) return `${(mt / 1e3).toFixed(1)} Gigatons`;
    return `${mt.toFixed(1)} MT`;
  };

  return (
    <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
        <Globe className="mr-2" />
        Multi-Impact Analysis
      </h2>

      {/* Combined Effects Summary */}
      <div className="bg-gradient-to-r from-red-900/50 to-orange-800/50 rounded-lg p-4 mb-4 border border-red-500/30">
        <h3 className="font-bold text-red-300 mb-3 flex items-center">
          <AlertTriangle className="mr-2" size={18} />
          Combined Destruction Analysis
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-space-800/50 rounded p-3">
            <div className="flex items-center text-red-400 mb-1">
              <Zap size={16} className="mr-1" />
              <span className="text-xs">TOTAL ENERGY</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatEnergy(combinedEffects.total_energy_mt)}
            </div>
          </div>

          <div className="bg-space-800/50 rounded p-3">
            <div className="flex items-center text-orange-400 mb-1">
              <Target size={16} className="mr-1" />
              <span className="text-xs">LARGEST CRATER</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {combinedEffects.max_crater_km.toFixed(1)} km
            </div>
          </div>

          <div className="bg-space-800/50 rounded p-3">
            <div className="flex items-center text-yellow-400 mb-1">
              <Scale size={16} className="mr-1" />
              <span className="text-xs">SEISMIC MAGNITUDE</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {combinedEffects.combined_seismic.toFixed(1)}
            </div>
          </div>

          <div className="bg-space-800/50 rounded p-3">
            <div className="flex items-center text-blue-400 mb-1">
              <Waves size={16} className="mr-1" />
              <span className="text-xs">TSUNAMI RISK</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {combinedEffects.tsunami_risk ? 'YES' : 'NO'}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-orange-200">
          Total devastation area: {combinedEffects.total_crater_area_km2.toFixed(0)} km²
        </div>
      </div>

      {/* Individual Impact Cards */}
      <h3 className="font-bold text-white mb-3">
        Individual Impacts ({combinedEffects.impact_count})
      </h3>

      <div className="space-y-2">
        {individualResults.map((result) => (
          <div
            key={result.asteroid_id}
            className="bg-space-800 rounded-lg p-3"
            style={{ borderLeft: `3px solid ${result.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: result.color }}
                />
                <span className="font-medium">{result.asteroid_name}</span>
              </div>
              <span className="text-xs text-space-400">
                ({result.impact_lat.toFixed(1)}°, {result.impact_lon.toFixed(1)}°)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-space-400">Energy</span>
                <div className="text-asteroid-400 font-medium">
                  {result.impact_energy_mt.toFixed(0)} MT
                </div>
              </div>
              <div>
                <span className="text-space-400">Crater</span>
                <div className="text-orange-400 font-medium">
                  {result.crater_diameter_km.toFixed(1)} km
                </div>
              </div>
              <div>
                <span className="text-space-400">Fireball</span>
                <div className="text-yellow-400 font-medium">
                  {result.fireball_radius_km.toFixed(1)} km
                </div>
              </div>
              <div>
                <span className="text-space-400">Seismic</span>
                <div className="text-purple-400 font-medium">
                  M{result.seismic_magnitude.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
