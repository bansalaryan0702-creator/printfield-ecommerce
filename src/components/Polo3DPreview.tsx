import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function PoloModel({ color, onReady }: { color: string; onReady?: () => void }) {
  const { scene } = useGLTF('/polo3d/polo.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  const applied = useRef(false);

  useEffect(() => {
    if (!scene || applied.current) return;
    applied.current = true;

    const targetColor = new THREE.Color(color);
    const white = new THREE.Color(1, 1, 1);

    // Step 1: Reset ALL materials to white base, keep textures for fabric detail
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Store original texture map if any
            const origMap = mat.map;
            const origNormalMap = mat.normalMap;
            // Reset to white
            mat.color.copy(white);
            mat.emissive.copy(white);
            mat.emissiveIntensity = 0;
            mat.roughness = 0.75;
            mat.metalness = 0.0;
            // Keep texture maps for fabric detail
            mat.map = origMap;
            mat.normalMap = origNormalMap;
            mat.needsUpdate = true;
          } else if (mat instanceof THREE.MeshPhongMaterial) {
            const origMap = mat.map;
            const origNormalMap = mat.normalMap;
            mat.color.copy(white);
            mat.emissive.copy(white);
            mat.emissiveIntensity = 0;
            mat.specular.set(0x222222);
            mat.shininess = 10;
            mat.map = origMap;
            mat.normalMap = origNormalMap;
            mat.needsUpdate = true;
          }
        });
      }
    });

    // Step 2: Apply target color on top of white base
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            // White * targetColor = targetColor (clean result)
            (mat as any).color.multiply(targetColor);
            mat.needsUpdate = true;
          }
        });
      }
    });

    // Center model
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(scene);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    const newMin = newBox.min;
    scene.position.set(-newCenter.x, -newMin.y, -newCenter.z);

    onReady?.();
  }, [scene]);

  // Update color on changes
  useEffect(() => {
    if (!scene || !applied.current) return;
    const targetColor = new THREE.Color(color);
    const white = new THREE.Color(1, 1, 1);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            // Reset to white, then multiply by target
            (mat as any).color.copy(white);
            (mat as any).color.multiply(targetColor);
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, color]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 + 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export function Polo3DPreview({ color, className = '' }: { color: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedColor = color && color.startsWith('#') ? color : '#2962a3';

  return (
    <div className={`relative ${className}`}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 6], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 3, 4]} intensity={0.6} />
        <hemisphereLight args={['#ffffff', '#e0e0e0', 0.4]} />
        <Suspense fallback={null}>
          <PoloModel color={resolvedColor} onReady={() => setLoaded(true)} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 1.2, 0]}
        />
      </Canvas>

      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
          <p className="text-xs text-gray-400 mt-1">First load may take 10-15 seconds</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <button onClick={() => { setError(false); setLoaded(false); window.location.reload(); }} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Retry</button>
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
