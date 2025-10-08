"""
Physics engine for asteroid impact calculations and orbital mechanics.
"""
import numpy as np
from typing import List, Tuple, Dict, Any
import math

# Constants
EARTH_RADIUS = 6371000  # meters
EARTH_MASS = 5.972e24  # kg
G = 6.67430e-11  # gravitational constant
ASTEROID_DENSITY = 3000  # kg/m³ (typical for rocky asteroids)
TNT_ENERGY = 4.184e9  # Joules per ton of TNT

def calculate_kinetic_energy(diameter: float, velocity: float) -> float:
    """
    Calculate kinetic energy of an asteroid impact.
    
    Args:
        diameter: Asteroid diameter in meters
        velocity: Impact velocity in m/s
        
    Returns:
        Energy in megatons of TNT
    """
    # Calculate mass assuming spherical asteroid
    radius = diameter / 2
    volume = (4/3) * math.pi * radius**3
    mass = volume * ASTEROID_DENSITY
    
    # Kinetic energy = 0.5 * m * v^2
    kinetic_energy = 0.5 * mass * velocity**2
    
    # Convert to megatons of TNT
    megatons_tnt = kinetic_energy / (TNT_ENERGY * 1e6)
    
    return megatons_tnt

def estimate_crater_diameter(energy_mt: float, target_type: str = 'rock') -> float:
    """
    Estimate crater diameter using scaling laws.
    
    Args:
        energy_mt: Impact energy in megatons of TNT
        target_type: 'rock' or 'water'
        
    Returns:
        Crater diameter in kilometers
    """
    # Convert to joules
    energy_joules = energy_mt * TNT_ENERGY * 1e6
    
    # Holsapple-Schmidt scaling law
    if target_type == 'rock':
        # For rocky targets
        diameter_m = 1.8 * (energy_joules / 1e12)**0.294
    else:
        # For water targets (smaller craters)
        diameter_m = 1.2 * (energy_joules / 1e12)**0.294
    
    return diameter_m / 1000  # Convert to kilometers

def calculate_trajectory(orbital_elements: Dict[str, float], time_steps: int = 100) -> List[List[float]]:
    """
    Calculate asteroid trajectory from orbital elements.
    
    Args:
        orbital_elements: Dictionary containing a, e, i, Ω, ω, M (Keplerian elements)
        time_steps: Number of points to calculate
        
    Returns:
        List of [x, y, z] coordinates in meters
    """
    a = orbital_elements.get('a', 1.5e11)  # semi-major axis in meters
    e = orbital_elements.get('e', 0.1)     # eccentricity
    i = orbital_elements.get('i', 0)       # inclination in radians
    omega = orbital_elements.get('omega', 0)  # longitude of ascending node
    w = orbital_elements.get('w', 0)       # argument of periapsis
    M = orbital_elements.get('M', 0)       # mean anomaly
    
    # Generate time array (one orbital period)
    T = 2 * math.pi * math.sqrt(a**3 / (G * EARTH_MASS))
    times = np.linspace(0, T, time_steps)
    
    trajectory = []
    
    for t in times:
        # Solve Kepler's equation for eccentric anomaly
        E = solve_kepler_equation(M + 2 * math.pi * t / T, e)
        
        # Calculate position in orbital plane
        r = a * (1 - e * math.cos(E))
        x_orb = r * math.cos(E)
        y_orb = r * math.sin(E)
        z_orb = 0
        
        # Transform to 3D space
        x, y, z = transform_orbital_to_cartesian(x_orb, y_orb, z_orb, i, omega, w)
        
        trajectory.append([x, y, z])
    
    return trajectory

def solve_kepler_equation(M: float, e: float, max_iterations: int = 100) -> float:
    """
    Solve Kepler's equation: M = E - e*sin(E)
    """
    E = M  # Initial guess
    for _ in range(max_iterations):
        E_new = M + e * math.sin(E)
        if abs(E_new - E) < 1e-8:
            break
        E = E_new
    return E

def transform_orbital_to_cartesian(x: float, y: float, z: float, 
                                 i: float, omega: float, w: float) -> Tuple[float, float, float]:
    """
    Transform from orbital plane coordinates to 3D Cartesian coordinates.
    """
    # Rotation matrices for orbital elements
    cos_i, sin_i = math.cos(i), math.sin(i)
    cos_omega, sin_omega = math.cos(omega), math.sin(omega)
    cos_w, sin_w = math.cos(w), math.sin(w)
    
    # Apply rotations
    x_rot = x * (cos_w * cos_omega - sin_w * sin_omega * cos_i) - y * (sin_w * cos_omega + cos_w * sin_omega * cos_i)
    y_rot = x * (cos_w * sin_omega + sin_w * cos_omega * cos_i) + y * (cos_w * cos_omega - sin_w * sin_omega * cos_i)
    z_rot = x * (sin_w * sin_i) + y * (cos_w * sin_i)
    
    return x_rot, y_rot, z_rot

def deflect_trajectory(orbital_elements: Dict[str, float], delta_v: float) -> Dict[str, float]:
    """
    Apply a velocity change to deflect an asteroid.
    
    Args:
        orbital_elements: Original orbital elements
        delta_v: Velocity change in m/s
        
    Returns:
        Modified orbital elements
    """
    # Simple deflection model - modify semi-major axis
    a_original = orbital_elements.get('a', 1.5e11)
    
    # Calculate orbital velocity
    v_orbital = math.sqrt(G * EARTH_MASS / a_original)
    
    # Apply delta_v (simplified - just changes semi-major axis)
    v_new = v_orbital + delta_v
    
    # New semi-major axis
    a_new = G * EARTH_MASS / (v_new**2)
    
    # Create new orbital elements
    new_elements = orbital_elements.copy()
    new_elements['a'] = a_new
    
    return new_elements

def calculate_impact_effects(energy_mt: float, impact_lat: float, impact_lon: float, 
                           elevation: float) -> Dict[str, Any]:
    """
    Calculate comprehensive impact effects.
    
    Args:
        energy_mt: Impact energy in megatons of TNT
        impact_lat: Impact latitude
        impact_lon: Impact longitude
        elevation: Surface elevation at impact site
        
    Returns:
        Dictionary of impact effects
    """
    # Determine target type
    target_type = 'water' if elevation < 0 else 'rock'
    
    # Calculate crater diameter
    crater_diameter = estimate_crater_diameter(energy_mt, target_type)
    
    # Tsunami risk assessment
    tsunami_risk = elevation < 0 and energy_mt > 10  # Tsunami if underwater and >10 MT
    
    # Seismic effects (simplified)
    seismic_magnitude = 4.5 + 0.67 * math.log10(energy_mt)
    
    # Fireball radius (simplified)
    fireball_radius = 1.5 * (energy_mt**0.4)  # km
    
    return {
        'crater_diameter_km': crater_diameter,
        'tsunami_risk': tsunami_risk,
        'seismic_magnitude': seismic_magnitude,
        'fireball_radius_km': fireball_radius,
        'target_type': target_type,
        'energy_megatons': energy_mt
    }

