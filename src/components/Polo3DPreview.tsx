import React, { useRef, useEffect, useState, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('3D Error:', error); }
  render() { 
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function createLatheProfile(points: [number, number][], segments = 32) {
  const vectors = points.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(vectors, segments);
}

function PoloModel({ color, designImage, placement, onReady }: { color: string; designImage?: string | null; placement?: string; onReady?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const poloRef = useRef<THREE.Group>(null);
  const artworkRef = useRef<THREE.Mesh | null>(null);

  const PLACEMENT_3D: Record<string, { position: [number, number, number]; rotation: [number, number, number]; scale: number }> = {
    'front-chest': { position: [-0.22, 0.15, 0.36], rotation: [0, 0, 0], scale: 0.25 },
    'front-full': { position: [0, 0.0, 0.35], rotation: [0, 0, 0], scale: 0.55 },
    'back-full': { position: [0, 0.0, -0.35], rotation: [0, Math.PI, 0], scale: 0.55 },
    'sleeve-left': { position: [-0.48, 0.35, 0.0], rotation: [0, -Math.PI / 2, -0.15], scale: 0.2 },
    'sleeve-right': { position: [0.48, 0.35, 0.0], rotation: [0, Math.PI / 2, 0.15], scale: 0.2 },
    'front': { position: [0, 0.0, 0.35], rotation: [0, 0, 0], scale: 0.55 },
    'back': { position: [0, 0.0, -0.35], rotation: [0, Math.PI, 0], scale: 0.55 },
    'generic': { position: [0, 0.0, 0.35], rotation: [0, 0, 0], scale: 0.55 },
  };

  useEffect(() => {
    const polo = new THREE.Group();
    const c = new THREE.Color(color);
    const white = new THREE.Color(1, 1, 1);

    const mainMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0.0 });
    const btnMat = new THREE.MeshStandardMaterial({ color: white, roughness: 0.3, metalness: 0.15 });

    // ── Body: lathe-profiled torso (wider shoulders, narrower waist) ──
    const bodyPoints: [number, number][] = [
      [0.0,  0.55],  // neck top center
      [0.14, 0.55],  // neck edge
      [0.32, 0.50],  // shoulder
      [0.34, 0.35],  // upper chest
      [0.33, 0.15],  // mid torso
      [0.30, 0.0],   // waist
      [0.31, -0.15], // hip
      [0.32, -0.35], // lower body
      [0.32, -0.50], // hem area
      [0.32, -0.55], // hem bottom
      [0.0,  -0.55], // close bottom center
    ];
    const bodyGeo = createLatheProfile(bodyPoints, 48);
    const body = new THREE.Mesh(bodyGeo, mainMat);
    body.castShadow = true;
    body.receiveShadow = true;
    polo.add(body);

    // ── Left sleeve ──
    const leftSleevePoints: [number, number][] = [
      [0.0,   0.12],
      [0.06,  0.12],
      [0.12,  0.08],
      [0.14,  0.0],
      [0.14, -0.05],
      [0.12, -0.12],
      [0.0,  -0.12],
    ];
    const leftSleeveGeo = createLatheProfile(leftSleevePoints, 24);
    const leftSleeve = new THREE.Mesh(leftSleeveGeo, mainMat);
    leftSleeve.position.set(-0.34, 0.35, 0);
    leftSleeve.rotation.z = -Math.PI / 2;
    leftSleeve.castShadow = true;
    polo.add(leftSleeve);

    // ── Right sleeve ──
    const rightSleevePoints: [number, number][] = [
      [0.0,   0.12],
      [0.06,  0.12],
      [0.12,  0.08],
      [0.14,  0.0],
      [0.14, -0.05],
      [0.12, -0.12],
      [0.0,  -0.12],
    ];
    const rightSleeveGeo = createLatheProfile(rightSleevePoints, 24);
    const rightSleeve = new THREE.Mesh(rightSleeveGeo, mainMat);
    rightSleeve.position.set(0.34, 0.35, 0);
    rightSleeve.rotation.z = Math.PI / 2;
    rightSleeve.castShadow = true;
    polo.add(rightSleeve);

    // ── Collar (torus ring) ──
    const collarGeo = new THREE.TorusGeometry(0.15, 0.028, 12, 48);
    const collar = new THREE.Mesh(collarGeo, mainMat);
    collar.position.y = 0.56;
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1.0, 0.8, 0.6);
    collar.castShadow = true;
    polo.add(collar);

    // ── Collar placket (V-shaped strip down front) ──
    const placketShape = new THREE.Shape();
    placketShape.moveTo(-0.025, 0);
    placketShape.lineTo(0.025, 0);
    placketShape.lineTo(0.02, -0.14);
    placketShape.lineTo(-0.02, -0.14);
    placketShape.closePath();
    const placketGeo = new THREE.ExtrudeGeometry(placketShape, { depth: 0.012, bevelEnabled: false });
    const placket = new THREE.Mesh(placketGeo, mainMat);
    placket.position.set(0, 0.53, 0.34);
    placket.castShadow = true;
    polo.add(placket);

    // ── Buttons on placket ──
    for (let i = 0; i < 3; i++) {
      const btnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 12);
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(0, 0.49 - i * 0.04, 0.36);
      btn.rotation.x = Math.PI / 2;
      btn.castShadow = true;
      polo.add(btn);
    }

    // ── Hem band ──
    const hemGeo = new THREE.CylinderGeometry(0.325, 0.33, 0.025, 48);
    const hem = new THREE.Mesh(hemGeo, mainMat);
    hem.position.y = -0.54;
    hem.castShadow = true;
    polo.add(hem);

    // ── Sleeve cuffs (ribbed bands) ──
    const cuffGeoL = new THREE.CylinderGeometry(0.125, 0.13, 0.02, 24);
    const cuffL = new THREE.Mesh(cuffGeoL, mainMat);
    cuffL.position.set(-0.38, 0.23, 0);
    cuffL.rotation.z = -Math.PI / 2;
    cuffL.castShadow = true;
    polo.add(cuffL);

    const cuffR = new THREE.Mesh(cuffGeoL.clone(), mainMat);
    cuffR.position.set(0.38, 0.23, 0);
    cuffR.rotation.z = Math.PI / 2;
    cuffR.castShadow = true;
    polo.add(cuffR);

    poloRef.current = polo;
    groupRef.current?.add(polo);
    onReady?.();

    // ── Artwork ──
    if (designImage) {
      const place = PLACEMENT_3D[placement || 'front-full'] || PLACEMENT_3D['front-full'];
      const loader = new THREE.TextureLoader();
      loader.load(designImage, (texture) => {
        const geo = new THREE.PlaneGeometry(place.scale, place.scale);
        const mat = new THREE.MeshStandardMaterial({
          map: texture, transparent: true, alphaTest: 0.01,
          side: THREE.DoubleSide, depthWrite: false, roughness: 0.9, metalness: 0.0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...place.position);
        mesh.rotation.set(...place.rotation);
        mesh.renderOrder = 1;
        polo.add(mesh);
        artworkRef.current = mesh;
      });
    }

    return () => { poloRef.current = null; artworkRef.current = null; };
  }, [color, designImage, placement, onReady]);

  // Color change
  useEffect(() => {
    if (!poloRef.current) return;
    const c = new THREE.Color(color);
    poloRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.roughness === 0.3) return; // skip buttons
        child.material.color.copy(c);
        child.material.needsUpdate = true;
      }
    });
  }, [color]);

  // Artwork update
  useEffect(() => {
    if (!poloRef.current || !artworkRef.current) return;
    if (designImage) {
      const loader = new THREE.TextureLoader();
      loader.load(designImage, (tex) => {
        if (!artworkRef.current) return;
        (artworkRef.current.material as THREE.MeshStandardMaterial).map = tex;
        (artworkRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        artworkRef.current.visible = true;
      }, undefined, () => { if (artworkRef.current) artworkRef.current.visible = false; });
    } else {
      artworkRef.current.visible = false;
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
    const t = setTimeout(() => { if (!loaded && !error) setError(true); }, 15000);
    return () => clearTimeout(t);
  }, [loaded, error]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0.15, 2.8], fov: 34 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)' }}
        onCreated={() => setLoaded(true)}
        onError={() => setError(true)}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 5]} intensity={0.7} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <ErrorBoundary>
            <PoloModel color={resolvedColor} designImage={designImage} placement={placement} onReady={() => setLoaded(true)} />
          </ErrorBoundary>
        </Suspense>
        <OrbitControls
          enablePan={false} enableZoom={true}
          minDistance={1.8} maxDistance={5}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.5}
          target={[0, 0.0, 0]}
          enableDamping={true} dampingFactor={0.05}
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