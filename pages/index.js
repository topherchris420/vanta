import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';
import styles from '../styles/Home.module.css';
import AudioPlayer from '../components/AudioPlayer';

export default function Home() {
  const [activeSection, setActiveSection] = useState('intro');
  const [vantaEffect, setVantaEffect] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [bgEffect, setBgEffect] = useState('birds');
  
  const vantaRef = useRef(null);
  const sections = ['intro', 'projects', 'gallery', 'contact'];
  
  // Initialize Vanta.js background effect
  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        BIRDS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0x0a192f,
          color1: 0x5338ff,
          color2: 0x3b28cc,
          colorMode: "variance",
          birdSize: 1.50,
          wingSpan: 40.00,
          speedLimit: 5.00,
          separation: 80.00,
          alignment: 20.00,
          cohesion: 20.00
        })
      );
    }
    
    // Cleanup
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);
  
  // Handle scroll to set active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Determine which section is currently in view
      const currentSection = sections.find((section, index) => {
        const element = document.getElementById(section);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const offset = window.innerHeight * 0.3;
        
        return rect.top - offset <= 0 && rect.bottom - offset > 0;
      }) || 'intro';
      
      setActiveSection(currentSection);
      
      // Show background controls when scrolled past intro
      if (scrollPosition > window.innerHeight * 0.5) {
        setShowControls(true);
      } else {
        setShowControls(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Set initial active section and show loaded state
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
  };
  
  // Change background effect
  const changeBackground = (effect) => {
    if (vantaEffect) {
      vantaEffect.destroy();
      setVantaEffect(null);
    }
    
    setBgEffect(effect);
    
    // Re-initialize with new effect
    setTimeout(() => {
      if (effect === 'birds') {
        setVantaEffect(
          BIRDS({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0x0a192f,
            color1: 0x5338ff,
            color2: 0x3b28cc,
            colorMode: "variance",
            birdSize: 1.50,
            wingSpan: 40.00,
            speedLimit: 5.00,
            separation: 80.00,
            alignment: 20.00,
            cohesion: 20.00
          })
        );
      } else if (effect === 'waves') {
        // You would need to import WAVES from 'vanta/dist/vanta.waves.min'
        // at the top of your file to use this effect
        /* 
        setVantaEffect(
          WAVES({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x5338ff,
            shininess: 35.00,
            waveHeight: 15.00,
            waveSpeed: 0.75,
            zoom: 0.90
          })
        );
        */
      } else if (effect === 'net') {
        // You would need to import NET from 'vanta/dist/vanta.net.min'
        // at the top of your file to use this effect
        /*
        setVantaEffect(
          NET({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x5338ff,
            backgroundColor: 0x0a192f,
            points: 10.00,
            maxDistance: 20.00,
            spacing: 15.00
          })
        );
        */
      }
    }, 100);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Creative Portfolio</title>
        <meta name="description" content="An interactive creative portfolio showcasing my work" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Background */}
      <div ref={vantaRef} className={styles.background}></div>
      
      {/* Background controls */}
      <div className={`${styles.backgroundControls} ${showControls ? styles.fadeIn : ''}`}>
        <button onClick={() => changeBackground('birds')}>Birds</button>
        <button onClick={() => changeBackground('waves')}>Waves</button>
        <button onClick={() => changeBackground('net')}>Net</button>
      </div>
      
      {/* Navigation */}
      <nav className={styles.navigation}>
        <ul>
          {sections.map((section) => (
            <li key={section} className={activeSection === section ? styles.active : ''}>
              <button onClick={() => scrollToSection(section)}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Main content */}
      <main className={`${styles.main} ${isLoaded ? styles.fadeIn : ''}`}>
        {/* Intro Section */}
        <section id="intro" className={`${styles.header} ${activeSection === 'intro' ? styles.activeSection : ''}`}>
          <div className={styles.introContent}>
            <h1 className={styles.title}>Creative Expression Through Digital Medium</h1>
            <div className={styles.biography}>
              <p className={styles.bio}>
                Hi, I'm an interdisciplinary artist and creative technologist exploring the intersection of code, design, and interactive media. My work examines how digital experiences can evoke emotional responses and create meaningful connections.
              </p>
            </div>
            <div className={styles.scrollPrompt}>
              <p>Scroll to explore</p>
              <div className={styles.scrollArrow}>↓</div>
            </div>
          </div>
        </section>
        
        {/* Projects Section */}
        <section id="projects" className={`${styles.projects} ${activeSection === 'projects' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Featured Projects</h2>
          <div className={styles.projectGrid}>
            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Sonic Landscapes</h3>
                <p className={styles.projectDesc}>
                  An interactive audio-visual installation that transforms environmental data into immersive soundscapes, creating a unique sensory experience.
                </p>
                <div className={styles.projectActions}>
                  <a href="#" className={styles.actionButton}>View Project</a>
                  <a href="#" className={styles.actionButton}>Listen</a>
                </div>
              </div>
            </div>
            
            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Digital Memories</h3>
                <p className={styles.projectDesc}>
                  A web-based experience that explores how our digital footprints create fragmented narratives of our lives, blending reality and virtual existence.
                </p>
                <div className={styles.projectActions}>
                  <a href="#" className={styles.actionButton}>Experience</a>
                </div>
              </div>
            </div>
            
            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Algorithmic Poetry</h3>
                <p className={styles.projectDesc}>
                  A generative text project that uses machine learning to create evolving poems that respond to user input and emotional cues.
                </p>
                <div className={styles.projectActions}>
                  <a href="#" className={styles.actionButton}>Generate Poem</a>
                  <a href="#" className={styles.actionButton}>Learn More</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Gallery Section */}
        <section id="gallery" className={`${styles.gallery} ${activeSection === 'gallery' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Visual Experiments</h2>
          <div className={styles.galleryContent}>
            <div className={styles.gifContainer}>
              <iframe src="https://giphy.com/embed/l0HlEMf3CdWiETeGk" className={styles.giphyEmbed} frameBorder="0" allowFullScreen></iframe>
            </div>
            
            <div className={styles.quoteContainer}>
              <p className={styles.quote}>
                "The role of the artist is to make the revolution irresistible."
                <cite>— Toni Cade Bambara</cite>
              </p>
            </div>
            
            <div className={styles.interactiveElement}>
              <div className={styles.geometricShape}></div>
              <p className={styles.interactionPrompt}>Hover to transform</p>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section id="contact" className={`${styles.contact} ${activeSection === 'contact' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Let's Connect</h2>
          <div className={styles.contactContent}>
            <p className={styles.contactIntro}>
              I'm always open to collaboration and new opportunities. Feel free to reach out if you'd like to discuss a project or just say hello.
            </p>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <input type="text" placeholder="Your Name" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <input type="email" placeholder="Your Email" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <textarea placeholder="Your Message" className={styles.formTextarea}></textarea>
              </div>
              <button type="submit" className={styles.formButton}>Send Message</button>
            </form>
            <p className={styles.contactEmail}>
              Or email me directly: <span className={styles.specialText}>hello@creativeperson.com</span>
            </p>
          </div>
        </section>
        
        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.copyright}>© 2025 Creative Portfolio. All rights reserved.</p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialIcon}>Twitter</a>
              <a href="#" className={styles.socialIcon}>Instagram</a>
              <a href="#" className={styles.socialIcon}>GitHub</a>
            </div>
          </div>
        </footer>
      </main>
      
      {/* Audio Player */}
      <AudioPlayer />
    </div>
  );
}
