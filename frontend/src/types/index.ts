export interface Asteroid {
  id: string;
  name: string;
  diameter: number; // km
  velocity: number; // km/s
  impact_probability: number;
  palermo_scale: number;
}

export interface OrbitalElements {
  a: number; // semi-major axis in meters
  e: number; // eccentricity
  i: number; // inclination in radians
  omega: number; // longitude of ascending node
  w: number; // argument of periapsis
  M: number; // mean anomaly
}

export interface ImpactEffects {
  impact_energy_mt: number;
  crater_diameter_km: number;
  tsunami_risk: boolean;
  seismic_magnitude: number;
  fireball_radius_km: number;
  target_type: 'rock' | 'water';
  miss_distance_km: number;
}

export interface SimulationResult {
  success: boolean;
  impact_energy_mt: number;
  crater_diameter_km: number;
  tsunami_risk: boolean;
  seismic_magnitude: number;
  fireball_radius_km: number;
  target_type: 'rock' | 'water';
  original_trajectory: number[][];
  deflected_trajectory: number[][];
  miss_distance_km: number;
  asteroid_name: string;
}

export interface SimulationParams {
  asteroidId: string;
  impactLat: number;
  impactLon: number;
  mitigationDeltaV: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

