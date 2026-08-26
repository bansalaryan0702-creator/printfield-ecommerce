import React, { useRef, useEffect, useState, Suspense, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.error('3D error:', e); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-xs text-purple-600 font-medium">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Placement positions on the 3D model
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

function applyColor(scene: THREE.Group, color: string) {
  const targetColor = new THREE.Color(color);
  const white = new THREE.Color(1, 1, 1);

  const bodyBox = new THREE.Box3().setFromObject(scene);
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const bodyVol = bodySize.x * bodySize.y * bodySize.z;
  const btnMeshes = new Set<THREE.Mesh>();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    const b = new THREE.Box3().setFromObject(c);
    const s = b.getSize(new THREE.Vector3());
    const v = s.x * s.y * s.z;
    const small = v < bodyVol * 0.005;
    const nearTop = b.min.y > bodyBox.max.y - bodySize.y * 0.35;
    const named = (c.name || '').toLowerCase().includes('button') || (c.name || '').toLowerCase().includes('btn');
    if (named || (small && nearTop)) btnMeshes.add(c);
  });

  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    c.castShadow = false;
    c.receiveShadow = false;
    const isBtn = btnMeshes.has(c);
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach((m) => {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.map = null; m.normalMap = null; m.aoMap = null; m.emissiveMap = null;
        m.color.copy(isBtn ? white : targetColor);
        m.roughness = isBtn ? 0.3 : 0.85;
        m.metalness = isBtn ? 0.15 : 0;
        m.needsUpdate = true;
      } else if (m instanceof THREE.MeshPhongMaterial) {
        m.map = null; m.normalMap = null;
        m.color.copy(isBtn ? white : targetColor);
        m.specular.set(isBtn ? 0x444444 : 0x111111);
        m.shininess = isBtn ? 30 : 5;
        m.needsUpdate = true;
      }
    });
  });
}

function centerModel(scene: THREE.Group) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    c.geometry.computeBoundingBox();
    if (c.geometry.boundingBox) {
      box.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld));
    }
  });
  if (box.isEmpty()) box.setFromObject(scene);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  scene.scale.setScalar(3.0 / maxDim);
  scene.updateMatrixWorld(true);

  const nb = new THREE.Box3();
  scene.traverse((c) => {
    if (!(c instanceof THREE.Mesh)) return;
    c.geometry.computeBoundingBox();
    if (c.geometry.boundingBox) {
      nb.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld));
    }
  });
  if (nb.isEmpty()) nb.setFromObject(scene);
  const nc = nb.getCenter(new THREE.Vector3());
  const nm = nb.min;
  scene.position.set(-nc.x, -nm.y, -nc.z);
}

function PoloModel({ color, designImage, placement, onReady }: { color: string; designImage?: string | null; placement?: string; onReady?: () => void }) {
  const { scene } = useGLTF('/polo3d/polo.glb');
  const groupRef = useRef<THREE.Group>(null);
  const didCenter = useRef(false);
  const artworkRef = useRef<THREE.Mesh | null>(null);

  // Center on first load
  useEffect(() => {
    if (!scene || didCenter.current) return;
    didCenter.current = true;
    centerModel(scene);
    applyColor(scene, color);
    onReady?.();
  }, [scene]);

  // Color update on every change
  useEffect(() => {
    if (!scene || !didCenter.current) return;
    applyColor(scene, color);
  }, [scene, color]);

  // Artwork overlay - load texture inside effect to avoid crashes
  useEffect(() => {
    if (!scene || !designImage || !didCenter.current) {
      if (artworkRef.current) artworkRef.current.visible = false;
      return;
    }

    console.log('[3D] Loading artwork:', designImage, 'for placement:', placement);
    const place = PLACEMENT_3D[placement || 'front-full'] || PLACEMENT_3D['front-full'];
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); // Try CORS
    
    // Try direct load first
    loader.load(designImage, (texture) => {
      console.log('[3D] Artwork texture loaded successfully');
      createOrUpdateArtwork(texture);
    }, undefined, (err) => {
      console.warn('[3D] Direct load failed, trying proxy:', err);
      // Fallback: try via proxy for CORS issues
      const proxyUrl = `/api/proxy-image/${designImage.split('/').pop()}`;
      loader.load(proxyUrl, (texture) => {
        console.log('[3D] Artwork loaded via proxy');
        createOrUpdateArtwork(texture);
      }, undefined, (err2) => {
        console.error('[3D] Both loads failed:', err2);
        if (artworkRef.current) artworkRef.current.visible = false;
      });
    });

    function createOrUpdateArtwork(texture: THREE.Texture) {
      if (!artworkRef.current) {
        const geo = new THREE.PlaneGeometry(place.scale, place.scale);
        const mat = new THREE.MeshStandardMaterial({
          map: texture, transparent: true, alphaTest: 0.01,
          side: THREE.DoubleSide, depthWrite: false, roughness: 0.9, metalness: 0.0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...place.position);
        mesh.rotation.set(...place.rotation);
        mesh.renderOrder = 1;
        scene.add(mesh);
        artworkRef.current = mesh;
        console.log('[3D] Artwork mesh created at:', place.position);
      } else {
        (artworkRef.current.material as THREE.MeshStandardMaterial).map = texture;
        (artworkRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        artworkRef.current.visible = true;
      }
    }

    return () => {
      if (artworkRef.current) scene.remove(artworkRef.current);
      artworkRef.current = null;
    };
  }, [scene, designImage, placement]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12 + 0.25;
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

  useEffect(() => {
    const t = setTimeout(() => { if (!loaded && !error) setError(true); }, 60000);
    return () => clearTimeout(t);
  }, [loaded, error]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 32 }}
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
          minDistance={4} maxDistance={7}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.5}
          target={[0, 1.2, 0]}
          enableDamping={true} dampingFactor={0.05}
        />
      </Canvas>

      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="w-10 h-10 rounded-full border-3 border-purple-200 border-t-purple-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading 3D Preview...</p>
          <p className="text-xs text-gray-400 mt-1">First load may take 15-30 seconds</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">3D preview could not load</p>
            <p className="text-xs text-gray-400 mb-2">Model may be too large for your connection</p>
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