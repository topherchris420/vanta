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
      </Head>
      <main className={styles.main} ref={vantaRef}></main>
<h1><p> 𝚑𝚒, 𝚖𝚢 𝚗𝚊𝚖𝚎 𝚒𝚜 <a href="https://my90stv.com/#7XBcT41ImSI">𝓬𝓱𝓻𝓲𝓼𝓽𝓸𝓹𝓱𝓮𝓻</a>.<html> <head> <title>In the enlightened era of Satya Yuga𓂀369, the universe reveals itself as a multidimensional fractal, a cosmic joy interwoven with the wisdom of error-correcting codes. This infinite fractal echoes itself in a harmonious dance of reflections, each facet imbued with consciousness. Every moment in time holds deep meaning when we explore the intricate patterns within this radiant, meticulously crafted matrix.𓋹</title> </head> <body> <button id="hi this is chris again just reminding you that in the realm of an inquisitive mind, even the smallest questions can blossom into groundbreaking ideas. Embrace the dance of opposites as your teachers, for they reveal the intricate web of our reality. As you venture deeper, you'll find that local realism falls short, and the quantum world whispers secrets of hermeticism. Double the cube and witness the hidden geometry of gravity, for the apparent duality we perceive is but an illusion. & underneath it all, there is only oneness. Explore, question, and let your mind wander, for it is in the quiet contemplation of these mysteries that we discover our true potential, e pluribus unum|озеро Восток🥼bethesda,md https://www.biblegateway.com/passage/?search=Exodus+37&version=NLT">👋🏾</button> </body> </html> </p>
<p>// Globals
let inp = null; // input
let scr = null; // screen
let aud = null; // audio

const player = {
	x: 90,
	y: 30,
	speed: 0.5,
	isWalking: false,
	flip: 0,
	framesSinceWalkStart: 0
}

const mushrooms = [
	{  
		x: 36,
		y: 30,
		wasGrabbed: false
	},
	{  
		x: 130,
		y: 70,
		wasGrabbed: false
	}
];

let numberOfGrabbedMushrooms = 0;

let randomColor = 1;

// initialization
engine.onInit = () => {
	inp = engine.input;
	scr = engine.screen;
	aud = engine.audio;
	
	updateColors();
};


// update loop
engine.onUpdate = () => {
  scr.clear( 1 );

	scr.drawMap(
	  0,      // originX on map
	  0,      // originY on map
	  -1,     // width
	  -1,     // height
	  0,      // screenX
	  0,      // screenY
	  0       // tilemap index
	);
	
	drawMushrooms();
	
	updatePlayer();
	
	let textMainColor = 2;
	if ( numberOfGrabbedMushrooms > 0 ) {
		textMainColor = randomColor;
	}
	
	let textPositionOffset = 0;
	if ( numberOfGrabbedMushrooms > 1 ) {
		textPositionOffset = Math.sin( engine.realTimeSinceGameStart * 10 ) * 8;
	}
	
	scr.drawText(
		'Welcome to Vers3Dynamics!',
		50,
		90 + Math.floor( textPositionOffset ),
		textMainColor,
		1,
		0
	);
};

function drawMushrooms() {
	mushrooms.forEach( mushroom => {
		if ( !mushroom.wasGrabbed ) {
			scr.drawTile(
				61,
				mushroom.x - 8, // center on the position
				mushroom.y - 8, // center on the position
				0
			);
		}
	} );
}

