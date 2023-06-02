import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";

export default function Home() {
  const [vantaEffect, setVantaEffect] = useState(0);
  const vantaRef = useRef(null);
  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE,
          color: 0x306AC0,
          backgroundColor: 0x1e1c1c,
          maxDistance: 34.0,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destory();
    };
  }, [vantaEffect]);
  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics</title>
        <link rel="icon" href="favicon.ico" />
          <script src="fartButton.js"></script>
      </Head>
      <main className={styles.main} ref={vantaRef}></main>
<h1><p>hello, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://my90stv.com/#7XBcT41ImSI">𝓬𝓱𝓻𝓲𝓼</a>.<html> <head> <title>As the sun sprouts feathers and decides to migrate south, the moon, adorned in a sweater of moth-eaten dreams, takes up a daytime job. Meanwhile, the stars, feeling left out, decide to paint stripes on their bodies and impersonate zebras, bringing forth a cosmic zoo where the galaxies are merely cages of our own illusions. Life, the bemused spectator, sips lukewarm chaos from a porcelain cup of sanity, gradually chipping away, and chuckles at the absurdity of existence.</title> </head> <body> <button id="a glitch, a rift, a portal bizarre,Leading to a universe, neither near nor far.a doppelganger, a mirror's jest, stood in that strange space, a scientist, an explorer, with my own face.">👋</button> </body> </html> </p>
<p>𝙰𝚗 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚍𝚎𝚌𝚎𝚗𝚝𝚛𝚊𝚕𝚒𝚣𝚊𝚝𝚒𝚘𝚗 𝚎𝚗𝚝𝚑𝚞𝚜𝚒𝚊𝚜𝚝 𝚊𝚗𝚍 𝚊 𝚋𝚞𝚒𝚕𝚍𝚎𝚛 𝚘𝚏 <a href="https://www.tiktok.com/@investngdoteth/video/7239874788376857899?is_from_webapp=1&sender_device=pc&web_id=7174556852672038446">𝓪𝓲 𝓭𝓮𝓿𝓮𝓵𝓸𝓹𝓶𝓮𝓷𝓽</a>.<a href="https://xn--tq8haaa.eth.co/">🍎</a>.</p>
<p>𝙴𝚡𝚙𝚕𝚘𝚛𝚎 𝚖𝚢 <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/">𝓫𝓸𝓸𝓴</a> "🅻🅸🅵🅴 🅾🅵 🅰 🅻🅸🅽🅴" 𝚝𝚘 𝚎𝚖𝚋𝚊𝚛𝚔 𝚘𝚗 𝚊 <a href="https://www.youtube.com/watch?v=polF7pS0Vuw">𝚙𝚘𝚎𝚝𝚒𝚌</a> 𝚊𝚍𝚟𝚎𝚗𝚝𝚞𝚛𝚎 👨🏿‍💻</p>
<p><a href="https://oncyber.io/stanfordgsb">𝓿𝓮𝓷𝓽𝓾𝓻𝓮 𝓱𝓮𝓻𝓮</a> 𝚝𝚘 𝚟𝚒𝚎𝚠 𝚍𝚒𝚐𝚒𝚝𝚊𝚕 𝚊𝚜𝚜𝚎𝚝𝚜 𝚍𝚒𝚜𝚙𝚕𝚊𝚢𝚎𝚍 𝚒𝚗 𝚒𝚖𝚖𝚎𝚛𝚜𝚒𝚟𝚎 𝚟𝚒𝚛𝚝𝚞𝚊𝚕 𝚜𝚙𝚊𝚌𝚎𝚜🖼️,</p> <p>𝙳𝚒𝚜𝚌𝚘𝚟𝚎𝚛 𝚖𝚢 <a href="https://chriswoodyard.bandcamp.com/">𝓶𝓾𝓼𝓲𝓬</a> 𝚙𝚛𝚘𝚓𝚎𝚌𝚝 𝚘𝚗 𝚋𝚊𝚗𝚍𝚌𝚊𝚖𝚙🎸(𝚊𝚗𝚍 𝚘𝚝𝚑𝚎𝚛 𝚙𝚞𝚋𝚕𝚒𝚜𝚑𝚒𝚗𝚐𝚜📚),</p> <p>𝙴𝚗𝚐𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚊 <a href="https://investng.eth.limo/">𝓰𝓲𝓯</a> 𝚜𝚎𝚊𝚛𝚌𝚑 🎆, & 𝚊𝚗 𝚘𝚙𝚎𝚗 𝚜𝚘𝚞𝚛𝚌𝚎 <a href="https://stanforddaily.eth.limo/">𝔀𝓸𝓻𝓭𝓵𝓮</a> 𝚐𝚊𝚖𝚎 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚏𝚘𝚛 𝚎𝚟𝚎𝚛𝚢𝚘𝚗𝚎 𝚘𝚗 𝙸𝙿𝙵𝚂 🖋,</p>
<p>𝚖𝚊𝚍𝚜𝚐𝚊𝚕𝚕𝚎𝚛𝚢(𝚍𝚘𝚝)𝚊𝚛𝚝 𝚝𝚘 𝚜𝚎𝚎 <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/">𝓪𝓻𝓽𝔀𝓸𝓻𝓴</a> 🎨</p>,<p>& 𝚊 <a href="https://www.newyorker.com/humor/daily-shouts/dear-pepper-writing-vs-drawing-and-low-flying-zippers">𝓷𝓮𝔀 𝔂𝓸𝓻𝓴𝓮𝓻</a> 𝚕𝚎𝚝𝚝𝚎𝚛 𝚛𝚎𝚙𝚕𝚒𝚎𝚍 𝚋𝚢 𝙻𝚒𝚊𝚗𝚊 𝙵𝚒𝚗𝚌𝚔🗞️</p>
<a href="https://mitpress.mit.edu/">3️⃣5️⃣4️⃣6️⃣</a> contact ➡️ ciao_chris@tutanota.com <a href="https://annas-archive.org/">|-0024.𝘦𝘵𝘩🐸29938.𝘦𝘵𝘩|
</a></h1><iframe src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY" width="340" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/pixelart-rain-programming-jnWMCLBfJb7CK4D8iY"></a></p> <a href="https://givebutter.com/h0CJIU">ᵈᵒⁿᵃᵗᵉ ᵃ ᶜᵒᶠᶠᵉᵉ</a>👫👫👫👫.eth</div> 
  );
}
