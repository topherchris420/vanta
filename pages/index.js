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
          color: 0x387C44,
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
<h1><p> 𝚑𝚎𝚕𝚕𝚘, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://my90stv.com/#7XBcT41ImSI">𝓬𝓱𝓻𝓲𝓼</a>.<html> <head> <title>the absurdity and beauty of existence.</title> </head> <body> <button id="hi this is chris just reminding you that in a curious mind, small questions grow into big ideas. always reach for the sky of knowledge.">👋🏾</button> </body> </html> </p>
<p>𝙰𝚗 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚊 𝚕𝚘𝚟𝚎𝚛 𝚘𝚏 𝚍𝚎𝚌𝚎𝚗𝚝𝚛𝚊𝚕𝚒𝚣𝚎𝚍 𝚌𝚑𝚊𝚛𝚒𝚝𝚒𝚎𝚜 𝚊𝚗𝚍 𝚊𝚗 <a href="https://www.tiktok.com/@ciao_chris69/video/7239874788376857899?is_from_webapp=1&sender_device=pc&web_id=7174556852672038446">𝓪𝓲 𝓮𝓷𝓽𝓱𝓾𝓼𝓲𝓪𝓼𝓽</a><a href="https://xn--tq8haaa.eth.co/">🍎</a>.</p>
<p><a href="https://drive.google.com/file/d/1fgfPS3ABM1o5uO15VyknNWb0eDelj810/view?usp=drivesdk">𝙴𝚡𝚙𝚕𝚘𝚛𝚎</a> 𝚖𝚢 <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/">𝓫𝓸𝓸𝓴</a> "🅻🅸🅵🅴 🅾🅵 🅰 🅻🅸🅽🅴" 𝚝𝚘 𝚎𝚖𝚋𝚊𝚛𝚔 𝚘𝚗 𝚊 <a href="https://drive.google.com/file/d/1onye8f0LnLEvx8olOa-p3xxgbq5jtoAd/view?usp=drivesdk">𝚙𝚘𝚎𝚝𝚒𝚌</a> 𝚊𝚍𝚟𝚎𝚗𝚝𝚞𝚛𝚎 👨🏿‍💻</p>
<p><a href="https://oncyber.io/3546">𝓥𝓮𝓷𝓽𝓾𝓻𝓮 𝓱𝓮𝓻𝓮</a> 𝚝𝚘 <a href="https://drive.google.com/file/d/1RfuFQSuESon_rFLjeDG3tdU_iOy8fAkB/view?usp=drive_link">𝚟𝚒𝚎𝚠</a> 𝚍𝚒𝚐𝚒𝚝𝚊𝚕 𝚏𝚛𝚊𝚐𝚖𝚎𝚗𝚝𝚜 𝚍𝚒𝚜𝚙𝚕𝚊𝚢𝚎𝚍 <a href="https://drive.google.com/file/d/1_2b5mf3MpS7ddWx_5oLks-5V4pmK7In2/view?usp=sharing">𝚒𝚗</a> 𝚒𝚖𝚖𝚎𝚛𝚜𝚒𝚟𝚎 𝚟𝚒𝚛𝚝𝚞𝚊𝚕 𝚜𝚙𝚊𝚌𝚎𝚜🖼️,</p> <p>𝙳𝚒𝚜𝚌𝚘𝚟𝚎𝚛 𝚖𝚢 <a href="https://chriswoodyard.bandcamp.com/">𝓶𝓾𝓼𝓲𝓬</a> 𝚙𝚛𝚘𝚓𝚎𝚌𝚝 𝚘𝚗 𝚋𝚊𝚗𝚍𝚌𝚊𝚖𝚙🎸(𝚊𝚗𝚍 𝚘𝚝𝚑𝚎𝚛 𝚙𝚞𝚋𝚕𝚒𝚜𝚑𝚒𝚗𝚐𝚜📚),</p> <p>𝙴𝚗𝚐𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚊 <a href="https://investng.eth.limo/">𝓰𝓲𝓯</a> 𝚜𝚎𝚊𝚛𝚌𝚑 🎆, & 𝚊𝚗 𝚘𝚙𝚎𝚗 𝚜𝚘𝚞𝚛𝚌𝚎 <a href="https://stanforddaily.eth.limo/">𝔀𝓸𝓻𝓭𝓵𝓮</a> 𝚐𝚊𝚖𝚎 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚏𝚘𝚛 <a href="https://www.sciencedirect.com/science/article/abs/pii/S1053535799800791">𝚎𝚟𝚎𝚛𝚢𝚘𝚗𝚎</a> 𝚘𝚗 𝙸𝙿𝙵𝚂 🖋,</p>
<p>𝙼𝚊𝚍𝚜 𝙶𝚊𝚕𝚕𝚎𝚛𝚢 𝚝𝚘 𝚜𝚎𝚎 <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/">𝓪𝓻𝓽𝔀𝓸𝓻𝓴</a> 🎨</p>,<p>& 𝚊 <a href="https://www.newyorker.com/humor/daily-shouts/dear-pepper-writing-vs-drawing-and-low-flying-zippers">𝓷𝓮𝔀 𝔂𝓸𝓻𝓴𝓮𝓻</a> 𝚕𝚎𝚝𝚝𝚎𝚛 𝚛𝚎𝚙𝚕𝚒𝚎𝚍 𝚋𝚢 𝙻𝚒𝚊𝚗𝚊 𝙵𝚒𝚗𝚌𝚔🗞️</p>
<a href="https://mitpress.mit.edu/">3️⃣5️⃣4️⃣6️⃣</a> contact ➡️ ciao_chris@tutanota.com <a href="https://annas-archive.org/">|-0024.𝘦𝘵𝘩🐃29938.𝘦𝘵𝘩|
</a></h1><iframe src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY" width="340" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/pixelart-rain-programming-jnWMCLBfJb7CK4D8iY"></a></p> <a href="https://givebutter.com/h0CJIU">ᵈᵒⁿᵃᵗᵉ ᵃ ᶜᵒᶠᶠᵉᵉ</a> we1com3 to woodyard.e7h</div> 
  );
}