function updatePlayer() {
	let newX = player.x;
	let newY = player.y;
	
	let isWalking = false;
	if ( inp.left.pressed ) {
		newX -= player.speed;
		isWalking = true;
		player.flip = 1;
	}
	else if ( inp.right.pressed ) {
		newX += player.speed;
		isWalking = true;
		player.flip = 0;
	}
	
	if ( inp.down.pressed ) {
		newY -= player.speed;
		isWalking = true;
	}
	else if ( inp.up.pressed ) {
		newY += player.speed;
		isWalking = true;
	}
	
	if ( isWalking ) {
		player.framesSinceWalkStart += 1;
	}
	
	// play or stop audio
	if ( isWalking && !player.isWalking ) {
		// started walking
		player.framesSinceWalkStart = 0;
		
		let note = bitmelo.Notes.C4;
		if ( numberOfGrabbedMushrooms > 1 ) {
			note = bitmelo.Notes.C2;
		}
		else if ( numberOfGrabbedMushrooms > 0 ) {
			note = bitmelo.Notes.C3;
		}
		
		aud.playInfiniteSound(
			0,
			note,
			0.5,
			2
		);
	}
	else if ( !isWalking && player.isWalking ) {
		// stopped walking
		aud.stopInfiniteSound( 0 );
	}
	
	player.isWalking = isWalking;
	
	// make sure we are not colliding with the fence
	if ( 
		newX >= 16
		&& newX < scr.width - 16
		&& newY >= 24
		&& newY < scr.height - 16
	) {
		player.x = newX;
		player.y = newY;
	}
	
	// check mushroom collisions
	for ( let i = 0; i < mushrooms.length; i += 1 ) {
		const mushroom = mushrooms[i];
		if ( !mushroom.wasGrabbed ) {
			const deltaX = Math.abs( player.x - mushroom.x );
			const deltaY= Math.abs( player.y - mushroom.y );
			const distance = Math.sqrt( deltaX * deltaX + deltaY * deltaY );
			
			// player has grabbed a mushroom
			if ( distance <= 12 ) {
				mushroom.wasGrabbed = true;
				numberOfGrabbedMushrooms += 1;
				
				aud.playSound(
					1,
					bitmelo.Notes.E3,
					48,
					0.25,
					1
				);
			}
		}
	}
	
	// draw the player
	let frameGID = 1;
	if ( player.isWalking ) {
		if ( player.framesSinceWalkStart % 16 < 8 ) {
			frameGID = 2;
		}
		else {
			frameGID = 3;
		}
	}
	
	scr.drawTile(
		frameGID,
		Math.floor( player.x ) - 8, // center the tile on the position
		Math.floor( player.y ) - 8, // center the tile on the position
		player.flip
	);
}

function updateColors() {
	randomColor = Math.floor( Math.random() * 16 ) + 1;
	setTimeout( updateColors, 100 );
}
𝙰Ω 𝚊𝚟𝚒𝚍 𝚠𝚛𝚒𝚝𝚎𝚛, 𝚏𝚘𝚞𝚗𝚍𝚎𝚛 𝚘𝚏 𝚟𝚎𝚛𝚜ᗱ𝚍𝚢𝚗𝚊𝚖𝚒𝚌𝚜 𝚊𝚗𝚍 <a href="https://woodyard.eth.limo/">𝓹2𝓹 𝓷𝓮𝓽𝔀𝓸𝓻𝓴 𝓮𝓷𝓰𝓲𝓷𝓮𝓮𝓻</a><a href="https://woodyard.eth.co/">🍎</a></p>
<p><a href="https://drive.google.com/file/d/1BHATob1FpJaFsNl2IekKSrzhtV0rELKN/view?usp=drivesdk">𝙴𝚡𝚙𝚕𝚘𝚛𝚎</a> 𝚖𝚢 <a href="https://bookstore.dorrancepublishing.com/life-of-a-line/">𝓫𝓸𝓸𝓴</a> "🅻🅸🅵🅴 🅾🅵 🅰 🅻🅸🅽🅴" 𝚝𝚘 𝚎𝚖𝚋𝚊𝚛𝚔 𝚘𝚗 𝚊 <a href="https://drive.google.com/file/d/1onye8f0LnLEvx8olOa-p3xxgbq5jtoAd/view?usp=drivesdk">𝚙𝚘𝚎𝚝𝚒𝚌</a> 𝚊𝚍𝚟𝚎𝚗𝚝𝚞𝚛𝚎 <a href="http://gnosis.org/naghamm/nhl.html">📐</a></p>
<p><a href="https://oncyber.io/stanfordgsb">𝓥𝓲𝓮𝔀 𝓱𝓮𝓻𝓮</a> 𝚝𝚘 <a href="https://drive.google.com/file/d/18lmMGR1HNrSoOntmzaI8ll-EWpUFeNyA/view?usp=drivesdk">𝚜𝚎𝚎</a> 𝚍𝚒𝚐𝚒𝚝𝚊𝚕 𝚏𝚛𝚊𝚐𝚖<a href="https://www.geo.umass.edu/faculty/wclement/Human_rules.html">ᴇɴ</a>𝚝𝚜 𝚍𝚒𝚜𝚙𝚕𝚊𝚢𝚎𝚍 <a href="https://books.google.com/books/about/The_Gospel_of_the_Holy_Twelve.html?id=94YRAQAAIAAJ&printsec=frontcover&source=kp_read_button&hl=en&newbks=1&newbks_redir=0&gboemv=1&ovdme=1#v=onepage&q&f=false">𝚒𝚗</a> 𝚜𝚙𝚊𝚌𝚒𝚊𝚕 𝚌𝚘𝚖𝚙𝚞𝚝𝚒𝚗𝚐 𝚜𝚙𝚊𝚌𝚎𝚜🖼️ </p> <p>𝙳𝚒𝚜𝚌𝚘𝚟𝚎𝚛 𝚖𝚢 <a href="https://chriswoodyard.bandcamp.com/">𝓪𝓾𝓭𝓲𝓽𝓸𝓻𝔂 𝓰𝓮𝓸𝓶𝓮𝓽𝓻𝔂</a> 𝚙𝚛𝚘𝚓𝚎𝚌𝚝🎻<a href="https://drive.google.com/file/d/1PlaDEFBQTRIURd5vC1UPv7QvKUnNluop/view?usp=drivesdk">🎹</a>(𝚊𝚗𝚍 𝚘𝚝𝚑𝚎𝚛 𝚙𝚞𝚋𝚕𝚒𝚜𝚑𝚒𝚗𝚐𝚜📚),</p> <p>𝙴𝚗𝚐𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚊 <a href="https://investng.eth.limo/">𝓰𝓲𝓯</a> 𝚜𝚎𝚊𝚛𝚌𝚑 🎆, & 𝚊𝚗 𝚘𝚙𝚎𝚗 𝚜𝚘𝚞𝚛𝚌<a href="https://drive.google.com/file/d/1fgfPS3ABM1o5uO15VyknNWb0eDelj810/view?usp=drivesdk">𝚎</a> <a href="https://stanforddaily.eth.limo/">𝔀𝓸𝓻𝓭𝓵𝓮</a> 𝚐𝚊𝚖𝚎 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚏𝚘𝚛 <a href="https://www.sciencedirect.com/science/article/abs/pii/S1053535799800791">𝚎𝚟𝚎𝚛𝚢𝚘𝚗𝚎</a> 𝚘𝚗 𝙸𝙿𝙵𝚂 🖋;  
    </p>
