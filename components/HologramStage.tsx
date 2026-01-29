
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HologramStageProps {
  imageUrl: string;
  subject: string;
}

const HologramStage: React.FC<HologramStageProps> = ({ imageUrl, subject }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(20, 40, 0x0ea5e9, 0x020617);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Emitter Base (Cylinder)
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.2, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0ea5e9, 
      transparent: true, 
      opacity: 0.4,
      wireframe: true
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -1.9;
    scene.add(base);

    // Projection Cone (Light Beam)
    const coneGeometry = new THREE.ConeGeometry(2, 4, 32, 1, true);
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 0.1;
    scene.add(cone);

    // Hologram Texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load(imageUrl);
    
    // Hologram Planes (Layered for depth feel)
    const planeGeometry = new THREE.PlaneGeometry(3.5, 3.5);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const hologram = new THREE.Mesh(planeGeometry, planeMaterial);
    hologram.position.y = 0.5;
    scene.add(hologram);

    // Back glow plane
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const backGlow = new THREE.Mesh(planeGeometry, glowMaterial);
    backGlow.position.y = 0.5;
    backGlow.position.z = -0.1;
    backGlow.scale.set(1.1, 1.1, 1.1);
    scene.add(backGlow);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x0ea5e9, 2, 10);
    pointLight.position.set(0, -1.8, 0);
    scene.add(pointLight);

    // Animation Loop
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Gentle rotation and float
      hologram.rotation.y = Math.sin(time * 0.5) * 0.2;
      hologram.position.y = 0.5 + Math.sin(time * 2) * 0.05;
      
      backGlow.rotation.y = hologram.rotation.y;
      backGlow.position.y = hologram.position.y;

      base.rotation.y += 0.005;
      cone.rotation.y -= 0.002;
      
      // Flicker effect
      if (Math.random() > 0.98) {
        hologram.visible = false;
        setTimeout(() => { hologram.visible = true; }, 50);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-4 left-4 mono text-[10px] text-cyan-400/50 pointer-events-none">
        VOLUMETRIC_RENDER_STATE: ACTIVE<br/>
        INTERPOLATION: LINEAR<br/>
        DEPTH_STENCIL: ENABLED
      </div>
      <div className="absolute bottom-4 right-4 mono text-[10px] text-cyan-400/50 text-right pointer-events-none">
        SUBJECT: {subject.toUpperCase()}<br/>
        CORE_LOAD: 24.2%<br/>
        FPS: 60.0
      </div>
    </div>
  );
};

export default HologramStage;
