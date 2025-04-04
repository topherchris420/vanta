import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import DOTS from 'vanta/dist/vanta.dots.min';
import WAVES from 'vanta/dist/vanta.waves.min';
import BIRDS from 'vanta/dist/vanta.birds.min';

const VantaEffect = ({ className, theme }) => {
  const [effect, setEffect] = useState(null);
  const [effectType, setEffectType] = useState('NET');
  const myRef = useRef(null);

  // Color schemes based on theme
  const colors = {
    dark: {
      NET: {
        color: 0x0088ff,
        backgroundColor: 0x0d1117,
        points: 10,
        maxDistance: 20,
        spacing: 15,
      },
      DOTS: {
        color: 0xffffff,
        backgroundColor: 0x0d1117,
        size: 3,
        spacing: 35,
        showLines: true,
      },
      WAVES: {
        color: 0x1a90ff,
        shininess: 60,
        waveHeight: 15,
        waveSpeed: 0.75,
        zoom: 1,
      },
      BIRDS: {
        backgroundColor: 0x000000,
        color1: 0x3b5dc9,
        color2: 0x0088ff,
        colorMode: 'variance',
        quantity: 3,
        birdSize: 1.5,
      }
    },
    light: {
      NET: {
        color: 0x1c5eff,
        backgroundColor: 0xf5f5f5,
        points: 10,
        maxDistance: 20,
        spacing: 15,
      },
      DOTS: {
        color: 0x3b5dc9,
        backgroundColor: 0xf5f5f5,
        size: 3,
        spacing: 35,
        showLines: true
      },
      WAVES: {
        color: 0x1a90ff,
        shininess: 60,
        waveHeight: 15,
        waveSpeed: 0.75,
        zoom: 1,
      },
      BIRDS: {
        backgroundColor: 0xf5f5f5,
        color1: 0x3b5dc9,
        color2: 0x1a90ff,
        colorMode: 'variance',
        quantity: 3,
        birdSize: 1.5,
      }
    }
  };

  // Function to cycle through different effects
  const cycleEffect = () => {
    const effects = ['NET', 'DOTS', 'WAVES', 'BIRDS'];
    const currentIndex = effects.indexOf(effectType);
    const nextIndex = (currentIndex + 1) % effects.length;
    setEffectType(effects[nextIndex]);
  };

  useEffect(() => {
    // Clean up previous effect if it exists
    if (effect) effect.destroy();
    
    if (!myRef.current) return;

    // Choose effect based on current effectType
    let vantaEffect;
    const settings = colors[theme][effectType];
    
    switch(effectType) {
      case 'NET':
        vantaEffect = NET({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          ...settings
        });
        break;
      case 'DOTS':
        vantaEffect = DOTS({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          ...settings
        });
        break;
      case 'WAVES':
        vantaEffect = WAVES({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          ...settings
        });
        break;
      case 'BIRDS':
        vantaEffect = BIRDS({
          el: myRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          ...settings
        });
        break;
    }
    
    setEffect(vantaEffect);
    
    // Set a timer to cycle through effects every 30 seconds
    const timer = setTimeout(cycleEffect, 30000);
    
    return () => {
      if (vantaEffect) vantaEffect.destroy();
      clearTimeout(timer);
    };
  }, [effectType, theme]);

  return (
    <div 
      ref={myRef} 
      className={className} 
      style={{ 
        position: 'fixed', 
        width: '100%', 
        height: '100%',
        top: 0,
        left: 0,
        zIndex: -1
      }}
      onClick={cycleEffect}
    >
      <div className="effect-info" style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        opacity: 0.7
      }}>
        Click background to change effect
      </div>
    </div>
  );
};

export default VantaEffect;
