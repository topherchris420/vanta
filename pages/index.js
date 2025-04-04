import Head from "next/head";
import styles from "../styles/Home.module.css";
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import components that require client-side rendering
const VantaEffectNoSSR = dynamic(
  () => import('../components/VantaEffect'),
  { ssr: false }
);

// Dynamically import a cursor trail effect component
const CursorEffectNoSSR = dynamic(
  () => import('../components/CursorEffect'),
  { ssr: false }
);

export default function Home() {
  // State for interactive elements
  const [activeSection, setActiveSection] = useState('biography');
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading state for entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <Head>
        <title>Vers3Dynamics | Christopher</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Personal website of Christopher, founder of Vers3Dynamics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Custom cursor effect */}
      <CursorEffectNoSSR />

      {/* Animated background */}
      <VantaEffectNoSSR className={styles.background} theme={theme} />

      {/* Loading overlay with animation */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingLogo}>V3D</div>
            <div className={styles.loadingBar}></div>
          </div>
        </div>
      )}

      {/* Theme toggle button */}
      <button onClick={toggleTheme} className={styles.themeToggle}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <main className={`${styles.main} ${isLoading ? styles.hidden : styles.visible}`}>
        <section className={`${styles.header} ${styles.animateIn}`}>
          <h1 className={styles.title}>
            <span className={styles.specialText}>𝚑𝚒, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://90s.myretrotvs.com/#7XBcT41ImSI" className={`${styles.link} ${styles.hoverEffect}`}>𝓒𝓱𝓻𝓲𝓼𝓽𝓸𝓹𝓱𝓮𝓻</a>.</span>
          </h1>
        </section>

        {/* Navigation menu */}
        <nav className={styles.navigation}>
          {['biography', 'projects', 'interactive', 'contact'].map((section) => (
            <button 
              key={section}
              className={`${styles.navButton} ${activeSection === section ? styles.active : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>

        {/* Content sections with conditional rendering */}
        {activeSection === 'biography' && (
          <section className={`${styles.biography} ${styles.fadeIn}`}>
            <p className={styles.bio}>
              <span className={styles.specialText}>𝙰Ω 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚏𝚘𝚞𝚗𝚍𝚎𝚛 𝚘𝚏 </span>
              <a href="https://woodyard.streamlit.app/" className={`${styles.link} ${styles.hoverGlow}`}>versᗱdynamics</a>
              <span className={styles.specialText}> 𝚊𝚗𝚍 </span>
              <a href="https://vers3dynamics.io/" className={`${styles.link} ${styles.hoverGlow}`}>𝓼𝓸𝓵𝓾𝓽𝓲𝓸𝓷𝓼 𝓪𝓻𝓬𝓱𝓲𝓽𝓮𝓬𝓽</a>
              <a href="https://mnemosynehealth.streamlit.app/" className={`${styles.link} ${styles.hoverGlow}`}>🍎</a>
            </p>
            <div className={styles.bioBubbles}>
              <div className={`${styles.bubble} ${styles.bubble1}`}>Creative Coder</div>
              <div className={`${styles.bubble} ${styles.bubble2}`}>Digital Artist</div>
              <div className={`${styles.bubble} ${styles.bubble3}`}>Writer</div>
              <div className={`${styles.bubble} ${styles.bubble4}`}>Solutions Architect</div>
            </div>
          </section>
        )}

        {activeSection === 'projects' && (
          <section className={`${styles.projects} ${styles.fadeIn}`}>
            <div className={`${styles.projectCard} ${styles.cardHover}`}>
              <div className={styles.projectIcon}>📚</div>
              <h2 className={styles.projectTitle}>Book</h2>
              <p className={styles.projectDesc}>
                <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/" className={`${styles.link} ${styles.linkReveal}`}>𝓛𝓲𝓯𝓮 𝓸𝓯 𝓪 𝓛𝓲𝓷𝓮</a>
                <span className={styles.specialText}> — A poetic adventure </span>
                <a href="https://drive.google.com/file/d/14aenR92-dfkjolJBhG3iTCI3Ka6-d6sT/view?usp=drivesdk" className={styles.link}>📐</a>
              </p>
              <div className={styles.cardOverlay}></div>
            </div>

            <div className={`${styles.projectCard} ${styles.cardHover}`}>
              <div className={styles.projectIcon}>🎨</div>
              <h2 className={styles.projectTitle}>Digital Art</h2>
              <p className={styles.projectDesc}>
                <a href="https://oncyber.io/stanfordgsb" className={`${styles.link} ${styles.linkReveal}`}>𝓥𝓲𝓮𝔀 𝓱𝓮𝓻𝓮</a>
                <span className={styles.specialText}> for digital fragments in spatial computing </span>
                <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/" className={styles.link}>🖼️</a>
              </p>
              <div className={styles.cardOverlay}></div>
            </div>

            <div className={`${styles.projectCard} ${styles.cardHover}`}>
              <div className={styles.projectIcon}>🎵</div>
              <h2 className={styles.projectTitle}>Music</h2>
              <p className={styles.projectDesc}>
                <a href="https://chriswoodyard.bandcamp.com/" className={`${styles.link} ${styles.linkReveal}`}>𝓐𝓾𝓭𝓲𝓽𝓸𝓻𝔂 𝓖𝓮𝓸𝓶𝓮𝓽𝓻𝔂</a>
                <span className={styles.specialText}> — Experimental sound project </span>
                <a href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk" className={styles.link}>🎹</a>
              </p>
              <div className={styles.cardOverlay}></div>
            </div>
          </section>
        )}

        {activeSection === 'interactive' && (
          <section className={`${styles.interactiveContent} ${styles.fadeIn}`}>
            <div className={styles.interactiveControls}>
              <button className={styles.interactiveButton}>Rotate</button>
              <button className={styles.interactiveButton}>Scale</button>
              <button className={styles.interactiveButton}>Reset</button>
            </div>

            <div className={styles.gifContainer}>
              <iframe
                src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY"
                className={`${styles.giphyEmbed} ${styles.enhancedFrame}`}
                title="Pixel Art Animation"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            
            <div className={styles.audioVisualizer}>
              <div className={styles.vizBar}></div>
              <div className={styles.vizBar}></div>
              <div className={styles.vizBar}></div>
              <div className={styles.vizBar}></div>
              <div className={styles.vizBar}></div>
              <audio 
                className={styles.audioPlayer} 
                controls 
                src="/sample.mp3"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </section>
        )}

        {activeSection === 'contact' && (
          <section className={`${styles.contactSection} ${styles.fadeIn}`}>
            <div className={styles.contactForm}>
              <h2 className={styles.contactTitle}>Get in touch</h2>
              <div className={styles.formGroup}>
                <input type="text" placeholder="Name" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <input type="email" placeholder="Email" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <textarea placeholder="Message" className={styles.formTextarea}></textarea>
              </div>
              <button className={styles.formSubmit}>Send</button>
            </div>
            
            <div className={styles.socialLinks}>
              <a href="#" className={`${styles.socialLink} ${styles.twitter}`}>Twitter</a>
              <a href="#" className={`${styles.socialLink} ${styles.github}`}>GitHub</a>
              <a href="#" className={`${styles.socialLink} ${styles.linkedin}`}>LinkedIn</a>
            </div>
            
            <p className={styles.contact}>
              <span className={styles.specialText}>𝚌𝚘𝚗𝚝𝚊𝚌𝚝 ➡️ 𝙘𝙞𝙖𝙤_𝙘𝙝𝙧𝙞𝙨@𝙥𝙧𝙤𝙩𝙤𝙣.𝙢𝙚</span>
            </p>
          </section>
        )}

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.copyright}>
              <span className={styles.specialText}>© {new Date().getFullYear()} Vers3Dynamics</span>
            </p>
            <div className={styles.footerLinks}>
              <a href="#" className={styles.footerLink}>Privacy</a>
              <a href="#" className={styles.footerLink}>Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
