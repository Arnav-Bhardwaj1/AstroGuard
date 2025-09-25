import React from 'react';
import { SimulationResult } from '../types';
import { Zap, Target, Waves, Activity, Info } from 'lucide-react';

interface ResultsDisplayProps {
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  simulationResult,
  isSimulating
}) => {
  if (isSimulating) {
    return (
      <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
          <Activity className="mr-2 animate-pulse" />
          Analysis in Progress
        </h2>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-space-700 rounded w-3/4"></div>
            <div className="h-4 bg-space-700 rounded w-1/2 mt-2"></div>
            <div className="h-4 bg-space-700 rounded w-2/3 mt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!simulationResult) {
    return (
      <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
          <Target className="mr-2" />
          Impact Analysis
        </h2>
        <div className="text-center text-space-300">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg">Run a simulation to see detailed impact analysis</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (value: number, thresholds: number[]) => {
    if (value < thresholds[0]) return 'text-green-400';
    if (value < thresholds[1]) return 'text-yellow-400';
    if (value < thresholds[2]) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityLabel = (value: number, thresholds: number[]) => {
    if (value < thresholds[0]) return 'Low';
    if (value < thresholds[1]) return 'Moderate';
    if (value < thresholds[2]) return 'High';
    return 'Extreme';
  };

  const energySeverity = getSeverityColor(simulationResult.impact_energy_mt, [10, 100, 1000]);
  const energyLabel = getSeverityLabel(simulationResult.impact_energy_mt, [10, 100, 1000]);
  const craterSeverity = getSeverityColor(simulationResult.crater_diameter_km, [1, 10, 50]);
  const craterLabel = getSeverityLabel(simulationResult.crater_diameter_km, [1, 10, 50]);

  return (
    <div className="bg-space-900 text-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 font-space flex items-center">
        <Target className="mr-2" />
        Impact Analysis
      </h2>

      {/* Main Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Impact Energy */}
        <div className="bg-space-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-asteroid-400 flex items-center">
              <Zap className="mr-2" size={20} />
              Impact Energy
            </h3>
            <span className={`text-sm font-bold ${energySeverity}`}>
              {energyLabel}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono mb-1">
            {simulationResult.impact_energy_mt.toFixed(1)}
          </div>
          <div className="text-sm text-space-300">Megatons of TNT</div>
          <div className="mt-2 text-xs text-space-400">
            Equivalent to {Math.round(simulationResult.impact_energy_mt / 15)} Hiroshima bombs
          </div>
        </div>

        {/* Crater Size */}
        <div className="bg-space-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-asteroid-400 flex items-center">
              <Target className="mr-2" size={20} />
              Crater Diameter
            </h3>
            <span className={`text-sm font-bold ${craterSeverity}`}>
              {craterLabel}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono mb-1">
            {simulationResult.crater_diameter_km.toFixed(1)}
          </div>
          <div className="text-sm text-space-300">Kilometers</div>
          <div className="mt-2 text-xs text-space-400">
            {simulationResult.crater_diameter_km > 100 ? 'Regional devastation' : 
             simulationResult.crater_diameter_km > 10 ? 'City-level impact' : 'Localized damage'}
          </div>
        </div>
      </div>

      {/* Secondary Effects */}
      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-lg text-asteroid-400">Secondary Effects</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tsunami Risk */}
          <div className="bg-space-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold flex items-center">
                <Waves className="mr-2" size={16} />
                Tsunami Risk
              </h4>
              <span className={`text-sm font-bold ${
                simulationResult.tsunami_risk ? 'text-red-400' : 'text-green-400'
              }`}>
                {simulationResult.tsunami_risk ? 'HIGH' : 'LOW'}
              </span>
            </div>
            <div className="text-sm text-space-300">
              {simulationResult.tsunami_risk 
                ? 'Underwater impact detected - tsunami likely'
                : 'Land impact - no tsunami risk'
              }
            </div>
          </div>

          {/* Seismic Effects */}
          <div className="bg-space-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold flex items-center">
                <Activity className="mr-2" size={16} />
                Seismic Magnitude
              </h4>
              <span className="text-sm font-bold text-orange-400">
                {simulationResult.seismic_magnitude.toFixed(1)}
              </span>
            </div>
            <div className="text-sm text-space-300">
              Richter scale equivalent
            </div>
          </div>
        </div>

        {/* Fireball Radius */}
        <div className="bg-space-800 p-4 rounded-lg">
          <h4 className="font-bold mb-2 flex items-center">
            <Zap className="mr-2" size={16} />
            Fireball Radius
          </h4>
          <div className="text-2xl font-bold font-mono text-red-400">
            {simulationResult.fireball_radius_km.toFixed(1)} km
          </div>
          <div className="text-sm text-space-300 mt-1">
            Instant vaporization zone
          </div>
        </div>
      </div>

      {/* Deflection Results */}
      {simulationResult.miss_distance_km > 0 && (
        <div className="bg-gradient-to-r from-green-900 to-green-800 p-4 rounded-lg">
          <h3 className="font-bold text-lg text-green-400 mb-2 flex items-center">
            <Target className="mr-2" />
            Deflection Success
          </h3>
          <div className="text-2xl font-bold font-mono text-green-300">
            {simulationResult.miss_distance_km.toFixed(1)} km
          </div>
          <div className="text-sm text-green-200 mt-1">
            Miss distance achieved - Earth is safe!
          </div>
        </div>
      )}

      {/* Educational Info */}
      <div className="mt-6 p-4 bg-space-800 rounded-lg">
        <h4 className="font-bold text-asteroid-400 mb-2 flex items-center">
          <Info className="mr-2" size={16} />
          Did You Know?
        </h4>
        <div className="text-sm text-space-300 space-y-1">
          {simulationResult.impact_energy_mt > 1000 && (
            <p>• This impact would be comparable to the Chicxulub event that caused the dinosaur extinction</p>
          )}
          {simulationResult.crater_diameter_km > 50 && (
            <p>• Craters this large can be seen from space and affect global climate</p>
          )}
          {simulationResult.tsunami_risk && (
            <p>• Ocean impacts can create tsunamis that travel thousands of kilometers</p>
          )}
          {simulationResult.miss_distance_km > 0 && (
            <p>• Even small velocity changes (ΔV) can significantly alter asteroid trajectories</p>
          )}
        </div>
      </div>
    </div>
  );
};
