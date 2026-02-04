import axios from 'axios';
import { Asteroid, SimulationParams, SimulationResult } from '../types';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const asteroidApi = {
  async getAsteroids(): Promise<Asteroid[]> {
    const response = await api.get('/api/asteroids');
    if (response.data.success) {
      // Coerce numeric fields coming back as strings
      return (response.data.asteroids as any[]).map((a) => ({
        id: a.id,
        name: a.name,
        diameter: typeof a.diameter === 'number' ? a.diameter : parseFloat(a.diameter) || 0,
        velocity: typeof a.velocity === 'number' ? a.velocity : parseFloat(a.velocity) || 0,
        impact_probability:
          typeof a.impact_probability === 'number'
            ? a.impact_probability
            : parseFloat(a.impact_probability) || 0,
        palermo_scale:
          typeof a.palermo_scale === 'number' ? a.palermo_scale : parseFloat(a.palermo_scale) || 0,
      }));
    }
    throw new Error(response.data.error || 'Failed to fetch asteroids');
  },

  async simulateImpact(params: SimulationParams): Promise<SimulationResult> {
    const response = await api.post('/api/simulate', params);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.error || 'Simulation failed');
  },

  async getElevation(lat: number, lng: number): Promise<number> {
    const response = await api.get('/api/elevation', {
      params: { lat, lng }
    });
    if (response.data.success) {
      return response.data.elevation;
    }
    throw new Error(response.data.error || 'Failed to get elevation');
  },

  async getCloseApproaches(): Promise<CloseApproach[]> {
    const response = await api.get('/api/neo/close-approaches');
    if (response.data.success) {
      return response.data.close_approaches;
    }
    throw new Error(response.data.error || 'Failed to fetch close approaches');
  },

  async simulateMultiImpact(asteroids: MultiAsteroidParams[]): Promise<MultiSimulationResult> {
    const response = await api.post('/api/simulate/multi', { asteroids });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.error || 'Multi-simulation failed');
  }
};

// Multi-asteroid types
export interface MultiAsteroidParams {
  asteroidId: string;
  name: string;
  diameter: number;
  velocity: number;
  impactLat: number;
  impactLon: number;
  mitigationDeltaV: number;
}

export interface MultiAsteroidResult {
  asteroid_id: string;
  asteroid_name: string;
  impact_lat: number;
  impact_lon: number;
  impact_energy_mt: number;
  crater_diameter_km: number;
  tsunami_risk: boolean;
  seismic_magnitude: number;
  fireball_radius_km: number;
  target_type: string;
  color: string;
}

export interface MultiTrajectory {
  asteroid_id: string;
  color: string;
  original_trajectory: number[][];
  deflected_trajectory: number[][];
}

export interface CombinedEffects {
  total_energy_mt: number;
  max_crater_km: number;
  total_crater_area_km2: number;
  combined_seismic: number;
  max_fireball_km: number;
  tsunami_risk: boolean;
  impact_count: number;
}

export interface MultiSimulationResult {
  success: boolean;
  individual_results: MultiAsteroidResult[];
  trajectories: MultiTrajectory[];
  combined_effects: CombinedEffects;
}

export interface CloseApproach {
  id: string;
  name: string;
  close_approach_date: string;
  epoch_date_close_approach: number;
  miss_distance_km: number;
  miss_distance_lunar: number;
  velocity_km_s: number;
  diameter_min_m: number;
  diameter_max_m: number;
  avg_diameter_m: number;
  is_potentially_hazardous: boolean;
  risk_level: 'low' | 'moderate' | 'high' | 'extreme';
  nasa_jpl_url: string;
}

// Historical impact types
export interface HistoricalImpact {
  id: string;
  name: string;
  location: string;
  age_years: number;
  age_display: string;
  crater_diameter_km: number;
  energy_mt: number;
  energy_display: string;
  asteroid_diameter_km: number;
  description: string;
  effects: string;
  emoji: string;
}

export interface HistoricalComparison {
  closest_impact: HistoricalImpact;
  energy_ratio: number;
  comparison_text: string;
  hiroshima_equivalent: number;
  hiroshima_text: string;
}

// Historical impacts API
export const historicalApi = {
  async getHistoricalImpacts(): Promise<HistoricalImpact[]> {
    const response = await api.get('/api/historical-impacts');
    if (response.data.success) {
      return response.data.impacts;
    }
    throw new Error(response.data.error || 'Failed to fetch historical impacts');
  },

  async getComparison(energy_mt: number, crater_km?: number): Promise<HistoricalComparison> {
    const response = await api.post('/api/historical-impacts/compare', {
      energy_mt,
      crater_km
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.error || 'Failed to get comparison');
  }
};
