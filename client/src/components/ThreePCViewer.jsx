import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  RotateCw, Eye, Sparkles, Sliders, Maximize2, ShieldCheck, 
  Layers, Sun, Moon, Info, ZoomIn 
} from 'lucide-react';

export default function ThreePCViewer({ parts, isDarkMode, lang }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [rgbColor, setRgbColor] = useState('cyan'); // 'cyan' | 'purple' | 'red' | 'green'

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const componentsGroupRef = useRef(null);
  const animatedObjectsRef = useRef([]);
  const componentMeshesRef = useRef({});

  // Exploded view animation state
  const explodedFactorRef = useRef(0);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDarkMode ? 0x070b14 : 0xf1f5f9);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      100
    );
    camera.position.set(4.5, 3.2, 5.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDarkMode ? 1.2 : 1.0;
    currentMount.innerHTML = '';
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 1.5;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x1e293b : 0xffffff, 
      isDarkMode ? 1.5 : 1.2
    );
    scene.add(ambientLight);

    const mainSpot = new THREE.DirectionalLight(0xffffff, isDarkMode ? 2.5 : 2.0);
    mainSpot.position.set(5, 8, 5);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    // Rim lighting (Neon RGB Accent)
    const rgbColors = {
      cyan: 0x06b6d4,
      purple: 0xa855f7,
      red: 0xef4444,
      green: 0x10b981
    };
    const rgbLight = new THREE.PointLight(rgbColors[rgbColor] || 0x06b6d4, 4.0, 10);
    rgbLight.position.set(-0.5, 1.2, 0.2);
    scene.add(rgbLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(isDarkMode ? 0x6366f1 : 0xe2e8f0, 1.0);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    // Floor Grid / Ground reflection
    const grid = new THREE.GridHelper(
      12, 
      24, 
      isDarkMode ? 0x06b6d4 : 0x94a3b8, 
      isDarkMode ? 0x1e293b : 0xe2e8f0
    );
    grid.position.y = -1.2;
    scene.add(grid);

    // 6. Master Container Group for PC Components
    const compGroup = new THREE.Group();
    scene.add(compGroup);
    componentsGroupRef.current = compGroup;

    // 7. Load and assemble 3D models (.glb)
    const loader = new GLTFLoader();
    const loadPromises = [];

    // Helper to load GLB model with safe positioning
    const loadPartGlb = (key, url, defaultPos, defaultRot, scale = 1.0) => {
      return new Promise((resolve) => {
        loader.load(
          url,
          (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.position.set(...defaultPos);
            model.rotation.set(...defaultRot);

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            model.userData = {
              basePos: new THREE.Vector3(...defaultPos),
              explodeOffset: getExplodeOffset(key)
            };

            compGroup.add(model);
            componentMeshesRef.current[key] = model;
            resolve();
          },
          undefined,
          (err) => {
            console.warn(`Could not load ${url}, creating fallback mesh:`, err);
            const fallbackMesh = createProceduralMesh(key, defaultPos);
            compGroup.add(fallbackMesh);
            componentMeshesRef.current[key] = fallbackMesh;
            resolve();
          }
        );
      });
    };

    function getExplodeOffset(key) {
      switch(key) {
        case 'case': return new THREE.Vector3(0, 0, 1.8);
        case 'motherboard': return new THREE.Vector3(0, 0, -0.6);
        case 'cpu': return new THREE.Vector3(0, 0.4, 0);
        case 'cooler': return new THREE.Vector3(0, 1.2, 0);
        case 'ram': return new THREE.Vector3(0.5, 0.8, 0);
        case 'gpu': return new THREE.Vector3(0, -0.4, 1.2);
        case 'ssd': return new THREE.Vector3(-0.4, 0.4, 0);
        case 'psu': return new THREE.Vector3(0, -0.8, -0.6);
        default: return new THREE.Vector3(0, 0, 0);
      }
    }

    function createProceduralMesh(key, pos) {
      const g = new THREE.Group();
      let geo, mat;
      if (key === 'case') {
        geo = new THREE.BoxGeometry(2.2, 3.8, 3.8);
        mat = new THREE.MeshStandardMaterial({ 
          color: isDarkMode ? 0x111827 : 0xffffff, 
          transparent: true, 
          opacity: 0.25, 
          roughness: 0.1 
        });
      } else {
        geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });
      }
      const m = new THREE.Mesh(geo, mat);
      g.add(m);
      g.position.set(...pos);
      g.userData = {
        basePos: new THREE.Vector3(...pos),
        explodeOffset: getExplodeOffset(key)
      };
      return g;
    }

    // Load available models from /models/ directory
    // Positions calibrated to standard ATX Chassis alignment
    loadPromises.push(loadPartGlb('case', '/models/case.glb', [0, 0.4, 0], [0, 0, 0], 1.2));
    loadPromises.push(loadPartGlb('motherboard', '/models/motherboard.glb', [0, 0.4, -0.2], [0, 0, 0], 0.75));
    loadPromises.push(loadPartGlb('cpu', '/models/cpu.glb', [0, 0.4, -0.2], [0, 0, 0], 0.4));
    loadPromises.push(loadPartGlb('cooler', '/models/cooler.glb', [0, 0.7, -0.2], [0, 0, 0], 0.7));
    loadPromises.push(loadPartGlb('ram', '/models/ram.glb', [0.45, 0.4, -0.2], [0, 0, 0], 0.65));
    loadPromises.push(loadPartGlb('gpu', '/models/gpu.glb', [-0.1, -0.1, 0.15], [0, 0, 0], 0.6));
    loadPromises.push(loadPartGlb('ssd', '/models/ssd.glb', [0, 0.15, -0.1], [0, 0, 0], 0.6));
    loadPromises.push(loadPartGlb('psu', '/models/psu.glb', [0, -1.0, 0], [0, 0, 0], 0.55));

    Promise.all(loadPromises).then(() => {
      setLoading(false);
    });

    // 8. Render Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth Exploded View Interpolation
      const targetExplode = exploded ? 1.0 : 0.0;
      explodedFactorRef.current += (targetExplode - explodedFactorRef.current) * 0.08;

      Object.values(componentMeshesRef.current).forEach((mesh) => {
        if (mesh && mesh.userData.basePos && mesh.userData.explodeOffset) {
          mesh.position.copy(mesh.userData.basePos).addScaledVector(
            mesh.userData.explodeOffset, 
            explodedFactorRef.current
          );
        }
      });

      // Subtle dynamic RGB pulse
      if (rgbLight) {
        rgbLight.intensity = 3.5 + Math.sin(time * 3) * 1.2;
      }

      controls.autoRotate = autoRotate;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
    };
  }, [isDarkMode]);

  // Toggle visibility of parts based on Builder state
  useEffect(() => {
    const meshes = componentMeshesRef.current;
    if (!meshes) return;

    if (meshes.motherboard) meshes.motherboard.visible = !!parts.motherboard;
    if (meshes.cpu) meshes.cpu.visible = !!parts.cpu;
    if (meshes.cooler) meshes.cooler.visible = !!parts.cooler;
    if (meshes.ram) meshes.ram.visible = !!parts.ram;
    if (meshes.gpu) meshes.gpu.visible = !!parts.gpu;
    if (meshes.ssd) meshes.ssd.visible = !!parts.storage;
    if (meshes.psu) meshes.psu.visible = !!parts.psu;
    if (meshes.case) meshes.case.visible = true; // Always show case frame
  }, [parts]);

  // Preset Camera Positions
  const setCameraPreset = (type) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (type === 'isometric') {
      cam.position.set(4.5, 3.2, 5.5);
    } else if (type === 'side') {
      cam.position.set(5.5, 0.5, 0);
    } else if (type === 'front') {
      cam.position.set(0, 0.5, 5.5);
    } else if (type === 'top') {
      cam.position.set(0, 6.0, 0.1);
    }
    ctrl.target.set(0, 0.5, 0);
    ctrl.update();
  };

  return (
    <div className={`relative w-full h-[520px] rounded-2xl overflow-hidden border transition-all ${
      isDarkMode 
        ? 'bg-slate-950/90 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]' 
        : 'bg-slate-100 border-slate-300 shadow-xl'
    }`}>
      {/* 3D Canvas Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            {lang === 'uz' ? '3D Modellar yuklanmoqda...' : 'Загрузка 3D моделей (.GLB)...'}
          </span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none z-20">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
            isDarkMode 
              ? 'bg-slate-900/80 border-slate-700 text-white' 
              : 'bg-white/80 border-slate-200 text-slate-800'
          }`}>
            3D REAL-TIME ENGINE
          </span>
        </div>

        {/* View Camera Angles */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setCameraPreset('isometric')}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium"
            title="Изометрия"
          >
            3D
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium"
            title="Сбоку"
          >
            {lang === 'uz' ? 'Yon' : 'Бок'}
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium"
            title="Спереди"
          >
            {lang === 'uz' ? 'Old' : 'Перед'}
          </button>
        </div>
      </div>

      {/* Bottom Floating Toolbar: Explode view, Auto-Rotate, RGB */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        {/* Hint text */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'uz' ? 'Aylantirish uchun sichqonchani suring' : 'Зажмите мышь для вращения 3D сцены'}</span>
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Exploded View Toggle */}
          <button
            onClick={() => setExploded(!exploded)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              exploded 
                ? 'bg-amber-500 text-black shadow-amber-500/20' 
                : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{exploded ? (lang === 'uz' ? 'Yig\'ish' : 'Собрать') : (lang === 'uz' ? 'Vzriv-sxema (3D)' : 'Взрыв-схема')}</span>
          </button>

          {/* Auto-rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              autoRotate 
                ? 'bg-cyan-500 text-black shadow-cyan-500/20' 
                : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>Auto</span>
          </button>

          {/* Reset View */}
          <button
            onClick={() => setCameraPreset('isometric')}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300"
            title="Сброс камеры"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
