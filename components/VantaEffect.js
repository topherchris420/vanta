import { useEffect, useRef, useState } from 'react';
import BIRDS from 'vanta/dist/vanta.birds.min';
import NET from 'vanta/dist/vanta.net.min';
import WAVES from 'vanta/dist/vanta.waves.min';
import FOG from 'vanta/dist/vanta.fog.min';
import * as THREE from 'three';

export default function VantaEffect({ className }) {
  const [effect, setEffect] = useState(null);
  const [effectType, setEffectType] = useState('net'); // Default effect
  const vantaRef = useRef(null);
  
  // Color themes
  const themes = {
    dark: {
      backgroundColor: 0x050505,
      color1: 0x3b28cc,
      color2: 0x5338ff,
    },
    neon: {
      backgroundColor: 0x0f0f12,
      color1: 0xff2975,
      color2: 0x2379ff,
    },
    calm: {
      backgroundColor: 0x0a0a18,
      color1: 0x5d8aa8,
      color2: 0x28464b,
    },
    warm: {
      backgroundColor: 0x120a0a,
      color1: 0xff6b35,
      color2: 0xc52a2a,
    }
  };
  
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  // Function to destroy current effect
  const destroyEffect = () => {
    if (effect) effect.destroy();
  };
  
  // Function to initialize a new effect
  const initEffect = () => {
    if (!vantaRef.current) return;
    
    destroyEffect();
    
    const themeColors = themes[currentTheme];
    let newEffect;
    
    switch (effectType) {
      case 'birds':
        newEffect = BIRDS({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: themeColors.backgroundColor,
          color1: themeColors.color1,
          color2: themeColors.color2,
          birdSize: 1.50,
          wingSpan: 30.00,
          speedLimit: 5.00,
          separation: 60.00,
          quantity: 3.00
        });
        break;
      case 'waves':
        newEffect = WAVES({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: themeColors.color1,
          shininess: 30.00,
          waveHeight: 15.00,
          waveSpeed: 0.75,
          zoom: 0.75
        });
        break;
      case 'fog':
        newEffect = FOG({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          highlightColor: themeColors.color1,
          midtoneColor: themeColors.color2,
          lowlightColor: themeColors.backgroundColor,
          baseColor: 0x000000,
          blurFactor: 0.60,
          speed: 2.00,
          zoom: 1.00
        });
        break;
      default: // 'net' as default
        newEffect = NET({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: themeColors.color1,
          backgroundColor: themeColors.backgroundColor,
          points: 10.00,
          maxDistance: 20.00,
          spacing: 15.00
        });
    }
    
    setEffect(newEffect);
  };

  // Setup the effect on mount
  useEffect(() => {
    if (!vantaRef.current) return;
    
    initEffect();
    
    // Listen for change effect events
    const handleChangeEffect = () => {
      // Rotate through effects
      const effects = ['net', 'birds', 'waves', 'fog'];
      const currentIndex = effects.indexOf(effectType);
      const nextIndex = (currentIndex + 1) % effects.length;
      setEffectType(effects[nextIndex]);
      
      // Also rotate through themes
      const themes = ['dark', 'neon', 'calm', 'warm'];
      const currentThemeIndex = themes.indexOf(currentTheme);
      const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
      setCurrentTheme(themes[nextThemeIndex]);
    };
    
    document.addEventListener('changeVantaEffect', handleChangeEffect);
    
    // Cleanup on unmount
    return () => {
      destroyEffect();
      document.removeEventListener('changeVantaEffect', handleChangeEffect);
    };
  }, []);

  // Re-initialize effect when effectType or theme changes
  useEffect(() => {
    initEffect();
  }, [effectType, currentTheme]);

  return (
    <div ref={vantaRef} className={className} style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1
    }}>
    </div>
  );
}
