import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [visible, setVisible] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    name: 'Ambient Atmosphere',
    src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Blue_Dot_Sessions/None_Knew_Day/Blue_Dot_Sessions_-_Glacier_Quartet.mp3'
  });
  
  const audioRef = useRef(null);
  
  // Show player after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  return (
    <div className={`${styles.audioPlayer} ${visible ? styles.visible : ''}`}>
      <audio 
        ref={audioRef} 
        src={currentTrack.src}
        onEnded={() => setIsPlaying(false)}
        loop
      />
      
      <div className={styles.trackInfo}>
        <div className={styles.trackName}>{currentTrack.name}</div>
      </div>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.controlButton} ${styles.playButton}`} 
          onClick={togglePlay}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div className={styles.volumeControl}>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={handleVolumeChange} 
            className={styles.volumeSlider}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
