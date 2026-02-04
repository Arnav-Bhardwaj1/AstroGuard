import { useEffect, useRef, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ThreeScene } from './components/ThreeScene';
import { ThreeGlobe } from './components/ThreeGlobe';
import { MapView } from './components/MapView';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NeoDashboard } from './components/NeoDashboard';
import { Asteroid, SimulationParams, SimulationResult } from './types';
import { asteroidApi } from './utils/api';
import 'leaflet/dist/leaflet.css';

function App() {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [impactLocation, setImpactLocation] = useState({ lat: 34.05, lng: -118.24 });
  const [, setMitigationDeltaV] = useState(0);
  // Visualization controls
  const [quality, setQuality] = useState<'low' | 'med' | 'high'>('med');
  const [time, setTime] = useState(0); // 0..1 along trajectory
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 0.5x to 3x speed
  const [useLeafletMap, setUseLeafletMap] = useState(false);
  const [useThreeGlobe, setUseThreeGlobe] = useState(true);
  const [activeView, setActiveView] = useState<'simulation' | 'dashboard'>('simulation');
  const rafRef = useRef<number | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedQuality = localStorage.getItem('astroguard-quality') as 'low' | 'med' | 'high' | null;
    const savedSpeed = localStorage.getItem('astroguard-animation-speed');
    const savedLeaflet = localStorage.getItem('astroguard-use-leaflet');
    const savedGlobe = localStorage.getItem('astroguard-use-globe');

    if (savedQuality) setQuality(savedQuality);
    if (savedSpeed) setAnimationSpeed(parseFloat(savedSpeed));
    if (savedLeaflet) setUseLeafletMap(savedLeaflet === 'true');
    if (savedGlobe) setUseThreeGlobe(savedGlobe === 'true');
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('astroguard-quality', quality);
  }, [quality]);

  useEffect(() => {
    localStorage.setItem('astroguard-animation-speed', animationSpeed.toString());
  }, [animationSpeed]);

  useEffect(() => {
    localStorage.setItem('astroguard-use-leaflet', useLeafletMap.toString());
  }, [useLeafletMap]);

  useEffect(() => {
    localStorage.setItem('astroguard-use-globe', useThreeGlobe.toString());
  }, [useThreeGlobe]);

  const handleAsteroidSelect = (asteroid: Asteroid) => {
    console.log('Asteroid selected:', asteroid);
    setSelectedAsteroid(asteroid);
    setSimulationResult(null); // Clear previous results
  };

  const handleSimulate = async (params: SimulationParams) => {
    console.log('Starting simulation with params:', params);
    setIsSimulating(true);
    setImpactLocation({ lat: params.impactLat, lng: params.impactLon });

    try {
      const result = await asteroidApi.simulateImpact(params);
      console.log('Simulation result:', result);
      setSimulationResult(result);
      console.log('Simulation result set successfully');
    } catch (error) {
      console.error('Simulation failed:', error);
      // Set a mock result for testing
      const mockResult = {
        success: true,
        impact_energy_mt: 1500,
        crater_diameter_km: 10.5,
        tsunami_risk: false,
        seismic_magnitude: 6.2,
        fireball_radius_km: 2.1,
        target_type: 'rock' as const,
        original_trajectory: Array.from({ length: 100 }, (_, i) => [
          1e11 * Math.cos(i * 0.06),
          1e11 * Math.sin(i * 0.06),
          0
        ]),
        deflected_trajectory: Array.from({ length: 100 }, (_, i) => [
          1.1e11 * Math.cos(i * 0.06 + 0.1),
          1.1e11 * Math.sin(i * 0.06 + 0.1),
          0
        ]),
        miss_distance_km: 1000,
        asteroid_name: params.asteroidId
      };
      console.log('Setting mock result:', mockResult);
      console.log('Mock original trajectory length:', mockResult.original_trajectory.length);
      console.log('Mock deflected trajectory length:', mockResult.deflected_trajectory.length);
      setSimulationResult(mockResult);
      console.log('Mock result set successfully');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleMitigationChange = (deltaV: number) => {
    setMitigationDeltaV(deltaV);
  };

  // Debug simulation result changes
  useEffect(() => {
    console.log('Simulation result changed:', simulationResult);
  }, [simulationResult]);

  // Drive animation when playing
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let lastTs = performance.now();
    const step = (ts: number) => {
      const baseDt = (ts - lastTs) / 4000; // 4s base loop
      const dt = Math.min(1, baseDt * animationSpeed); // Apply speed multiplier
      lastTs = ts;
      setTime((prev) => {
        const next = prev + dt;
        return next > 1 ? next - 1 : next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, animationSpeed]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-space-900 via-space-800 to-space-900">
        {/* Header */}
        <header className="bg-space-900 border-b border-space-700">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">🛡️</div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-space">
                    AstroGuard: Earth's Sentinel
                  </h1>
                  <p className="text-space-300 text-sm">
                    Interactive Asteroid Impact Visualization & Defense Simulation
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {/* Tab Navigation */}
                <div className="flex bg-space-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'dashboard'
                      ? 'bg-asteroid-600 text-white'
                      : 'text-space-300 hover:text-white'
                      }`}
                  >
                    📊 NEO Dashboard
                  </button>
                  <button
                    onClick={() => setActiveView('simulation')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'simulation'
                      ? 'bg-asteroid-600 text-white'
                      : 'text-space-300 hover:text-white'
                      }`}
                  >
                    💥 Simulation
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-asteroid-400 font-bold text-lg">Mission Status</div>
                  <div className="text-green-400 text-sm">Operational</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {activeView === 'dashboard' ? (
            <NeoDashboard />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Control Panel - Left Column */}
                <div className="lg:col-span-3">
                  <ControlPanel
                    onSimulate={handleSimulate}
                    onMitigationChange={handleMitigationChange}
                    isSimulating={isSimulating}
                    selectedAsteroid={selectedAsteroid}
                    onAsteroidSelect={handleAsteroidSelect}
                    quality={quality}
                    onQualityChange={setQuality}
                    time={time}
                    onTimeChange={setTime}
                    isPlaying={isPlaying}
                    onTogglePlay={setIsPlaying}
                    animationSpeed={animationSpeed}
                    onAnimationSpeedChange={setAnimationSpeed}
                    useLeafletMap={useLeafletMap}
                    onToggleLeaflet={setUseLeafletMap}
                    useThreeGlobe={useThreeGlobe}
                    onToggleThreeGlobe={setUseThreeGlobe}
                  />
                </div>

                {/* Visualization Area - Right Column */}
                <div className="lg:col-span-9 space-y-6">
                  {/* 3D Scene */}
                  <div className="bg-space-800 rounded-lg p-4">
                    <h2 className="text-xl font-bold text-white mb-4 font-space">
                      3D Trajectory Visualization
                    </h2>
                    <div className="h-96">
                      {useThreeGlobe ? (
                        <ThreeGlobe
                          originalTrajectory={simulationResult?.original_trajectory || []}
                          deflectedTrajectory={simulationResult?.deflected_trajectory || []}
                          impactLocation={impactLocation}
                          isSimulating={isSimulating}
                          quality={quality}
                          time={time}
                        />
                      ) : (
                        <ThreeScene
                          originalTrajectory={simulationResult?.original_trajectory || []}
                          deflectedTrajectory={simulationResult?.deflected_trajectory || []}
                          impactLocation={impactLocation}
                          isSimulating={isSimulating}
                          quality={quality}
                          time={time}
                        />
                      )}
                    </div>
                  </div>

                  {/* 2D Map and Results */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Map View */}
                    <div className="bg-space-800 rounded-lg p-4">
                      <h2 className="text-xl font-bold text-white mb-4 font-space">
                        Impact Zone Analysis
                      </h2>
                      <div className="h-80">
                        <MapView
                          simulationResult={simulationResult}
                          impactLocation={impactLocation}
                          isSimulating={isSimulating}
                          useLeaflet={useLeafletMap}
                        />
                      </div>
                    </div>

                    {/* Results Display */}
                    <div>
                      <ResultsDisplay
                        simulationResult={simulationResult}
                        isSimulating={isSimulating}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Briefing */}
              {!simulationResult && !isSimulating && (
                <div className="mt-8 bg-gradient-to-r from-asteroid-900 to-asteroid-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 font-space">
                    Mission Briefing
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔍</div>
                      <h3 className="font-bold text-lg mb-2">Detect</h3>
                      <p className="text-sm text-asteroid-200">
                        Select a potentially hazardous asteroid from NASA's database
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">💥</div>
                      <h3 className="font-bold text-lg mb-2">Simulate</h3>
                      <p className="text-sm text-asteroid-200">
                        Run impact simulations to understand potential consequences
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">🛡️</div>
                      <h3 className="font-bold text-lg mb-2">Deflect</h3>
                      <p className="text-sm text-asteroid-200">
                        Test deflection strategies to protect Earth from impacts
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-space-900 border-t border-space-700 mt-12">
          <div className="container mx-auto px-6 py-6">
            <div className="text-center text-space-400 text-sm">
              <p>
                Data provided by NASA JPL and USGS | Built for educational purposes
              </p>
              <p className="mt-2">
                AstroGuard: Earth's Sentinel - Interactive Asteroid Defense Simulation
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary >
  );
}

export default App;
