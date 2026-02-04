import React, { useEffect, useState } from 'react';
import { SimulationResult } from '../types';
import { Zap, Target, Waves, Activity, Info, History, Scale } from 'lucide-react';
import { historicalApi, HistoricalComparison } from '../utils/api';

interface ResultsDisplayProps {
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  simulationResult,
  isSimulating
}) => {
  const [comparison, setComparison] = useState<HistoricalComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Fetch historical comparison when simulation result changes
  useEffect(() => {
    if (simulationResult && simulationResult.impact_energy_mt > 0) {
      setComparisonLoading(true);
      historicalApi.getComparison(
        simulationResult.impact_energy_mt,
        simulationResult.crater_diameter_km
      )
        .then(setComparison)
        .catch(console.error)
        .finally(() => setComparisonLoading(false));
    } else {
      setComparison(null);
    }
  }, [simulationResult]);

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
              <span className={`text-sm font-bold ${simulationResult.tsunami_risk ? 'text-red-400' : 'text-green-400'
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

      {/* Historical Comparison */}
      {comparison && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/50 to-violet-800/50 rounded-lg border border-purple-500/30">
          <h4 className="font-bold text-purple-300 mb-3 flex items-center">
            <History className="mr-2" size={16} />
            Historical Comparison
          </h4>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{comparison.closest_impact.emoji}</div>
            <div>
              <div className="text-lg font-bold text-white">
                {comparison.closest_impact.name}
              </div>
              <div className="text-sm text-purple-200">
                {comparison.closest_impact.location} • {comparison.closest_impact.age_display}
              </div>
            </div>
          </div>

          <div className="text-sm text-purple-100 mb-3">
            {comparison.closest_impact.description}
          </div>

          {/* Energy Comparison Bar */}
          <div className="bg-space-800 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-space-300">Your Impact</span>
              <span className="text-space-300">{comparison.closest_impact.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-space-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, comparison.energy_ratio * 100)}%`
                  }}
                />
              </div>
              <span className="text-xs font-mono text-white w-16 text-right">
                {comparison.energy_ratio < 0.01
                  ? '<1%'
                  : comparison.energy_ratio > 100
                    ? `${Math.round(comparison.energy_ratio)}x`
                    : `${(comparison.energy_ratio * 100).toFixed(0)}%`
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-space-800/50 rounded p-2">
              <Scale size={14} className="text-purple-400 mb-1" />
              <div className="text-white font-medium">
                {comparison.comparison_text}
              </div>
            </div>
            <div className="bg-space-800/50 rounded p-2">
              <Zap size={14} className="text-yellow-400 mb-1" />
              <div className="text-white font-medium">
                {comparison.hiroshima_text}
              </div>
            </div>
          </div>

          {comparison.closest_impact.effects && (
            <div className="mt-3 text-xs text-purple-200">
              <strong>Effects of {comparison.closest_impact.name}:</strong> {comparison.closest_impact.effects}
            </div>
          )}
        </div>
      )}

      {comparisonLoading && (
        <div className="mt-6 p-4 bg-space-800 rounded-lg animate-pulse">
          <div className="h-4 bg-space-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-space-700 rounded w-3/4"></div>
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

