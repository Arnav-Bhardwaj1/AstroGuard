import React, { useState, useEffect, useMemo } from 'react';
import { asteroidApi, CloseApproach } from '../utils/api';
import { AlertTriangle, Calendar, Clock, ExternalLink, Gauge, Ruler } from 'lucide-react';

type SortField = 'date' | 'distance' | 'size' | 'velocity';
type SortOrder = 'asc' | 'desc';

interface NeoDashboardProps {
  onSelectAsteroid?: (id: string, name: string) => void;
}

export const NeoDashboard: React.FC<NeoDashboardProps> = ({ onSelectAsteroid }) => {
  const [closeApproaches, setCloseApproaches] = useState<CloseApproach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await asteroidApi.getCloseApproaches();
        setCloseApproaches(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load close approaches:', err);
        setError('Failed to load close approach data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Sorted data
  const sortedApproaches = useMemo(() => {
    const sorted = [...closeApproaches].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.epoch_date_close_approach - b.epoch_date_close_approach;
          break;
        case 'distance':
          comparison = a.miss_distance_km - b.miss_distance_km;
          break;
        case 'size':
          comparison = a.avg_diameter_m - b.avg_diameter_m;
          break;
        case 'velocity':
          comparison = a.velocity_km_s - b.velocity_km_s;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [closeApproaches, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'extreme': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'moderate': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-green-400 bg-green-400/20';
    }
  };

  const getCountdown = (epochMs: number) => {
    const now = Date.now();
    const diff = epochMs - now;

    if (diff < 0) return 'Passed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDistance = (km: number) => {
    if (km >= 1000000) {
      return `${(km / 1000000).toFixed(2)}M km`;
    }
    return `${km.toLocaleString()} km`;
  };

  const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center space-x-1 text-xs font-medium uppercase tracking-wider ${sortField === field ? 'text-asteroid-400' : 'text-space-300 hover:text-white'
        }`}
    >
      <span>{label}</span>
      {sortField === field && (
        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-space-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 font-space flex items-center">
          <Calendar className="mr-2" />
          NEO Close Approaches
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-asteroid-400"></div>
          <span className="ml-3 text-space-300">Loading close approach data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-space-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 font-space flex items-center">
          <Calendar className="mr-2" />
          NEO Close Approaches
        </h2>
        <div className="text-red-400 text-center py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-space-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white font-space flex items-center">
          <Calendar className="mr-2" />
          NEO Close Approaches
        </h2>
        <div className="text-sm text-space-300">
          Next 7 days • {closeApproaches.length} objects
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-space-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{closeApproaches.length}</div>
          <div className="text-xs text-space-300">Total Objects</div>
        </div>
        <div className="bg-space-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {closeApproaches.filter(a => a.is_potentially_hazardous).length}
          </div>
          <div className="text-xs text-space-300">Hazardous</div>
        </div>
        <div className="bg-space-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {closeApproaches.filter(a => a.risk_level === 'high' || a.risk_level === 'extreme').length}
          </div>
          <div className="text-xs text-space-300">High Risk</div>
        </div>
        <div className="bg-space-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {closeApproaches.filter(a => a.miss_distance_lunar < 10).length}
          </div>
          <div className="text-xs text-space-300">&lt;10 Lunar Dist.</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-space-700">
              <th className="text-left py-3 px-2">
                <SortButton field="date" label="Approach Date" />
              </th>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-left py-3 px-2">
                <SortButton field="distance" label="Distance" />
              </th>
              <th className="text-left py-3 px-2">
                <SortButton field="size" label="Size" />
              </th>
              <th className="text-left py-3 px-2">
                <SortButton field="velocity" label="Velocity" />
              </th>
              <th className="text-left py-3 px-2">Risk</th>
              <th className="text-left py-3 px-2">Countdown</th>
            </tr>
          </thead>
          <tbody>
            {sortedApproaches.map((approach) => (
              <tr
                key={approach.id}
                className={`border-b border-space-800 hover:bg-space-800 transition-colors cursor-pointer ${approach.is_potentially_hazardous ? 'bg-red-900/10' : ''
                  }`}
                onClick={() => onSelectAsteroid?.(approach.id, approach.name)}
              >
                <td className="py-3 px-2">
                  <div className="flex items-center text-white">
                    <Calendar size={14} className="mr-2 text-space-400" />
                    {approach.close_approach_date}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    {approach.is_potentially_hazardous && (
                      <AlertTriangle size={14} className="mr-2 text-red-400" />
                    )}
                    <span className="text-white font-medium">{approach.name}</span>
                    <a
                      href={approach.nasa_jpl_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-space-400 hover:text-asteroid-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-white">
                    <div className="flex items-center">
                      <Ruler size={14} className="mr-2 text-space-400" />
                      {formatDistance(approach.miss_distance_km)}
                    </div>
                    <div className="text-xs text-space-400">
                      {approach.miss_distance_lunar.toFixed(1)} lunar dist.
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-white">
                    {approach.avg_diameter_m.toFixed(0)}m
                  </div>
                  <div className="text-xs text-space-400">
                    {approach.diameter_min_m.toFixed(0)}-{approach.diameter_max_m.toFixed(0)}m
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center text-white">
                    <Gauge size={14} className="mr-2 text-space-400" />
                    {approach.velocity_km_s.toFixed(1)} km/s
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getRiskColor(approach.risk_level)}`}>
                    {approach.risk_level}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center text-asteroid-400 font-mono">
                    <Clock size={14} className="mr-2" />
                    {getCountdown(approach.epoch_date_close_approach)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {closeApproaches.length === 0 && (
        <div className="text-center py-8 text-space-400">
          No close approaches in the next 7 days
        </div>
      )}
    </div>
  );
};
