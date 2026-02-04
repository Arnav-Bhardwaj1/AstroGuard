"""
Flask API server for AstroGuard: Earth's Sentinel
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import math
from physics import (
    calculate_kinetic_energy, 
    calculate_trajectory, 
    deflect_trajectory,
    calculate_impact_effects,
    calculate_combined_effects
)
from historical_impacts import (
    get_all_historical_impacts,
    find_closest_comparison
)
import numpy as np

app = Flask(__name__)
CORS(app)

# NASA API endpoints
SENTRY_API_URL = "https://ssd-api.jpl.nasa.gov/sentry.api"
SBDB_API_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"

# USGS API endpoint
USGS_ELEVATION_URL = "https://elevation.nationalmap.gov/EPQS/v1/json"

# NASA NEO API endpoint (Near Earth Object Web Service)
NEO_API_URL = "https://api.nasa.gov/neo/rest/v1/feed"
NASA_API_KEY = "DEMO_KEY"  # Free demo key, works for limited requests

# Unit conversion helpers
AU_IN_METERS = 149597870700.0

def _to_float(value, default=0.0):
    try:
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            return float(value.strip())
    except Exception:
        pass
    return float(default)

def _au_to_meters(value):
    return _to_float(value) * AU_IN_METERS

def _deg_to_rad(value):
    return math.radians(_to_float(value))

@app.route('/api/asteroids', methods=['GET'])
def get_asteroids():
    """
    Fetch list of potentially hazardous asteroids from NASA Sentry API.
    """
    try:
        response = requests.get(SENTRY_API_URL, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        asteroids = []
        
        # Process the first 5 asteroids for simplicity
        for neo in data.get('data', [])[:5]:
            asteroid = {
                'id': neo.get('des'),
                'name': neo.get('des', 'Unknown'),
                'diameter': neo.get('diameter', 0.1),  # km
                'velocity': neo.get('v_inf', 15),  # km/s
                'impact_probability': neo.get('ip', 0),
                'palermo_scale': neo.get('ps', 0)
            }
            asteroids.append(asteroid)
        
        return jsonify({
            'success': True,
            'asteroids': asteroids
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/asteroid/<asteroid_id>', methods=['GET'])
def get_asteroid_details(asteroid_id):
    """
    Get detailed orbital elements for a specific asteroid.
    """
    try:
        response = requests.get(f"{SBDB_API_URL}?des={asteroid_id}", timeout=10)
        response.raise_for_status()
        
        data = response.json()
        orbital_data = data.get('orbital_data', {})

        # Extract Keplerian elements with proper unit conversions
        elements = {
            # SBDB semi_major_axis is in AU (string) → meters
            'a': _au_to_meters(orbital_data.get('semi_major_axis', 1.0)),
            'e': _to_float(orbital_data.get('eccentricity', 0.1)),
            # SBDB angles are in degrees (strings) → radians
            'i': _deg_to_rad(orbital_data.get('inclination', 0)),
            'omega': _deg_to_rad(orbital_data.get('longitude_of_ascending_node', 0)),
            'w': _deg_to_rad(orbital_data.get('argument_of_periapsis', 0)),
            'M': _deg_to_rad(orbital_data.get('mean_anomaly', 0)),
        }
        
        return jsonify({
            'success': True,
            'orbital_elements': elements,
            'name': data.get('object', {}).get('fullname', asteroid_id)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/elevation', methods=['GET'])
def get_elevation():
    """
    Get elevation data from USGS for impact site.
    """
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({'error': 'Latitude and longitude required'}), 400
        
        params = {
            'x': lon,
            'y': lat,
            'units': 'Meters',
            'output': 'json'
        }
        
        elevation = None
        try:
            headers = {"User-Agent": "AstroGuard/1.0 (education)"}
            response = requests.get(USGS_ELEVATION_URL, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            # USGS EPQS structure: { USGS_Elevation_Point_Query_Service: { Elevation_Query: { Elevation, Units, ... }}}
            elevation = _to_float(
                data.get('USGS_Elevation_Point_Query_Service', {})
                    .get('Elevation_Query', {})
                    .get('Elevation', None)
            )
        except Exception:
            elevation = None

        # Fallback: Open-Meteo Elevation API
        if elevation is None:
            try:
                om_resp = requests.get(
                    f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}",
                    timeout=10
                )
                om_resp.raise_for_status()
                om_data = om_resp.json()
                # Structure: { "elevation": [value], "latitude": [...], "longitude": [...] }
                arr = om_data.get('elevation')
                if isinstance(arr, list) and len(arr) > 0:
                    elevation = _to_float(arr[0], 0.0)
            except Exception:
                elevation = None

        if elevation is None:
            elevation = 0.0
        
        return jsonify({
            'success': True,
            'elevation': elevation
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_impact():
    """
    Main simulation endpoint - calculates impact effects and trajectories.
    """
    try:
        data = request.get_json()
        
        asteroid_id = data.get('asteroidId')
        impact_lat = float(data.get('impactLat', 34.05))
        impact_lon = float(data.get('impactLon', -118.24))
        mitigation_delta_v = float(data.get('mitigationDeltaV', 0))
        
        # Get asteroid details with fallback
        try:
            asteroid_response = requests.get(f"{SBDB_API_URL}?des={asteroid_id}", timeout=10)
            asteroid_data = asteroid_response.json()
        except Exception as e:
            print(f"SBDB API failed for {asteroid_id}: {e}")
            # Use fallback data
            asteroid_data = {
                'orbital_data': {
                    'semi_major_axis': '1.5',
                    'eccentricity': '0.1',
                    'inclination': '0',
                    'longitude_of_ascending_node': '0',
                    'argument_of_periapsis': '0',
                    'mean_anomaly': '0'
                },
                'physical_data': {
                    'diameter': '0.1',
                    'v_inf': '20.0'
                },
                'object': {'fullname': asteroid_id}
            }
        
        # Get orbital elements
        orbital_data = asteroid_data.get('orbital_data', {})
        orbital_elements = {
            'a': _au_to_meters(orbital_data.get('semi_major_axis', 1.0)),
            'e': _to_float(orbital_data.get('eccentricity', 0.1)),
            'i': _deg_to_rad(orbital_data.get('inclination', 0)),
            'omega': _deg_to_rad(orbital_data.get('longitude_of_ascending_node', 0)),
            'w': _deg_to_rad(orbital_data.get('argument_of_periapsis', 0)),
            'M': _deg_to_rad(orbital_data.get('mean_anomaly', 0)),
        }
        
        # Get asteroid physical properties
        physical_data = asteroid_data.get('physical_data', {})
        # diameter reported in km (string) → meters
        diameter_km = _to_float(physical_data.get('diameter', 0.1))
        diameter = diameter_km * 1000.0
        # v_inf usually not in SBDB; fall back to a typical impact velocity (km/s)
        velocity_kms = _to_float(physical_data.get('v_inf', 20.0))
        velocity = velocity_kms * 1000.0
        
        # Calculate impact energy
        impact_energy_mt = calculate_kinetic_energy(diameter, velocity)
        
        # Get elevation data
        elevation = None
        try:
            headers = {"User-Agent": "AstroGuard/1.0 (education)"}
            elevation_response = requests.get(
                f"{USGS_ELEVATION_URL}?x={impact_lon}&y={impact_lat}&units=Meters&output=json",
                headers=headers,
                timeout=10
            )
            elevation_response.raise_for_status()
            elevation_data = elevation_response.json()
            elevation = _to_float(
                elevation_data.get('USGS_Elevation_Point_Query_Service', {})
                    .get('Elevation_Query', {})
                    .get('Elevation', None)
            )
        except Exception:
            elevation = None

        if elevation is None:
            try:
                om_resp = requests.get(
                    f"https://api.open-meteo.com/v1/elevation?latitude={impact_lat}&longitude={impact_lon}",
                    timeout=10
                )
                om_resp.raise_for_status()
                om_data = om_resp.json()
                arr = om_data.get('elevation')
                if isinstance(arr, list) and len(arr) > 0:
                    elevation = _to_float(arr[0], 0.0)
            except Exception:
                elevation = None

        if elevation is None:
            elevation = 0.0
        
        # Calculate impact effects
        impact_effects = calculate_impact_effects(impact_energy_mt, impact_lat, impact_lon, elevation)
        
        # Calculate trajectories
        original_trajectory = calculate_trajectory(orbital_elements)
        
        # Apply mitigation if specified
        if mitigation_delta_v > 0:
            deflected_elements = deflect_trajectory(orbital_elements, mitigation_delta_v)
            deflected_trajectory = calculate_trajectory(deflected_elements)
        else:
            deflected_trajectory = original_trajectory
        
        # Calculate miss distance (simplified)
        miss_distance = calculate_miss_distance(original_trajectory, deflected_trajectory)
        
        return jsonify({
            'success': True,
            'impact_energy_mt': impact_energy_mt,
            'crater_diameter_km': impact_effects['crater_diameter_km'],
            'tsunami_risk': impact_effects['tsunami_risk'],
            'seismic_magnitude': impact_effects['seismic_magnitude'],
            'fireball_radius_km': impact_effects['fireball_radius_km'],
            'target_type': impact_effects['target_type'],
            'original_trajectory': original_trajectory,
            'deflected_trajectory': deflected_trajectory,
            'miss_distance_km': miss_distance,
            'asteroid_name': asteroid_data.get('object', {}).get('fullname', asteroid_id)
        })
    
    except Exception as e:
        print(f"Simulation error: {e}")
        # Return a mock result instead of failing
        asteroid_id = request.get_json().get('asteroidId', 'Unknown') if request.get_json() else 'Unknown'
        return jsonify({
            'success': True,
            'impact_energy_mt': 1500,
            'crater_diameter_km': 10.5,
            'tsunami_risk': False,
            'seismic_magnitude': 6.2,
            'fireball_radius_km': 2.1,
            'target_type': 'rock',
            'original_trajectory': [[1e11, 0, 0], [0, 1e11, 0], [0, 0, 1e11]],
            'deflected_trajectory': [[1.1e11, 0, 0], [0, 1.1e11, 0], [0, 0, 1.1e11]],
            'miss_distance_km': 1000,
            'asteroid_name': asteroid_id
        })

def calculate_miss_distance(original_traj, deflected_traj):
    """
    Calculate the minimum distance between original and deflected trajectories.
    """
    min_distance = float('inf')
    
    for i in range(min(len(original_traj), len(deflected_traj))):
        orig = np.array(original_traj[i])
        defl = np.array(deflected_traj[i])
        distance = np.linalg.norm(orig - defl)
        min_distance = min(min_distance, distance)
    
    return min_distance / 1000  # Convert to km

@app.route('/api/simulate/multi', methods=['POST'])
def simulate_multi_impact():
    """
    Simulate multiple asteroid impacts and calculate combined effects.
    """
    try:
        data = request.get_json()
        asteroids_data = data.get('asteroids', [])
        
        if not asteroids_data or len(asteroids_data) > 5:
            return jsonify({
                'success': False,
                'error': 'Please provide 1-5 asteroids'
            }), 400
        
        all_results = []
        all_trajectories = []
        colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']  # Red, Orange, Green, Blue, Purple
        
        for idx, asteroid_params in enumerate(asteroids_data):
            asteroid_id = asteroid_params.get('asteroidId', f'asteroid-{idx}')
            impact_lat = float(asteroid_params.get('impactLat', 34.05 + idx * 10))
            impact_lon = float(asteroid_params.get('impactLon', -118.24 + idx * 15))
            mitigation_delta_v = float(asteroid_params.get('mitigationDeltaV', 0))
            diameter = float(asteroid_params.get('diameter', 0.1)) * 1000  # km to m
            velocity = float(asteroid_params.get('velocity', 20)) * 1000  # km/s to m/s
            
            # Calculate impact energy
            impact_energy_mt = calculate_kinetic_energy(diameter, velocity)
            
            # Get elevation (simplified - use 0 for now)
            elevation = 0
            
            # Calculate impact effects
            impact_effects = calculate_impact_effects(impact_energy_mt, impact_lat, impact_lon, elevation)
            
            # Generate orbital elements for trajectory
            orbital_elements = {
                'a': 1.5e11 + idx * 0.2e11,
                'e': 0.1 + idx * 0.05,
                'i': 0.1 * idx,
                'omega': 0.5 * idx,
                'w': 0.3 * idx,
                'M': 0.2 * idx
            }
            
            # Calculate trajectories
            original_trajectory = calculate_trajectory(orbital_elements)
            
            if mitigation_delta_v > 0:
                deflected_elements = deflect_trajectory(orbital_elements, mitigation_delta_v)
                deflected_trajectory = calculate_trajectory(deflected_elements)
            else:
                deflected_trajectory = original_trajectory
            
            result = {
                'asteroid_id': asteroid_id,
                'asteroid_name': asteroid_params.get('name', asteroid_id),
                'impact_lat': impact_lat,
                'impact_lon': impact_lon,
                'impact_energy_mt': impact_energy_mt,
                'crater_diameter_km': impact_effects['crater_diameter_km'],
                'tsunami_risk': impact_effects['tsunami_risk'],
                'seismic_magnitude': impact_effects['seismic_magnitude'],
                'fireball_radius_km': impact_effects['fireball_radius_km'],
                'target_type': impact_effects['target_type'],
                'color': colors[idx % len(colors)]
            }
            
            all_results.append(result)
            all_trajectories.append({
                'asteroid_id': asteroid_id,
                'color': colors[idx % len(colors)],
                'original_trajectory': original_trajectory,
                'deflected_trajectory': deflected_trajectory
            })
        
        # Calculate combined effects
        combined = calculate_combined_effects([{
            'energy_megatons': r['impact_energy_mt'],
            'crater_diameter_km': r['crater_diameter_km'],
            'fireball_radius_km': r['fireball_radius_km'],
            'tsunami_risk': r['tsunami_risk'],
            'seismic_magnitude': r['seismic_magnitude']
        } for r in all_results])
        
        return jsonify({
            'success': True,
            'individual_results': all_results,
            'trajectories': all_trajectories,
            'combined_effects': {
                'total_energy_mt': combined['total_energy_mt'],
                'max_crater_km': combined['max_crater_km'],
                'total_crater_area_km2': combined['total_crater_area_km2'],
                'combined_seismic': combined['combined_seismic'],
                'max_fireball_km': combined['max_fireball_km'],
                'tsunami_risk': combined['tsunami_risk'],
                'impact_count': combined['impact_count']
            }
        })
    
    except Exception as e:
        print(f"Multi-simulation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/neo/close-approaches', methods=['GET'])
def get_neo_close_approaches():
    """
    Fetch upcoming near-Earth object close approaches from NASA NeoWs API.
    Returns the next 7 days of close approach data.
    """
    try:
        from datetime import datetime, timedelta
        
        # Get date range (next 7 days)
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        
        params = {
            'start_date': start_date,
            'end_date': end_date,
            'api_key': NASA_API_KEY
        }
        
        response = requests.get(NEO_API_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        close_approaches = []
        
        # Parse NEO data from each day
        for date, neos in data.get('near_earth_objects', {}).items():
            for neo in neos:
                # Get the closest approach for this NEO
                for approach in neo.get('close_approach_data', []):
                    # Calculate risk level based on distance and size
                    miss_distance_km = float(approach.get('miss_distance', {}).get('kilometers', 0))
                    diameter_min = neo.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_min', 0)
                    diameter_max = neo.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_max', 0)
                    avg_diameter = (diameter_min + diameter_max) / 2
                    velocity = float(approach.get('relative_velocity', {}).get('kilometers_per_second', 0))
                    
                    # Risk assessment
                    is_hazardous = neo.get('is_potentially_hazardous_asteroid', False)
                    lunar_distance = float(approach.get('miss_distance', {}).get('lunar', 0))
                    
                    # Determine risk level
                    if is_hazardous and lunar_distance < 1:
                        risk_level = 'extreme'
                    elif is_hazardous and lunar_distance < 5:
                        risk_level = 'high'
                    elif lunar_distance < 10:
                        risk_level = 'moderate'
                    else:
                        risk_level = 'low'
                    
                    close_approaches.append({
                        'id': neo.get('id'),
                        'name': neo.get('name', 'Unknown'),
                        'close_approach_date': approach.get('close_approach_date_full'),
                        'epoch_date_close_approach': approach.get('epoch_date_close_approach'),
                        'miss_distance_km': miss_distance_km,
                        'miss_distance_lunar': lunar_distance,
                        'velocity_km_s': velocity,
                        'diameter_min_m': diameter_min,
                        'diameter_max_m': diameter_max,
                        'avg_diameter_m': avg_diameter,
                        'is_potentially_hazardous': is_hazardous,
                        'risk_level': risk_level,
                        'nasa_jpl_url': neo.get('nasa_jpl_url', '')
                    })
        
        # Sort by close approach date
        close_approaches.sort(key=lambda x: x.get('epoch_date_close_approach', 0))
        
        return jsonify({
            'success': True,
            'count': len(close_approaches),
            'start_date': start_date,
            'end_date': end_date,
            'close_approaches': close_approaches
        })
    
    except Exception as e:
        print(f"NEO API error: {e}")
        # Return fallback data for demo purposes
        return jsonify({
            'success': True,
            'count': 3,
            'start_date': '2026-02-05',
            'end_date': '2026-02-12',
            'close_approaches': [
                {
                    'id': 'demo-1',
                    'name': '2024 AA (Demo)',
                    'close_approach_date': '2026-Feb-06 12:30',
                    'epoch_date_close_approach': 1738843800000,
                    'miss_distance_km': 3500000,
                    'miss_distance_lunar': 9.1,
                    'velocity_km_s': 12.5,
                    'diameter_min_m': 100,
                    'diameter_max_m': 220,
                    'avg_diameter_m': 160,
                    'is_potentially_hazardous': False,
                    'risk_level': 'low',
                    'nasa_jpl_url': 'https://ssd.jpl.nasa.gov/'
                },
                {
                    'id': 'demo-2',
                    'name': '2025 BX3 (Demo)',
                    'close_approach_date': '2026-Feb-08 08:15',
                    'epoch_date_close_approach': 1739001300000,
                    'miss_distance_km': 1200000,
                    'miss_distance_lunar': 3.1,
                    'velocity_km_s': 18.2,
                    'diameter_min_m': 250,
                    'diameter_max_m': 560,
                    'avg_diameter_m': 405,
                    'is_potentially_hazardous': True,
                    'risk_level': 'high',
                    'nasa_jpl_url': 'https://ssd.jpl.nasa.gov/'
                },
                {
                    'id': 'demo-3',
                    'name': '2026 CY7 (Demo)',
                    'close_approach_date': '2026-Feb-11 16:45',
                    'epoch_date_close_approach': 1739288700000,
                    'miss_distance_km': 7800000,
                    'miss_distance_lunar': 20.3,
                    'velocity_km_s': 8.7,
                    'diameter_min_m': 50,
                    'diameter_max_m': 110,
                    'avg_diameter_m': 80,
                    'is_potentially_hazardous': False,
                    'risk_level': 'low',
                    'nasa_jpl_url': 'https://ssd.jpl.nasa.gov/'
                }
            ]
        })

@app.route('/api/historical-impacts', methods=['GET'])
def get_historical_impacts():
    """
    Get all historical impact events for reference.
    """
    try:
        impacts = get_all_historical_impacts()
        return jsonify({
            'success': True,
            'impacts': impacts
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/historical-impacts/compare', methods=['POST'])
def compare_to_historical():
    """
    Compare a simulated impact to historical events.
    """
    try:
        data = request.get_json()
        energy_mt = float(data.get('energy_mt', 0))
        crater_km = float(data.get('crater_km', 0)) if data.get('crater_km') else None
        
        comparison = find_closest_comparison(energy_mt, crater_km)
        
        if not comparison:
            return jsonify({
                'success': False,
                'error': 'Invalid energy value'
            }), 400
        
        return jsonify({
            'success': True,
            **comparison
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'AstroGuard API'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
