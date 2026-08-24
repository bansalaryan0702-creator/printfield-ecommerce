import React, { useRef, useEffect, useState, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error) { console.error('3D Model Error:', error); }
  render() { 
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D model failed to load</p>
            <pre className="text-xs text-red-500 bg-gray-100 p-2 rounded text-left max-h-32 overflow-auto">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Procedural polo shirt made from Three.js primitives - ~50KB, never crashes
function PoloModel({ color, designImage, placement, onReady }: { color: string; designImage?: string | null; placement?: string; onReady?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const poloGroupRef = useRef<THREE.Group>(null);
  const artworkMeshRef = useRef<THREE.Mesh | null>(null);

  const targetColor = new THREE.Color(color);
  const white = new THREE.Color(1, 1, 1);

  // Placement positions
  const PLACEMENT_3D: Record<string, { position: [number, number, number]; rotation: [number, number, number]; scale: number }> = {
    'front-chest': { position: [-0.25, 0.15, 0.42], rotation: [0, 0, 0], scale: 0.3 },
    'front-full': { position: [0, 0.05, 0.4], rotation: [0, 0, 0], scale: 0.6 },
    'back-full': { position: [0, 0.05, -0.4], rotation: [0, Math.PI, 0], scale: 0.6 },
    'sleeve-left': { position: [-0.5, 0.3, 0], rotation: [0, -Math.PI / 2, -0.15], scale: 0.22 },
    'sleeve-right': { position: [0.5, 0.3, 0], rotation: [0, Math.PI / 2, 0.15], scale: 0.22 },
    'front': { position: [0, 0.05, 0.4], rotation: [0, 0, 0], scale: 0.6 },
    'back': { position: [0, 0.05, -0.4], rotation: [0, Math.PI, 0], scale: 0.6 },
    'generic': { position: [0, 0.05, 0.4], rotation: [0, 0, 0], scale: 0.6 },
  };

  useEffect(() => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: targetColor,
      roughness: 0.85,
      metalness: 0.0,
    });

    const buttonMat = new THREE.MeshStandardMaterial({
      color: white,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Main body (torso)
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.45, 1.2, 32);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Collar
    const collarGeo = new THREE.TorusGeometry(0.18, 0.035, 16, 32, Math.PI * 2);
    const collar = new THREE.Mesh(collarGeo, mat);
    collar.position.y = 0.72;
    collar.rotation.x = -Math.PI / 2;
    collar.scale.set(1, 1, 0.8);
    collar.castShadow = true;
    group.add(collar);

    // Collar front opening
    const collarFrontGeo = new THREE.BoxGeometry(0.12, 0.18, 0.02);
    const collarFront = new THREE.Mesh(collarFrontGeo, mat);
    collarFront.position.set(0, 0.6, 0.42);
    collarFront.castShadow = true;
    group.add(collarFront);

    // Left sleeve
    const leftSleeveGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16);
    const leftSleeve = new THREE.Mesh(leftSleeveGeo, mat);
    leftSleeve.position.set(-0.55, 0.45, 0);
    leftSleeve.rotation.z = Math.PI / 2;
    leftSleeve.castShadow = true;
    group.add(leftSleeve);

    // Right sleeve
    const rightSleeveGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16);
    const rightSleeve = new THREE.Mesh(rightSleeveGeo, mat);
    rightSleeve.position.set(0.55, 0.45, 0);
    rightSleeve.rotation.z = -Math.PI / 2;
    rightSleeve.castShadow = true;
    group.add(rightSleeve);

    // Sleeve cuffs
    const cuffGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16);
    const leftCuff = new THREE.Mesh(cuffGeo, mat);
    leftCuff.position.set(-0.78, 0.45, 0);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.castShadow = true;
    group.add(leftCuff);

    const rightCuff = new THREE.Mesh(cuffGeo, mat);
    rightCuff.position.set(0.78, 0.45, 0);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.castShadow = true;
    group.add(rightCuff);

    // Buttons (3 on collar)
    for (let i = 0; i < 3; i++) {
      const btnGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16);
      const btn = new THREE.Mesh(btnGeo, buttonMat);
      btn.position.set(0.02, 0.65 - i * 0.05, 0.43);
      btn.rotation.x = Math.PI / 2;
      btn.castShadow = true;
      group.add(btn);
    }

    // Bottom hem
    const hemGeo = new THREE.TorusGeometry(0.5, 0.012, 16, 32);
    const hem = new THREE.Mesh(hemGeo, mat);
    hem.position.y = -0.5;
    hem.rotation.x = -Math.PI / 2;
    hem.castShadow = true;
    group.add(hem);

    poloGroupRef.current = group;
    groupRef.current.add(group);
    onReady?.();

    // Create artwork if provided
    if (designImage) {
      const place = PLACEMENT_3D[placement || 'front-full'] || PLACEMENT_3D['front-full'];
      const loader = new THREE.TextureLoader();
      loader.load(designImage, (texture) => {
        const planeGeo = new THREE.PlaneGeometry(place.scale, place.scale);
        const planeMat = new THREE.MeshStandardMaterial({
          map: texture,
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
        artworkMesh.renderOrder = 1;
        group.add(artworkMesh);
        artworkMeshRef.current = artworkMesh;
      }, undefined, (err) => {
        console.warn('Failed to load artwork texture:', err);
      });
    }
  }, [color, designImage, placement, onReady]);

  // Update color
  useEffect(() => {
    if (!poloGroupRef.current) return;
    const targetColor = new THREE.Color(color);
    poloGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // Don't change button color
        if (child.material.roughness === 0.3 && child.material.metalness === 0.1) return;
        child.material.color.copy(targetColor);
        child.material.needsUpdate = true;
      }
    });
  }, [color]);

  // Update artwork
  useEffect(() => {
    if (designImage && artworkMeshRef.current) {
      const loader = new THREE.TextureLoader();
      loader.load(designImage, (texture) => {
        (artworkMeshRef.current!.material as THREE.MeshStandardMaterial).map = texture;
        (artworkMeshRef.current!.material as THREE.MeshStandardMaterial).needsUpdate = true;
        artworkMeshRef.current!.visible = true;
      }, undefined, (err) => {
        console.warn('Failed to load artwork texture:', err);
        if (artworkMeshRef.current) artworkMeshRef.current.visible = false;
      });
    } else if (artworkMeshRef.current) {
      artworkMeshRef.current.visible = false;
    }
  }, [designImage]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 + 0.3;
    }
  });

  return <group ref={groupRef} />;
}

export function Polo3DPreview({ color, designImage, placement, className = '' }: { color: string; designImage?: string | null; placement?: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedColor = color && color.startsWith('#') ? color : '#2962a3';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded && !error) setError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [loaded, error]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0.2, 5], fov: 30 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={(e) => { console.error('Canvas error:', e); setError(true); }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 5]} intensity={0.6} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <ErrorBoundary fallback={null}>
            <PoloModel color={resolvedColor} designImage={designImage} placement={placement} onReady={() => setLoaded(true)} />
          </ErrorBoundary>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3.5}
          maxDistance={6.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 0.2, 0]}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>

      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
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