import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function PoloModel({ color }: { color: string }) {
  const { scene } = useGLTF('/polo3d/polo.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  const initialColor = useRef<Map<THREE.Material, THREE.Color>>(new Map());

  useEffect(() => {
    if (!scene) return;

    // Store original textures, apply color tint
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
              // Store original color
              if (!initialColor.current.has(mat)) {
                initialColor.current.set(mat, mat.color.clone());
              }
              // Multiply original texture color with selected color
              const targetColor = new THREE.Color(color);
              const originalColor = initialColor.current.get(mat) || new THREE.Color(1, 1, 1);
              mat.color = originalColor.clone().multiply(targetColor);
              mat.needsUpdate = true;
            }
          });
        }
      }
    });

    // Compute bounding box and center model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetHeight = 3;
    const scale = targetHeight / maxDim;

    scene.scale.setScalar(scale);
    // Recompute after scaling
    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    scene.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);
  }, [scene]);

  // Update color when it changes
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            const targetColor = new THREE.Color(color);
            const originalColor = initialColor.current.get(mat) || new THREE.Color(1, 1, 1);
            mat.color = originalColor.clone().multiply(targetColor);
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, color]);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle auto-rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 + 0.2;
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
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 1, 0);
  }, [camera]);
  return null;
}

export function Polo3DPreview({ color, className = '' }: { color: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Accept hex directly — no name mapping needed
  const resolvedColor = color && color.startsWith('#') ? color : '#2962a3';

  return (
    <div className={`relative ${className}`}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <CameraSetup />
        {/* Key light */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 4]} intensity={0.5} />
        <hemisphereLight args={['#ffffff', '#e0e0e0', 0.3]} />
        <Suspense fallback={null}>
          <PoloModel color={resolvedColor} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={10}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 1, 0]}
        />
      </Canvas>

      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
          <p className="text-xs text-gray-400 mt-1">First load may take 10-15 seconds</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <button onClick={() => { setError(false); setLoaded(false); }} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Retry</button>
          </div>
        </div>
      )}

      {loaded && !error && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
          Drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  );
}

export default Polo3DPreview;
