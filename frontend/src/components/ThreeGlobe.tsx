import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeGlobeProps {
  originalTrajectory: number[][];
  deflectedTrajectory: number[][];
  impactLocation?: { lat: number; lng: number };
  isSimulating: boolean;
  quality?: 'low' | 'med' | 'high';
  time?: number;
}

// Convert lat/lng to 3D coordinates on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Earth component with textures and cloud layer
const Earth: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Public domain textures from three.js examples CDN
  const colorMap = useLoader(THREE.TextureLoader, 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
  const specularMap = useLoader(THREE.TextureLoader, 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
  const cloudsMap = useLoader(THREE.TextureLoader, 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png');

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.1;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.12;
    }
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshPhongMaterial
          map={colorMap}
          specularMap={specularMap}
          specular={new THREE.Color('#333333')}
          shininess={20}
        />
      </Sphere>
      {/* Cloud layer slightly above surface */}
      <Sphere ref={cloudsRef} args={[1.01, 64, 64]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
};

// Trajectory line component
const TrajectoryLine: React.FC<{
  points: number[][];
  color: string;
  quality: 'low' | 'med' | 'high';
}> = ({ points, color, quality }) => {
  const stride = quality === 'low' ? 4 : quality === 'high' ? 1 : 2;
  const sampledPoints = points.filter((_, i) => i % stride === 0);
  
  const linePoints = useMemo(() => {
    return sampledPoints.map(point => {
      // Scale down the trajectory points to fit around the globe
      const scale = 0.1;
      return new THREE.Vector3(
        point[0] * scale,
        point[1] * scale,
        point[2] * scale
      );
    });
  }, [sampledPoints]);

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={quality === 'high' ? 3 : 2}
      dashed={color === '#10b981'}
      dashSize={0.1}
      gapSize={0.05}
    />
  );
};

// Asteroid component that moves along trajectory
const Asteroid: React.FC<{
  trajectory: number[][];
  time: number;
}> = ({ trajectory, time }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const position = useMemo(() => {
    if (trajectory.length === 0) return new THREE.Vector3(0, 0, 0);
    
    const index = Math.max(0, Math.min(trajectory.length - 1, Math.floor(time * (trajectory.length - 1))));
    const point = trajectory[index];
    const scale = 0.1;
    
    return new THREE.Vector3(
      point[0] * scale,
      point[1] * scale,
      point[2] * scale
    );
  }, [trajectory, time]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.copy(position);
      meshRef.current.rotation.x = state.clock.elapsedTime * 2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.02, 8, 8]}>
      <meshPhongMaterial color="#f59e0b" shininess={100} />
    </Sphere>
  );
};

// Impact location marker
const ImpactMarker: React.FC<{
  lat: number;
  lng: number;
}> = ({ lat, lng }) => {
  const position = useMemo(() => {
    return latLngToVector3(lat, lng, 1.01); // Slightly above surface
  }, [lat, lng]);

  return (
    <group position={position}>
      <Sphere args={[0.01, 8, 8]}>
        <meshPhongMaterial color="#dc2626" />
      </Sphere>
      <Text
        position={[0, 0.05, 0]}
        fontSize={0.02}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        IMPACT
      </Text>
    </group>
  );
};

// Main globe component
const Globe: React.FC<ThreeGlobeProps> = ({
  originalTrajectory,
  deflectedTrajectory,
  impactLocation,
  quality = 'med',
  time = 0
}) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      <Earth />
      
      {originalTrajectory.length > 0 && (
        <>
          <TrajectoryLine
            points={originalTrajectory}
            color="#ef4444"
            quality={quality}
          />
          <Asteroid
            trajectory={originalTrajectory}
            time={time}
          />
        </>
      )}
      
      {deflectedTrajectory.length > 0 && (
        <TrajectoryLine
          points={deflectedTrajectory}
          color="#10b981"
          quality={quality}
        />
      )}
      
      {impactLocation && (
        <ImpactMarker
          lat={impactLocation.lat}
          lng={impactLocation.lng}
        />
      )}
    </>
  );
};

export const ThreeGlobe: React.FC<ThreeGlobeProps> = (props) => {
  console.log('ThreeGlobe props:', {
    originalLength: props.originalTrajectory.length,
    deflectedLength: props.deflectedTrajectory.length,
    quality: props.quality,
    time: props.time,
    impactLocation: props.impactLocation
  });
  
  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <Globe {...props} />
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute top-4 left-4 text-white">
        <h3 className="text-lg font-bold mb-2">3D Globe</h3>
        {props.isSimulating && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <span className="text-sm">Rendering...</span>
          </div>
        )}
        {!props.isSimulating && (props.originalTrajectory.length > 0 || props.deflectedTrajectory.length > 0) && (
          <div className="text-sm space-y-1">
            <p className="text-red-400">● Original trajectory</p>
            <p className="text-green-400">● Deflected trajectory</p>
            <p className="text-yellow-400">● Asteroid position</p>
            {props.impactLocation && <p className="text-orange-400">● Impact location</p>}
          </div>
        )}
      </div>

      {/* Legend */}
      {!props.isSimulating && (props.originalTrajectory.length > 0 || props.deflectedTrajectory.length > 0) && (
        <div className="absolute bottom-4 right-4 text-white text-xs space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-red-500 mr-2"></div>
            <span>Original path</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-green-500 mr-2 border-dashed border-t-2"></div>
            <span>Deflected path</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span>Asteroid</span>
          </div>
          {props.impactLocation && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
              <span>Impact zone</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
