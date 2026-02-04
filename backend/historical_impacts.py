"""
Historical asteroid impact events database for comparison in simulations.
"""

# Famous historical impacts with estimated energy and crater data
HISTORICAL_IMPACTS = [
    {
        'id': 'chicxulub',
        'name': 'Chicxulub Impact',
        'location': 'Yucatan Peninsula, Mexico',
        'age_years': 66_000_000,
        'age_display': '66 million years ago',
        'crater_diameter_km': 150,
        'energy_mt': 100_000_000_000,  # 100 teratons
        'energy_display': '100 Teratons',
        'asteroid_diameter_km': 10,
        'description': 'Mass extinction event that killed the dinosaurs',
        'effects': 'Global winter, 75% species extinction, mega-tsunamis',
        'emoji': '🦕'
    },
    {
        'id': 'vredefort',
        'name': 'Vredefort Crater',
        'location': 'South Africa',
        'age_years': 2_023_000_000,
        'age_display': '2 billion years ago',
        'crater_diameter_km': 300,
        'energy_mt': 500_000_000_000,  # 500 teratons
        'energy_display': '500 Teratons',
        'asteroid_diameter_km': 15,
        'description': 'Largest verified impact crater on Earth',
        'effects': 'Massive global devastation',
        'emoji': '💫'
    },
    {
        'id': 'sudbury',
        'name': 'Sudbury Basin',
        'location': 'Ontario, Canada',
        'age_years': 1_849_000_000,
        'age_display': '1.85 billion years ago',
        'crater_diameter_km': 130,
        'energy_mt': 60_000_000_000,  # 60 teratons
        'energy_display': '60 Teratons',
        'asteroid_diameter_km': 10,
        'description': 'One of the largest impact structures on Earth',
        'effects': 'Created major nickel deposits',
        'emoji': '⛏️'
    },
    {
        'id': 'popigai',
        'name': 'Popigai Crater',
        'location': 'Siberia, Russia',
        'age_years': 35_700_000,
        'age_display': '35.7 million years ago',
        'crater_diameter_km': 100,
        'energy_mt': 30_000_000_000,  # 30 teratons
        'energy_display': '30 Teratons',
        'asteroid_diameter_km': 8,
        'description': 'Fourth largest verified crater, contains impact diamonds',
        'effects': 'Massive regional destruction, diamond formation',
        'emoji': '💎'
    },
    {
        'id': 'barringer',
        'name': 'Barringer Crater',
        'location': 'Arizona, USA',
        'age_years': 50_000,
        'age_display': '50,000 years ago',
        'crater_diameter_km': 1.2,
        'energy_mt': 10,
        'energy_display': '10 Megatons',
        'asteroid_diameter_km': 0.05,
        'description': 'Best preserved impact crater on Earth',
        'effects': '175m deep crater, everything within 4km destroyed',
        'emoji': '🏜️'
    },
    {
        'id': 'tunguska',
        'name': 'Tunguska Event',
        'location': 'Siberia, Russia',
        'age_years': 116,  # 1908
        'age_display': '1908',
        'crater_diameter_km': 0,  # Airburst
        'energy_mt': 15,
        'energy_display': '10-15 Megatons',
        'asteroid_diameter_km': 0.06,
        'description': 'Largest impact event in recorded history (airburst)',
        'effects': '2,150 km² of forest flattened, no crater',
        'emoji': '💥'
    },
    {
        'id': 'chelyabinsk',
        'name': 'Chelyabinsk Meteor',
        'location': 'Chelyabinsk, Russia',
        'age_years': 13,  # 2013
        'age_display': '2013',
        'crater_diameter_km': 0,  # Airburst
        'energy_mt': 0.5,
        'energy_display': '500 Kilotons',
        'asteroid_diameter_km': 0.02,
        'description': 'Largest undetected asteroid to enter atmosphere',
        'effects': '1,500 injuries, mostly from broken glass',
        'emoji': '🌠'
    },
    {
        'id': 'hiroshima',
        'name': 'Hiroshima Bomb (Reference)',
        'location': 'Hiroshima, Japan',
        'age_years': 81,  # 1945
        'age_display': '1945',
        'crater_diameter_km': 0,
        'energy_mt': 0.015,  # 15 kilotons
        'energy_display': '15 Kilotons',
        'asteroid_diameter_km': 0,
        'description': 'Nuclear weapon reference for energy comparison',
        'effects': 'Destroyed 13 km² area',
        'emoji': '☢️'
    }
]

def get_all_historical_impacts():
    """Return all historical impact data."""
    return HISTORICAL_IMPACTS

def find_closest_comparison(energy_mt: float, crater_km: float = None):
    """
    Find the closest historical impact for comparison.
    
    Args:
        energy_mt: Impact energy in megatons
        crater_km: Optional crater diameter in km
        
    Returns:
        Dictionary with comparison data
    """
    if energy_mt <= 0:
        return None
    
    # Sort by energy to find closest match
    sorted_impacts = sorted(HISTORICAL_IMPACTS, key=lambda x: x['energy_mt'])
    
    closest = None
    min_ratio_diff = float('inf')
    
    for impact in sorted_impacts:
        if impact['energy_mt'] > 0:
            ratio = energy_mt / impact['energy_mt']
            ratio_diff = abs(1 - ratio) if ratio <= 1 else abs(ratio - 1)
            
            if ratio_diff < min_ratio_diff:
                min_ratio_diff = ratio_diff
                closest = impact
    
    if not closest:
        closest = HISTORICAL_IMPACTS[0]
    
    # Calculate comparison ratio
    ratio = energy_mt / closest['energy_mt'] if closest['energy_mt'] > 0 else 0
    
    # Generate comparison message
    if ratio < 0.01:
        comparison_text = f"much smaller than {closest['name']}"
    elif ratio < 0.1:
        comparison_text = f"about 1/{int(1/ratio)} the energy of {closest['name']}"
    elif ratio < 0.5:
        comparison_text = f"about {ratio:.0%} the energy of {closest['name']}"
    elif ratio < 2:
        comparison_text = f"comparable to {closest['name']}"
    elif ratio < 10:
        comparison_text = f"about {ratio:.1f}x {closest['name']}"
    elif ratio < 100:
        comparison_text = f"about {int(ratio)}x {closest['name']}"
    else:
        comparison_text = f"vastly larger than {closest['name']}"

    # Calculate Hiroshima equivalent
    hiroshima_energy = 0.015  # 15 kilotons
    hiroshima_equivalent = energy_mt / hiroshima_energy
    
    return {
        'closest_impact': closest,
        'energy_ratio': ratio,
        'comparison_text': comparison_text,
        'hiroshima_equivalent': hiroshima_equivalent,
        'hiroshima_text': f"Equivalent to {int(hiroshima_equivalent):,} Hiroshima bombs"
    }

def get_impacts_larger_than(energy_mt: float):
    """Get all historical impacts larger than the given energy."""
    return [i for i in HISTORICAL_IMPACTS if i['energy_mt'] > energy_mt]

def get_impacts_smaller_than(energy_mt: float):
    """Get all historical impacts smaller than the given energy."""
    return [i for i in HISTORICAL_IMPACTS if i['energy_mt'] < energy_mt]
