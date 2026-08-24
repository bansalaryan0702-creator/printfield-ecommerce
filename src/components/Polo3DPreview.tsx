import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function PoloModel({ color, designImage, placement, onReady }: { color: string; designImage?: string | null; placement?: string; onReady?: () => void }) {
  const { scene } = useGLTF('/polo3d/polo.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  const applied = useRef(false);
  const artworkMeshRef = useRef<THREE.Mesh | null>(null);

  // Load artwork texture
  const artworkTexture = useLoader(THREE.TextureLoader, designImage || undefined);

  // Placement positions on the 3D model (normalized coordinates relative to model bounds)
  const PLACEMENT_3D: Record<string, { position: [number, number, number]; rotation: [number, number, number]; scale: number }> = {
    'front-chest': { position: [-0.12, 0.25, 0.52], rotation: [0, 0, 0], scale: 0.25 },
    'front-full': { position: [0, 0.15, 0.5], rotation: [0, 0, 0], scale: 0.55 },
    'back-full': { position: [0, 0.15, -0.5], rotation: [0, Math.PI, 0], scale: 0.55 },
    'sleeve-left': { position: [-0.45, 0.3, 0.05], rotation: [0, -Math.PI / 2, -0.15], scale: 0.18 },
    'sleeve-right': { position: [0.45, 0.3, 0.05], rotation: [0, Math.PI / 2, 0.15], scale: 0.18 },
    'front': { position: [0, 0.15, 0.5], rotation: [0, 0, 0], scale: 0.55 },
    'back': { position: [0, 0.15, -0.5], rotation: [0, Math.PI, 0], scale: 0.55 },
    'generic': { position: [0, 0.15, 0.5], rotation: [0, 0, 0], scale: 0.55 },
  };

  useEffect(() => {
    if (!scene || applied.current) return;
    applied.current = true;

    const targetColor = new THREE.Color(color);
    const white = new THREE.Color(1, 1, 1);

    // First pass: identify button meshes
    const bodyBox = new THREE.Box3().setFromObject(scene);
    const bodySize = bodyBox.getSize(new THREE.Vector3());
    const bodyVolume = bodySize.x * bodySize.y * bodySize.z;
    const buttonNames = ['button', 'Button', 'buttons', 'Buttons', 'btn', 'Btn', 'button01', 'button02'];

    const buttonMeshes = new Set<THREE.Mesh>();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name || '';
        const childBox = new THREE.Box3().setFromObject(child);
        const childSize = childBox.getSize(new THREE.Vector3());
        const childVolume = childSize.x * childSize.y * childSize.z;
        const isSmall = childVolume < bodyVolume * 0.005;
        const isByName = buttonNames.some(n => name.toLowerCase().includes(n.toLowerCase()));
        const isNearTop = childBox.min.y > bodyBox.max.y - bodySize.y * 0.35;
        if (isByName || (isSmall && isNearTop)) {
          buttonMeshes.add(child);
        }
      }
    });

    // Apply color to body, white to buttons
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        const isButton = buttonMeshes.has(child);
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.map = null;
            mat.normalMap = null;
            mat.aoMap = null;
            mat.emissiveMap = null;
            mat.color.copy(isButton ? white : targetColor);
            mat.roughness = isButton ? 0.3 : 0.85;
            mat.metalness = isButton ? 0.1 : 0.0;
            mat.needsUpdate = true;
          } else if (mat instanceof THREE.MeshPhongMaterial) {
            mat.map = null;
            mat.normalMap = null;
            mat.color.copy(isButton ? white : targetColor);
            mat.specular.set(isButton ? 0x444444 : 0x111111);
            mat.shininess = isButton ? 30 : 5;
            mat.needsUpdate = true;
          }
        });
      }
    });

    // Center model
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const meshBox = child.geometry.boundingBox.clone();
          meshBox.applyMatrix4(child.matrixWorld);
          box.union(meshBox);
        }
      }
    });
    if (box.isEmpty()) box.setFromObject(scene);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);

    const newBox = new THREE.Box3();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const meshBox = child.geometry.boundingBox.clone();
          meshBox.applyMatrix4(child.matrixWorld);
          newBox.union(meshBox);
        }
      }
    });
    if (newBox.isEmpty()) newBox.setFromObject(scene);

    const newCenter = newBox.getCenter(new THREE.Vector3());
    const newMin = newBox.min;
    scene.position.set(-newCenter.x, -newMin.y, -newCenter.z);

    // Create artwork mesh if designImage provided
    if (designImage && artworkTexture) {
      const place = PLACEMENT_3D[placement || 'front-full'] || PLACEMENT_3D['front-full'];
      
      // Create plane geometry for artwork
      const planeGeo = new THREE.PlaneGeometry(place.scale, place.scale);
      const planeMat = new THREE.MeshStandardMaterial({
        map: artworkTexture,
        transparent: true,
        alphaTest: 0.01,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.9,
        metalness: 0.0,
      });
      
      const artworkMesh = new THREE.Mesh(planeGeo, planeMat);
      artworkMesh.position.set(...place.position);
      artworkMesh.rotation.set(...place.rotation);
      artworkMesh.renderOrder = 1; // Render on top of polo
      
      // Add to scene
      scene.add(artworkMesh);
      artworkMeshRef.current = artworkMesh;
    }

    onReady?.();
  }, [scene, color, designImage, placement, artworkTexture, onReady]);

  // Update color on changes
  useEffect(() => {
    if (!scene || !applied.current) return;
    const targetColor = new THREE.Color(color);
    const white = new THREE.Color(1, 1, 1);

    const bodyBox = new THREE.Box3().setFromObject(scene);
    const bodySize = bodyBox.getSize(new THREE.Vector3());
    const bodyVolume = bodySize.x * bodySize.y * bodySize.z;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && !buttonMeshes.has(child)) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            (mat as any).color.copy(targetColor);
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, color]);

  // Update artwork texture when it changes
  useEffect(() => {
    if (artworkMeshRef.current && artworkTexture) {
      (artworkMeshRef.current.material as THREE.MeshStandardMaterial).map = artworkTexture;
      (artworkMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      artworkMeshRef.current.visible = !!designImage;
    } else if (artworkMeshRef.current) {
      artworkMeshRef.current.visible = false;
    }
  }, [artworkTexture, designImage]);

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

export function Polo3DPreview({ color, designImage, placement, className = '' }: { color: string; designImage?: string | null; placement?: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedColor = color && color.startsWith('#') ? color : '#2962a3';

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 5]} intensity={0.6} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <PoloModel color={resolvedColor} designImage={designImage} placement={placement} onReady={() => setLoaded(true)} />
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