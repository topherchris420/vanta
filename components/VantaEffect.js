import { useState, useEffect, useRef } from 'react';
import NET from 'vanta/dist/vanta.net.min.js'; // Make sure path is correct
import * as THREE from 'three';

const VantaEffect = ({ className }) => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    let currentVantaEffect = null; // Use a local variable for the effect instance

    // Ensure this code runs only on the client
    if (!vantaEffect && vantaRef.current) { // Check state, but initialize based on ref
      currentVantaEffect = NET({ // Initialize effect directly
        el: vantaRef.current,
        THREE: THREE,
        color: 0x387c44,
        backgroundColor: 0x1e1c1c,
        maxDistance: 34.0,
        points: 10.00,
        spacing: 15.00,
        debug: false,
        showDots: false,
        verbosity: 0
      });
      setVantaEffect(currentVantaEffect); // Set the state AFTER initialization
    }

    // Cleanup function: Use the local variable 'currentVantaEffect'
    // Or better yet, use the state variable 'vantaEffect' which should be set by now
    return () => {
      // Check the state variable when cleaning up
      if (vantaEffect) {
        vantaEffect.destroy();
        setVantaEffect(null); // Optionally reset state on cleanup
      }
      // Or if relying solely on the local variable approach (less common with state):
      // if (currentVantaEffect) {
      //   currentVantaEffect.destroy();
      // }
    };
  // Dependency array: Only run when vantaRef.current is available,
  // and clean up when vantaEffect changes (or component unmounts)
  }, [vantaRef.current, vantaEffect]); // Adjust dependencies if needed

  // Render the div that Vanta will attach to
  // Apply the className passed as a prop
  return <div ref={vantaRef} className={className} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: -1 }}></div>;
};

export default VantaEffect;
