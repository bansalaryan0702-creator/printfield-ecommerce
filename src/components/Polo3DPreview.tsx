import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Polo3DPreviewProps {
  color: string;
  className?: string;
}

function PoloModel({ color }: { color: string }) {
  const { scene } = useGLTF('/polo3d/polo.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;

    // Apply color tint to all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          // Tint the diffuse texture with the selected color
          const baseColor = new THREE.Color(color);
          mat.color = baseColor;
          mat.needsUpdate = true;
        }
      }
    });

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;

    scene.position.sub(center);
    scene.scale.setScalar(scale);
    scene.position.y += size.y * scale * 0.1;

    setReady(true);
  }, [scene, color]);

  // Update color when it changes
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.color = new THREE.Color(color);
        mat.needsUpdate = true;
      }
    });
  }, [scene, color]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.3, 4);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export function Polo3DPreview({ color, className = '' }: Polo3DPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedColor = useCallback(() => {
    if (!color) return '#2962a3';
    if (typeof color === 'string' && color.startsWith('#')) return color;
    const name = typeof color === 'object' ? (color?.name || '') : color;
    const map: Record<string, string> = {
      'black': '#1a1a1a', 'white': '#e8e8e0', 'navy blue': '#1a2744', 'navy': '#1a2744',
      'royal blue': '#2962a3', 'red': '#c62828', 'maroon': '#6b1d1d', 'green': '#2d5a27',
      'grey': '#6b6b6b', 'gray': '#6b6b6b', 'orange': '#d84315', 'yellow': '#e8a800',
      'pink': '#d81b60', 'purple': '#6a1b9a', 'brown': '#5d4037', 'teal': '#00695c',
      'olive green': '#556b2f', 'mustard': '#c8a415', 'coral': '#e64a19',
    };
    return map[name.toLowerCase().trim()] || '#2962a3';
  }, [color]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        shadows
        camera={{ position: [0, 0.3, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <CameraSetup />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <pointLight position={[0, 2, 3]} intensity={0.3} />
        <Suspense fallback={null}>
          <PoloModel color={resolvedColor()} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={false}
        />
      </Canvas>

      {/* Loading overlay */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <p className="text-sm text-gray-400">3D preview unavailable</p>
        </div>
      )}

      {/* Controls hint */}
      {loaded && !error && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          Drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  );
}

export default Polo3DPreview;
