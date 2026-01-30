
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { THEMES } from '../constants';
import { JarvisTheme } from '../types';

interface JarvisCoreProps {
  active: boolean;
  theme: JarvisTheme;
  speaking?: boolean;
}

const JarvisCore: React.FC<JarvisCoreProps> = ({ active, theme, speaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeColors = THEMES[theme];
  
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const themeColor = new THREE.Color(themeColors.primary);
    const accentColor = new THREE.Color(themeColors.accent);

    const group = new THREE.Group();
    scene.add(group);

    // Fractal Core
    const coreGeo = new THREE.IcosahedronGeometry(1.5, 3);
    const coreMat = new THREE.MeshPhongMaterial({ 
      color: themeColor, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.1,
      emissive: themeColor,
      emissiveIntensity: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbital Shells
    const shells: THREE.Mesh[] = [];
    for(let i=0; i<5; i++) {
      const shellGeo = new THREE.TorusGeometry(2.5 + i*0.8, 0.02, 16, 120);
      const shellMat = new THREE.MeshBasicMaterial({ 
        color: i % 2 === 0 ? themeColor : accentColor, 
        transparent: true, 
        opacity: 0.3 - i*0.05 
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      shell.rotation.x = Math.random() * Math.PI;
      shell.rotation.y = Math.random() * Math.PI;
      group.add(shell);
      shells.push(shell);
    }

    // Neural Cloud
    const pCount = 4000;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount*3; i++) pPos[i] = (Math.random() - 0.5) * 20;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.025, color: themeColor, transparent: true, opacity: 0.2 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    const light = new THREE.PointLight(themeColor, 15, 30);
    scene.add(light);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      group.rotation.y += active ? 1.2 * dt : 0.3 * dt;
      group.rotation.z += active ? 0.6 * dt : 0.1 * dt;

      const scale = speaking ? 1 + Math.sin(time * 18) * 0.2 : 1 + Math.sin(time * 2.5) * 0.08;
      core.scale.setScalar(scale);
      core.material.opacity = speaking ? 0.7 : 0.15;
      core.material.emissiveIntensity = speaking ? 1.5 : 0.8;

      shells.forEach((s, i) => {
        s.rotation.x += dt * (i + 1) * 0.12;
        s.rotation.y += dt * (i + 1) * 0.18;
        const sScale = speaking ? 1 + Math.sin(time * 12 + i) * 0.05 : 1;
        s.scale.setScalar(sScale);
      });

      points.rotation.y += 0.08 * dt;
      points.rotation.x += 0.02 * dt;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      if(!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if(containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [theme, active, speaking]);

  return <div ref={containerRef} className="w-full h-full mix-blend-screen" />;
};

export default JarvisCore;