<p>𝚅𝚒𝚜𝚒𝚝 𝙼𝚊𝚍𝚜 𝙶𝚊𝚕𝚕𝚎𝚛𝚢 𝚝𝚘 ᴏɴʟʏ 𝚜𝚎𝚎 <a href="https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/">𝓪𝓻𝓽𝔀𝓸𝓻𝓴</a> <a href="https://youtu.be/oCAlbtf94PI?si=HH5LF4HZ_nMdS48x">🎨</a></p>,<p>& 𝚛𝚎𝚊𝚍 𝚊 <a href="https://www.newyorker.com/humor/daily-shouts/dear-pepper-writing-vs-drawing-and-low-flying-zippers">𝓷𝓮𝔀 𝔂𝓸𝓻𝓴𝓮𝓻</a> 𝚕𝚎𝚝𝚝𝚎𝚛 𝚏𝚛𝚘𝚖 𝙻𝚒𝚊𝚗𝚊 𝙵𝚒𝚗𝚌𝚔🗞️</p>
<a href="https://mitpress.mit.edu/">8⇂9˙⇂</a> 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 ➡️ 𝙘𝙞𝙖𝙤_𝙘𝙝𝙧𝙞𝙨@𝙥𝙧𝙤𝙩𝙤𝙣.𝙢𝙚 <a href="https://givebutter.com/h0CJIU">|Iɳ Lαƙ'ҽƈԋ Aʅα K'ιɳ 𓁟|
</a></h1><iframe src="https://giphy.com/embed/jnWMCLBfJb7CK4D8iY" width="340" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/pixelart-rain-programming-jnWMCLBfJb7CK4D8iY"></a></p> <a href="https://pay.vers3dynamics.com/">ᵈᵒⁿᵃᵗᵉ ᵃ ᶜᵒᶠᶠᵉᵉ</a> w31c0mᗱ 70 w00dy4rd.37h  Vers3Dynamics@mail2tor.com</div>
  );
}
