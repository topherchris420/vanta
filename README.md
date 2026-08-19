# Vanta | Resonant Instrument & Research Explorer

[![Build & Test](https://img.shields.io/badge/tests-44%20passed-brightgreen)](https://github.com/topherchris420/vanta)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-blue)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-13.5.6-black)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A dark, sharp-edged signal instrument and 3D scientific research explorer uniting books, software, art, frequency, music, and declassified archival intelligence as one connected practice.

---

## ✦ Overview

**Vanta** is the personal portfolio, resonant instrument, and research platform of **Christopher Woodyard** ([Vers3Dynamics](https://vers3dynamics.com/) / [R.A.I.N. Lab](https://rainlabteam.vercel.app/)).

The application operates across two interconnected domains:
1. **The Resonant Instrument (`/`)**: A 5-channel tuned audio-visual experience conducting sound, interactive 3D WebGL geometries, and verified project evidence.
2. **The Research Explorer (`/research`)**: An interactive 3D knowledge graph and search engine indexing cross-disciplinary research across Quantum Computing, Cymatics, Biosignal Processing, AI & Neural Interfaces, Acoustics, Nuclear Engineering, and Archival Intelligence & Institutional Oversight.

---

## ✦ Key Features

### 1. Resonant Instrument
- **5 Signal Channels**: Structured sections covering *Books*, *Apps*, *Art*, *Frequency*, and *Music*, each calibrated to dedicated harmonic frequencies (C4, E4, G4, C5, G3).
- **Event Horizon Archive**: Interactive 3D hero stage featuring a black hole spacetime lattice, Keplerian accretion platter, and swappable containment shell models.
- **Frequency Rail**: Keyboard-tunable (`Arrow`, `Home`, `End`) navigation rail with real-time preview states and scroll-depth tracking.
- **Signal Console**: Live readout reporting active channel frequencies and Web Audio synthesizer state (`Sound off`, `Sound on`, `Sound unavailable`).
- **Adaptive Performance & A11y**: Continuous 60fps WebGL on capable desktops, single-frame static geometry rendering for mobile and `prefers-reduced-motion`, high-contrast styling, and full keyboard navigation.

### 2. Scientific & Archival Research Explorer
- **Interactive 3D Knowledge Graph**: Three.js force-directed network graph mapping documents, concepts, technologies, agencies, hearings, and policy shifts with provenance badges (*Source Verified*, *Local Index*, *Inferred Relation*, *Declassified Record*).
- **Archival Oversight & Multi-Decade Intelligence**: Analyzes declassified historical memorandums, correlates agency logs (AEC, CIA, NSA, DARPA, DoD) with congressional inquiries (Church Committee, Joint Senate Hearings), and maps policy shifts across administrative eras (Cold War, Church Committee Era, Post-Cold War, Modern Oversight).
- **Multi-Discipline Search Engine**: Sub-millisecond TF-IDF search, fuzzy typo tolerance, autocomplete suggestions, era filters, and domain filtering across 7 core research areas.
- **Dynamic Ingestion Pipeline**: Automated CLI pipeline ([`scripts/syncResearch.js`](scripts/syncResearch.js)) fetching and normalizing papers from **arXiv** and **OpenAlex** APIs.

---

## ✦ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 13 (Pages Router, Static Export configured)
- **3D & Graphics**: [Three.js](https://threejs.org/), [Vanta.js](https://www.vantajs.com/), Custom WebGL Shaders
- **Styling**: CSS Modules, Syne (display face), Space Grotesk (body), Monospace system stack
- **Audio**: Web Audio API (custom oscillator synthesizer with smooth release curves)
- **Testing**: Native Node.js Test Runner (`node --test`)

---

## ✦ Getting Started

### Prerequisites
- Node.js `>= 16.0.0`
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/topherchris420/vanta.git
cd vanta

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Testing & Building

### Running Tests
The project features a comprehensive test suite of 43 unit, contract, layout, and live HTTP integration tests:

```bash
npm test
```

### Production Build & Export
Generates an optimized static production export in `out/`:

```bash
npm run build
```

---

## ✦ Deployment

Vanta is configured for zero-configuration static export (`output: 'export'`), ready for deployment to decentralized networks (e.g. **Dappling Network**), **Vercel**, **GitHub Pages**, or **AWS S3/CloudFront**.

```bash
# Build & export command for hosting providers
npx next build && npx next export
```

---

## ✦ Scientific Ingestion Pipeline

To fetch the latest research papers from arXiv and OpenAlex and update the curated knowledge graph:

```bash
npm run sync:research
```

---

## ✦ Contact & Destinations

- **Author**: Christopher Woodyard
- **Email**: [christopher@vers3dynamics.com](mailto:christopher@vers3dynamics.com)
- **Organization**: [Vers3Dynamics](https://vers3dynamics.com/) / [R.A.I.N. Lab](https://rainlabteam.vercel.app/)
- **Live Deployment**: [mitpress.vercel.app](https://mitpress.vercel.app/)
- **Decentralized Network**: [woodyard.dappling.network](https://woodyard.dappling.network)
- **Publications & Preprints**: [SSRN Author Page](https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976) | [Hugging Face](https://huggingface.co/ciaochris) | [Bandcamp](https://chriswoodyard.bandcamp.com/)
