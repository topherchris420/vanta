import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the VantaEffect component
const VantaEffectNoSSR = dynamic(
  () => import('../components/VantaEffect'),
  { ssr: false }
);

// Dynamically import a new AudioPlayer component
const AudioPlayerNoSSR = dynamic(
  () => import('../components/AudioPlayer'),
  { ssr: false }
);

export default function Home() {
  const [activeSection, setActiveSection] = useState('intro');
  const [isLoaded, setIsLoaded] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  
  // Simple animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Function to handle section navigation
  const navigateToSection = (section) => {
    setActiveSection(section);
    // Smooth scroll to section
    document.getElementById(section).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Exploring the intersection of art, technology, and philosophy with Christopher, founder of Vers3Dynamics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      </Head>

      {/* Interactive background with controls */}
      <VantaEffectNoSSR className={styles.background} />
      
      {/* Background controls */}
      <div className={`${styles.backgroundControls} ${isLoaded ? styles.fadeIn : ''}`}>
        <button onClick={() => document.dispatchEvent(new CustomEvent('changeVantaEffect'))}>
          Change Effect
        </button>
      </div>

      {/* Audio player for background music */}
      <AudioPlayerNoSSR 
        isPlaying={musicPlaying} 
        togglePlay={() => setMusicPlaying(!musicPlaying)} 
      />

      {/* Main content */}
      <main className={`${styles.main} ${isLoaded ? styles.fadeIn : ''}`}>
        {/* Navigation */}
        <nav className={styles.navigation}>
          <ul>
            <li className={activeSection === 'intro' ? styles.active : ''}>
              <button onClick={() => navigateToSection('intro')}>Intro</button>
            </li>
            <li className={activeSection === 'projects' ? styles.active : ''}>
              <button onClick={() => navigateToSection('projects')}>Projects</button>
            </li>
            <li className={activeSection === 'gallery' ? styles.active : ''}>
              <button onClick={() => navigateToSection('gallery')}>Gallery</button>
            </li>
            <li className={activeSection === 'contact' ? styles.active : ''}>
              <button onClick={() => navigateToSection('contact')}>Contact</button>
            </li>
          </ul>
        </nav>

        {/* Intro Section */}
        <section id="intro" className={`${styles.header} ${activeSection === 'intro' ? styles.activeSection : ''}`}>
          <div className={styles.introContent}>
            <h1 className={styles.title}>
              <span className={styles.specialText}>𝚑𝚒, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://90s.myretrotvs.com/#7XBcT41ImSI" className={styles.link} target="_blank" rel="noopener noreferrer">𝓒𝓱𝓻𝓲𝓼𝓽𝓸𝓹𝓱𝓮𝓻</a>.</span>
            </h1>
            
            <div className={styles.biography}>
              <p className={styles.bio}>
                <span className={styles.specialText}>𝙰Ω 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚏𝚘𝚞𝚗𝚍𝚎𝚛 𝚘𝚏 </span>
                <a href="https://vers3dynamics.io/" className={styles.link} target="_blank" rel="noopener noreferrer">versᗱdynamics</a>
                <span className={styles.specialText}> 𝚊𝚗𝚍 </span>
                <a href="https://woodyard.dappling.network/" className={styles.link} target="_blank" rel="noopener noreferrer">𝓼𝓸𝓵𝓾𝓽𝓲𝓸𝓷𝓼 𝓪𝓻𝓬𝓱𝓲𝓽𝓮𝓬𝓽</a>
              </p>
            </div>
            
            <div className={styles.scrollPrompt}>
              <span>Scroll to explore</span>
              <div className={styles.scrollArrow}>↓</div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className={`${styles.projects} ${activeSection === 'projects' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Projects</h2>
          
          <div className={styles.projectGrid}>
            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Book</h3>
                <p className={styles.projectDesc}>
                  <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/" className={styles.link} target="_blank" rel="noopener noreferrer">𝓛𝓲𝓯𝓮 𝓸𝓯 𝓪 𝓛𝓲𝓷𝓮</a>
                  <span className={styles.specialText}> — A poetic adventure </span>
                </p>
                <div className={styles.projectActions}>
                  <a href="https://drive.google.com/file/d/14aenR92-dfkjolJBhG3iTCI3Ka6-d6sT/view?usp=drivesdk" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    📐 Preview
                  </a>
                  <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    Purchase
                  </a>
                </div>
              </div>
            </div>

            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Art</h3>
                <p className={styles.projectDesc}>
                  <span className={styles.specialText}>Digital fragments in spatial computing</span>
                </p>
                <div className={styles.projectActions}>
                  <a href="https://oncyber.io/stanfordgsb" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    3D Gallery
                  </a>
                  <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    🖼️ Collection
                  </a>
                </div>
              </div>
            </div>

            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Music</h3>
                <p className={styles.projectDesc}>
                  <a href="https://chriswoodyard.bandcamp.com/" className={styles.link} target="_blank" rel="noopener noreferrer">𝓐𝓾𝓭𝓲𝓽𝓸𝓻𝔂 𝓖𝓮𝓸𝓶𝓮𝓽𝓻𝔂</a>
                  <span className={styles.specialText}> — Experimental sound project</span>
                </p>
                <div className={styles.projectActions}>
                  <a href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    🎹 Listen
                  </a>
                  <a href="https://chriswoodyard.bandcamp.com/" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    Bandcamp
                  </a>
                </div>
              </div>
            </div>
            
            <div className={`${styles.projectCard} ${styles.hoverEffect}`}>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Health Tech</h3>
                <p className={styles.projectDesc}>
                  <span className={styles.specialText}>Mnemosyne Health - Innovation in digital well-being</span>
                </p>
                <div className={styles.projectActions}>
                  <a href="https://mnemosynehealth.streamlit.app/" className={`${styles.link} ${styles.actionButton}`} target="_blank" rel="noopener noreferrer">
                    🍎 Visit
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className={`${styles.gallery} ${activeSection === 'gallery' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Creative Space</h2>
          
          <div className={styles.galleryContent}>
            <div className={styles.gifContainer}>
              <iframe
                src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY"
                className={styles.giphyEmbed}
                title="Pixel Art Animation"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            
            <div className={styles.quoteContainer}>
              <blockquote className={styles.quote}>
                "At the intersection of mathematics and poetics, there exists a framework for exploring the unknown."
                <cite>— From "Life of a Line"</cite>
              </blockquote>
            </div>
            
            <div className={styles.interactiveElement}>
              <div className={styles.geometricShape}></div>
              <p className={styles.interactionPrompt}>Hover to transform</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className={`${styles.contact} ${activeSection === 'contact' ? styles.activeSection : ''}`}>
          <h2 className={styles.sectionTitle}>Connect</h2>
          
          <div className={styles.contactContent}>
            <div className={styles.contactForm}>
              <p className={styles.contactIntro}>
                <span className={styles.specialText}>Let's collaborate on something extraordinary.</span>
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
                <span className={styles.specialText}>Or email directly: 𝙘𝙞𝙖𝙤_𝙘𝙝𝙧𝙞𝙨@𝙥𝙧𝙤𝙩𝙤𝙣.𝙢𝙚</span>
              </p>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.copyright}>
              <span className={styles.specialText}>© {new Date().getFullYear()} Vers3Dynamics</span>
            </p>
            <div className={styles.socialLinks}>
              <a href="https://twitter.com/" className={styles.socialIcon} target="_blank" rel="noopener noreferrer">𝕏</a>
              <a href="https://linkedin.com/" className={styles.socialIcon} target="_blank" rel="noopener noreferrer">in</a>
              <a href="https://github.com/" className={styles.socialIcon} target="_blank" rel="noopener noreferrer">𝔾</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
