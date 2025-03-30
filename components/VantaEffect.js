// components/VantaEffect.js
import { useState, useEffect, useRef } from 'react';
import NET from 'vanta/dist/vanta.net.min.js'; // Make sure path is correct
import * as THREE from 'three';

const VantaEffect = ({ className }) => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    // Ensure this code runs only on the client
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE: THREE, // Pass THREE directly
          color: 0x387c44,
          backgroundColor: 0x1e1c1c,
          maxDistance: 34.0,
          // Add any other Vanta options here
          points: 10.00,
          spacing: 15.00
        })
      );
    }

    // Cleanup function: Destroy Vanta effect when component unmounts
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]); // Dependency array ensures this runs only when vantaEffect changes

  // Render the div that Vanta will attach to
  // Apply the className passed as a prop
  return <div ref={vantaRef} className={className} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: -1 }}></div>;
};

export default VantaEffect;
