# Vanta | Resonant Instrument & Research Explorer

[![Build & Test](https://img.shields.io/badge/tests-45%20passed-brightgreen)](https://github.com/topherchris420/vanta)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-blue)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-13.5.6-black)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A dark, sharp-edged signal instrument and 3D scientific research explorer uniting books, software, art, frequency, music, open neuroscience datasets, and declassified archival intelligence as one connected practice.

---

## ✦ Overview

**Vanta** is the personal portfolio, resonant instrument, and research platform of **Christopher Woodyard** ([Vers3Dynamics](https://vers3dynamics.com/) / [R.A.I.N. Lab](https://rainlabteam.vercel.app/)).

The application operates across two interconnected domains:
1. **The Resonant Instrument (`/`)**: A 5-channel tuned audio-visual experience conducting sound, interactive 3D WebGL geometries, and verified project evidence.
2. **The Research Explorer (`/research`)**: An interactive 3D knowledge graph and hybrid search engine indexing cross-disciplinary research across Quantum Computing, Cymatics, Biosignal Processing, AI & Neural Interfaces, Neuroscience & Neural Datasets, Acoustics, Nuclear Engineering, and Archival Intelligence & Institutional Oversight.

---

## ✦ Key Features

### 1. Resonant Instrument
- **5 Signal Channels**: Structured sections covering *Books*, *Apps*, *Art*, *Frequency*, and *Music*, each calibrated to dedicated harmonic frequencies (C4, E4, G4, C5, G3).
- **Event Horizon Archive**: Interactive 3D hero stage featuring a black hole spacetime lattice, Keplerian accretion platter, and swappable containment shell models.
- **Frequency Rail**: Keyboard-tunable (`Arrow`, `Home`, `End`) navigation rail with real-time preview states and scroll-depth tracking.
- **Signal Console**: Live readout reporting active channel frequencies and Web Audio synthesizer state (`Sound off`, `Sound on`, `Sound unavailable`).
- **Adaptive Performance & A11y**: Continuous 60fps WebGL on capable desktops, single-frame static geometry rendering for mobile and `prefers-reduced-motion`, high-contrast styling, and full keyboard navigation.

### 2. Scientific & Archival Research Explorer
- **Interactive 3D Knowledge Graph**: Three.js force-directed network graph mapping 67 structured publications & datasets into 440+ connected nodes and 610+ relational edges with provenance badges (*Source Verified*, *Local Index*, *Inferred Relation*, *Declassified Record*, *Dataset Atlas*).
- **Neuro2 Open Neuroscience Dataset Atlas**: Deep integration with the [Neuro2 Open Science Catalog](https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets), indexing high-density 128-channel EEG/BCI recordings, Sleep-EDF polysomnography, Neuropixels electrophysiology, 306-channel MEG, 3T fMRI, wearable fNIRS, and vibroacoustic entrainment data.
- **Ecosystem & Simulation Artifacts**:
  - [**CIRCLE Biosignal Platform**](https://github.com/topherchris420/circle): Open-source multimodal EDA, raw PPG, and IMU hardware architecture with 5 kVrms laboratory isolation.
  - [**Lop Nur Geospatial Digital Twin**](https://github.com/topherchris420/lop-nur-twin): 3D GEOINT/OSINT analytical digital twin testbed with derived evidence registers and uncertainty envelopes.
  - [**IONS-X Deep Emergence Lab**](https://github.com/topherchris420/ions-x-deep-emergence-lab): GPU-optional multi-agent simulation sandbox modeling coupled dynamical fields and emergent graph reconstruction.
  - [**R.A.I.N. DataMatrix Engine (Anna)**](https://github.com/topherchris420/anna): Air-gapped technical knowledge infrastructure with hybrid BM25 + dense-vector kNN retrieval.
  - [**R.A.I.N. Lab & TRIBE v2**](https://github.com/topherchris420/james_library): Autonomous multi-agent scientific deliberation runtime and fMRI cortical response prediction engine.
  - [**Orpheus Tactical Protocol**](https://github.com/topherchris420/orpheus-resonance-protocol): Command-and-control dashboard with cognitive workload monitoring.
  - [**Waveform Shift Quantum**](https://github.com/topherchris420/waveform-shift-quantum): Computational framework for reproducible physical resonance models.
- **Hybrid Search & Reciprocal Rank Fusion (RRF)**: Sub-millisecond multi-field scoring (title: 0.4, abstract: 0.3, entities: 0.2, tags: 0.1, authors: 0.15), typo-tolerant fuzzy matching, autocomplete suggestions, and RRF rank fusion across 8 core disciplines.
- **Archival Oversight & Multi-Decade Intelligence**: Analyzes declassified historical memorandums, correlates agency logs (AEC, CIA, NSA, DARPA, DoD) with congressional inquiries (Church Committee, Joint Senate Hearings), and maps policy shifts across administrative eras (Cold War, Church Committee Era, Post-Cold War, Modern Oversight).
- **Dynamic Ingestion Pipelines**: Automated CLI ingestion pipelines ([`scripts/syncResearch.js`](scripts/syncResearch.js) and [`scripts/ingestNeuro2.js`](scripts/ingestNeuro2.js)) for arXiv, OpenAlex, SSRN, and Neuro2/Hugging Face corpora.

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
The project features a comprehensive test suite of 45 unit, contract, layout, and live HTTP integration tests:

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

## ✦ Research Ingestion Pipelines

To fetch the latest research papers from arXiv and OpenAlex and update the curated knowledge graph:

```bash
npm run sync:research
```

To re-ingest and validate curated datasets from the Neuro2 Open Science Atlas:

```bash
npm run ingest:neuro2
```

---

## ✦ Contact & Destinations

- **Author**: Christopher Woodyard
- **Email**: [christopher@vers3dynamics.com](mailto:christopher@vers3dynamics.com)
- **Organization**: [Vers3Dynamics](https://vers3dynamics.com/) / [R.A.I.N. Lab](https://rainlabteam.vercel.app/)
- **Live Deployment**: [mitpress.vercel.app](https://mitpress.vercel.app/)
- **Decentralized Network**: [woodyard.dappling.network](https://woodyard.dappling.network)
- **Publications & Preprints**: [SSRN Author Page](https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=7684976) | [Hugging Face](https://huggingface.co/ciaochris) | [Bandcamp](https://chriswoodyard.bandcamp.com/)
