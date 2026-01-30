
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HologramStageProps {
  imageUrl: string;
  subject: string;
  scale?: number;
  color?: string;
}

const HologramStage: React.FC<HologramStageProps> = ({ 
  imageUrl, 
  subject, 
  scale = 1, 
  color = '#22d3ee' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hologramRef = useRef<THREE.Mesh | null>(null);
  const ghostRef = useRef<THREE.Mesh | null>(null);
  
  // Interaction State Tracking
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(scale);
  const currentZoom = useRef(scale);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const themeColor = new THREE.Color(color);

    // Ground Grid
    const grid = new THREE.GridHelper(30, 60, themeColor, 0x0a0a0a);
    grid.position.y = -2;
    scene.add(grid);

    // Volumetric Light Beam (Cone)
    const beamGeo = new THREE.CylinderGeometry(0.1, 4, 10, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 3;
    scene.add(beam);

    // Emitter Plate
    const plateGeo = new THREE.CircleGeometry(2, 32);
    const plateMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.2, wireframe: true });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -1.95;
    scene.add(plate);

    // Particle Simulation System
    const particleCount = 5000;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 8;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.015,
      color: themeColor,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // The Main Hologram Image
    const texture = new THREE.TextureLoader().load(imageUrl);
    const planeGeo = new THREE.PlaneGeometry(4, 4);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: themeColor
    });
    
    const hologram = new THREE.Mesh(planeGeo, planeMat);
    hologram.position.y = 1;
    hologram.scale.setScalar(scale);
    scene.add(hologram);
    hologramRef.current = hologram;

    // Ghost Frame for Chromatic Aberration Effect
    const ghostMat = planeMat.clone();
    ghostMat.opacity = 0.2;
    const ghost = new THREE.Mesh(planeGeo, ghostMat);
    ghost.position.y = 1;
    ghost.scale.setScalar(scale * 1.05);
    scene.add(ghost);
    ghostRef.current = ghost;

    // Interaction Listeners
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      // Update target rotation based on movement
      targetRotation.current.y += deltaX * 0.005;
      targetRotation.current.x += deltaY * 0.005;
      
      // Clamp vertical rotation slightly to prevent flip
      targetRotation.current.x = Math.max(Math.min(targetRotation.current.x, Math.PI / 4), -Math.PI / 4);
      
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      targetZoom.current -= e.deltaY * zoomSpeed;
      // Clamp zoom to reasonable levels
      targetZoom.current = Math.max(0.1, Math.min(targetZoom.current, 3));
    };

    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    let frame = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const dt = clock.getDelta();
      
      // Smoothly interpolate current values to target values (lerping)
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;
      currentZoom.current += (targetZoom.current - currentZoom.current) * 0.1;

      // Update Mesh states
      if (hologramRef.current && ghostRef.current) {
        const floatY = 1 + Math.sin(elapsed * 2) * 0.1;
        
        hologramRef.current.position.y = floatY;
        hologramRef.current.rotation.x = currentRotation.current.x;
        hologramRef.current.rotation.y = currentRotation.current.y;
        hologramRef.current.scale.setScalar(currentZoom.current);
        
        ghostRef.current.position.y = floatY;
        ghostRef.current.rotation.x = currentRotation.current.x;
        ghostRef.current.rotation.y = currentRotation.current.y;
        ghostRef.current.scale.setScalar(currentZoom.current * 1.05);
        
        // Minor "glitch" jitter on the ghost frame
        ghostRef.current.position.x = Math.sin(elapsed * 15) * 0.03; 
      }

      // Particles rising from emitter
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.01;
        if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = -2;
      }
      particleGeo.attributes.position.needsUpdate = true;
      
      // Flickering effect logic
      if (Math.random() > 0.985) {
        hologram.visible = false;
        setTimeout(() => { if (hologramRef.current) hologramRef.current.visible = true; }, 40);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [imageUrl, color]);

  // Sync target zoom if external scale prop changes
  useEffect(() => {
    targetZoom.current = scale;
  }, [scale]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-grab active:cursor-grabbing" 
      title="Left Click + Drag to Rotate • Scroll to Zoom"
    />
  );
};

export default HologramStage;
