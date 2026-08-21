/**
 * @fileoverview Ingestion script to merge curated neuroscience datasets from
 * Hugging Face (ciaochris/neuro2-neuroscience-datasets) into data/research/curatedKnowledge.json.
 */

const fs = require('fs');
const path = require('path');
const { buildGraphFromDocuments, slugify } = require('../lib/research/graphEngine');
const { normalizeKnowledgeData, validateDocument } = require('../lib/research/types');

const DATA_PATH = path.resolve(__dirname, '../data/research/curatedKnowledge.json');

const NEURO2_DATASETS = [
  {
    id: 'dataset-neuro2-complete-atlas',
    title: 'Neuro2 Open Neuroscience Dataset Atlas & 40,000-Node 3D Knowledge Graph',
    abstract: 'Authoritative snapshot indexing 12,011 open neuroscience datasets and 40,934 multi-layer relational graph nodes across 18 repositories with 5 query-optimized Parquet tables covering >741 million recording seconds (>205,000 hours of neural time-series).',
    date: '2026-08-14',
    authors: [
      'Nataliya Kosmyna',
      'Eugene Hauptmann',
      'Christopher Woodyard',
    ],
    source: 'Neuro2 / Hugging Face',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.57967/hf/2891',
    tags: [
      'Neuroscience & Neural Datasets',
      'AI & Neural Interfaces',
      'Biosignal Processing',
      'Knowledge Graph',
    ],
    entities: [
      'Neuro2 Atlas',
      '3D Knowledge Graph',
      'OpenNeuro',
      'DANDI Archive',
      'Parquet Table',
      'Electroencephalography',
    ],
  },
  {
    id: 'dataset-openneuro-ds003838',
    title: 'High-Density 128-Channel EEG & Auditory Evoked Potentials in BCI Paradigms',
    abstract: 'BIDS-standardized high-density 128-channel EEG dataset tracking P300 and auditory steady-state response (ASSR) waveforms across 48 participants. Provides microsecond-precision event markers for neural decoding, feature extraction, and auditory BCI classifiers.',
    date: '2026-01-20',
    authors: [
      'Nataliya Kosmyna',
      'Neuro2 Open Science Consortia',
      'OpenNeuro Team',
    ],
    source: 'Neuro2 / OpenNeuro',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.18112/openneuro.ds003838.v1.0.0',
    tags: [
      'Neuroscience & Neural Datasets',
      'Biosignal Processing',
      'AI & Neural Interfaces',
      'EEG',
      'Brain-Computer Interface',
    ],
    entities: [
      'Electroencephalography',
      'Brain-Computer Interface',
      'Auditory Evoked Potential',
      'Neural Decoding',
      'OpenNeuro',
    ],
  },
  {
    id: 'dataset-physionet-sleep-edfx',
    title: 'Extended Sleep-EDF Polysomnography & Slow-Wave Delta Oscillation Atlas',
    abstract: 'Comprehensive whole-night sleep polysomnography (PSG) recording corpus containing dual-channel EEG (Fpz-Cz, Pz-Oz), EOG, and submental chin EMG across 197 nocturnal sessions. Standardized benchmark for automatic sleep stage classification and delta wave dynamics.',
    date: '2025-10-12',
    authors: [
      'B. Kemp',
      'A. H. Zwinderman',
      'Neuro2 Open Science',
    ],
    source: 'Neuro2 / PhysioNet',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.13026/C2X04D',
    tags: [
      'Neuroscience & Neural Datasets',
      'Biosignal Processing',
      'Acoustics',
      'Sleep Architecture',
    ],
    entities: [
      'Slow-Wave Sleep',
      'Delta Oscillation',
      'Polysomnography',
      'Electroencephalography',
      'PhysioNet',
    ],
  },
  {
    id: 'dataset-dandi-000003',
    title: 'High-Density Neuropixels Electrophysiology in Cortical & Hippocampal Networks',
    abstract: 'NWB-formatted extracellular electrophysiology dataset containing simultaneous recordings from up to 6 Neuropixels silicon probes spanning visual cortex, hippocampus, and thalamus in behaving subjects with over 100,000 recorded spike units.',
    date: '2025-11-05',
    authors: [
      'Allen Institute for Brain Science',
      'DANDI Archive',
      'Neuro2 Open Science',
    ],
    source: 'Neuro2 / DANDI',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.48324/dandi.000003/0.210812.1834',
    tags: [
      'Neuroscience & Neural Datasets',
      'AI & Neural Interfaces',
      'Electrophysiology',
      'Neuropixels',
    ],
    entities: [
      'Neuropixels Array',
      'Spike Sorting',
      'Hippocampal Circuit',
      'Electrophysiology',
      'DANDI Archive',
    ],
  },
  {
    id: 'dataset-bnci-horizon-2020-001',
    title: 'BNCI Horizon 2020 4-Class Motor Imagery & Sensorimotor Rhythm Corpus',
    abstract: 'Standardized 22-channel EEG dataset capturing four-class motor imagery (left hand, right hand, foot, tongue) across 9 subjects in multiple training and evaluation sessions with continuous cue-based timing.',
    date: '2025-06-18',
    authors: [
      'G. Brunner',
      'R. Leeb',
      'G. Pfurtscheller',
      'Neuro2 Open Science',
    ],
    source: 'Neuro2 / BNCI',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.3217/9244d-k0719',
    tags: [
      'Neuroscience & Neural Datasets',
      'AI & Neural Interfaces',
      'Biosignal Processing',
      'Motor Imagery',
      'BCI',
    ],
    entities: [
      'Motor Imagery',
      'Sensorimotor Rhythm',
      'Brain-Computer Interface',
      'Electroencephalography',
      'BNCI Horizon',
    ],
  },
  {
    id: 'dataset-openneuro-ds003645',
    title: 'Naturalistic Auditory Music Perception & Spatial Sound MEG/EEG Corpus',
    abstract: 'Simultaneous 306-channel MEG and 64-channel EEG recordings capturing cortical entrainment and spectral phase-locking during continuous exposure to polyphonic harmonic music and spatial acoustic trajectories.',
    date: '2025-09-22',
    authors: [
      'Neuro2 Open Science',
      'OpenNeuro Consortia',
      'Christopher Woodyard',
    ],
    source: 'Neuro2 / OpenNeuro',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.18112/openneuro.ds003645.v1.0.1',
    tags: [
      'Neuroscience & Neural Datasets',
      'Acoustics',
      'Biosignal Processing',
      'MEG',
      'Auditory Geometry',
    ],
    entities: [
      'Magnetoencephalography',
      'Auditory Cortex',
      'Spatial Sound',
      'Phase Synchronization',
      'OpenNeuro',
    ],
  },
  {
    id: 'dataset-zenodo-vibroacoustic-resonance',
    title: 'Vibroacoustic Stimulation & High-Density Neural Entrainment Index',
    abstract: 'Multimodal dataset recording continuous 64-channel EEG phase dynamics and galvanic skin conductance during immersion in low-frequency harmonic vibroacoustic fields and cymatic acoustic excitation.',
    date: '2026-02-11',
    authors: [
      'Christopher Woodyard',
      'Nataliya Kosmyna',
      'Eugene Hauptmann',
    ],
    source: 'Neuro2 / Zenodo',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.5281/zenodo.1084291',
    tags: [
      'Neuroscience & Neural Datasets',
      'Cymatics',
      'Biosignal Processing',
      'Acoustics',
      'Vibroacoustics',
    ],
    entities: [
      'Vibroacoustic Resonance',
      'Theta-Gamma Coupling',
      'Chladni Resonator',
      'Electroencephalography',
      'Zenodo',
    ],
  },
  {
    id: 'dataset-openneuro-ds000102',
    title: 'Multimodal 3T fMRI & Flanker Task Cognitive Control Matrix',
    abstract: 'BIDS-compliant functional magnetic resonance imaging (fMRI) dataset investigating anterior cingulate and fronto-parietal network activation during rapid cognitive conflict resolution and response inhibition paradigms.',
    date: '2025-04-15',
    authors: [
      'Kelly et al.',
      'OpenNeuro Consortia',
      'Neuro2 Open Science',
    ],
    source: 'Neuro2 / OpenNeuro',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.18112/openneuro.ds000102.v1.0.0',
    tags: [
      'Neuroscience & Neural Datasets',
      'AI & Neural Interfaces',
      'fMRI',
      'Cognitive Neuroscience',
    ],
    entities: [
      'fMRI',
      'Flanker Paradigm',
      'Cognitive Control',
      'Brain Imaging Data Structure',
      'OpenNeuro',
    ],
  },
  {
    id: 'dataset-zenodo-fnirs-wearable-bci',
    title: 'Wearable Multi-Channel fNIRS Hemodynamic Oxygenation in Natural Environments',
    abstract: 'Continuous dual-wavelength near-infrared optical spectroscopy dataset measuring prefrontal cortex oxygenated (HbO) and deoxygenated (HbR) hemoglobin fluctuations during sustained cognitive load and ambient acoustic environments.',
    date: '2025-12-08',
    authors: [
      'Neuro2 Open Science',
      'Nataliya Kosmyna',
    ],
    source: 'Neuro2 / Zenodo',
    url: 'https://huggingface.co/datasets/ciaochris/neuro2-neuroscience-datasets',
    doi: '10.5281/zenodo.1098412',
    tags: [
      'Neuroscience & Neural Datasets',
      'Biosignal Processing',
      'AI & Neural Interfaces',
      'fNIRS',
    ],
    entities: [
      'fNIRS',
      'Oxyhemoglobin Dynamics',
      'Prefrontal Cortex',
      'Wearable BCI',
      'Zenodo',
    ],
  },
  {
    id: 'app-ions-x-deep-emergence',
    title: 'IONS-X Deep Emergence Lab: Multi-Agent Simulation Sandbox for Coupled Dynamical Fields',
    abstract: 'A GPU-optional, multi-agent computational simulation environment modeling collective sensing operators, 4-channel coupled dynamical fields, environmental coherence modulation, REG variance deviations, and emergent relational network graphs.',
    date: '2026-08-20',
    authors: [
      'Christopher Woodyard',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/ions-x-deep-emergence-lab',
    tags: [
      'AI & Neural Interfaces',
      'Cymatics',
      'Biosignal Processing',
      'Multi-Agent Systems',
      'Emergence',
    ],
    entities: [
      'Multi-Agent Simulation',
      'Coupled Dynamical Field',
      'Environmental Coherence',
      'Emergent Graph',
      'REG Variance Deviation',
      'Autonomous Operators',
    ],
  },
  {
    id: 'app-rain-datamatrix-engine',
    title: 'R.A.I.N. DataMatrix Engine: Hybrid BM25 & Dense-Vector Knowledge Infrastructure',
    abstract: 'Self-hostable, air-gapped open knowledge platform combining lexical BM25 and dense-vector kNN embeddings via Reciprocal Rank Fusion (RRF) with citation-first summaries across 12 engineering corpora (arXiv, NASA NTRS, DOE OSTI, NIST, IEEE, Linux Kernel).',
    date: '2026-08-18',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Research Team',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/anna',
    tags: [
      'AI & Neural Interfaces',
      'Archival Intelligence & Institutional Oversight',
      'Open Infrastructure',
      'Hybrid Search',
      'Knowledge Graph',
    ],
    entities: [
      'Reciprocal Rank Fusion',
      'BM25 Retrieval',
      'Dense Vector Search',
      'Open Infrastructure',
      'Citation-First Synthesis',
      'NASA NTRS',
      'DOE OSTI',
    ],
  },
  {
    id: 'app-rain-lab-james',
    title: 'R.A.I.N. Lab: Autonomous Multi-Agent Scientific Deliberation & TRIBE v2 Brain Encoding Platform',
    abstract: 'Rust-powered autonomous multi-agent research runtime assembling specialized domain agents (James, Jasmine, Luca, Elena) to stress-test scientific hypotheses against empirical constraints, formal logic proofs, and TRIBE v2 fMRI cortical response predictions.',
    date: '2026-08-19',
    authors: [
      'Christopher Woodyard',
      'R.A.I.N. Lab Consortia',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/james_library',
    tags: [
      'AI & Neural Interfaces',
      'Biosignal Processing',
      'Multi-Agent Systems',
      'Formal Logic',
      'fMRI',
    ],
    entities: [
      'Multi-Agent Deliberation',
      'TRIBE v2 Brain Encoding',
      'fMRI Response Prediction',
      'Formal Logic Verification',
      'ZeroClaw Runtime',
      'Autonomous Research',
    ],
  },
  {
    id: 'app-circle-biosignal-platform',
    title: 'CIRCLE: Open-Source Multimodal Biosignal Hardware & Closed-Loop Feedback Platform',
    abstract: 'An evidence-first biosignal acquisition and closed-loop feedback architecture combining synchronized electrodermal activity (EDA), raw dual-wavelength photoplethysmography (PPG), and IMU motion capture on isolated ESP32-S3 hardware with 5 kVrms laboratory isolation barriers.',
    date: '2026-08-20',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Hardware Group',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/circle',
    tags: [
      'Biosignal Processing',
      'AI & Neural Interfaces',
      'Electrodermal Activity',
      'Photoplethysmography',
      'Closed-Loop BCI',
    ],
    entities: [
      'Electrodermal Response',
      'Photoplethysmography',
      'Closed-Loop BCI',
      'Galvanic Isolation',
      'ESP32-S3 Compute',
      'Multimodal Biosensing',
    ],
  },
  {
    id: 'app-lop-nur-geoint-twin',
    title: 'Lop Nur Geospatial Digital Twin: 3D Open-Source GEOINT Analytical Testbed',
    abstract: 'An unclassified, public-source 3D geospatial digital twin of the remote Lop Nur test facility in the Gobi Desert, featuring derived evidence registers, structured uncertainty envelopes, EPSG:32645 coordinate geodesy, and temporal satellite change comparison.',
    date: '2026-08-17',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Intelligence Research',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/lop-nur-twin',
    tags: [
      'Archival Intelligence & Institutional Oversight',
      'GEOINT',
      'Digital Twin',
      'Remote Sensing',
    ],
    entities: [
      'Geospatial Digital Twin',
      'Satellite Earth Observation',
      'Derived Evidence Ledger',
      'Structured Uncertainty Envelope',
      'Archival Intelligence',
    ],
  },
  {
    id: 'app-orpheus-resonance-protocol',
    title: 'Orpheus Command Protocol: Tactical Data Streams & Cognitive-Load C2 Dashboard',
    abstract: 'An AI-assisted tactical command-and-control prototype interface featuring real-time operator cognitive-load monitoring, pupillary spectral dynamics, spatial audio trajectory tracking, and simulated multi-source intelligence feeds.',
    date: '2026-08-12',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Research Team',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/orpheus-resonance-protocol',
    tags: [
      'AI & Neural Interfaces',
      'Acoustics',
      'Cognitive Load',
      'Command and Control',
    ],
    entities: [
      'Cognitive Load Monitoring',
      'Tactical Data Stream',
      'Pupillary Dynamics',
      'Spatial Audio C2',
    ],
  },
  {
    id: 'app-waveform-shift-quantum',
    title: 'Waveform Shift Quantum: Experimental Framework for Physical Model Falsification',
    abstract: 'An open computational framework turning physical resonance hypotheses and internal quantum state geometries into ranked, reproducible, and falsifiable experimental models.',
    date: '2026-08-14',
    authors: [
      'Christopher Woodyard',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/waveform-shift-quantum',
    tags: [
      'Quantum Computing',
      'Cymatics',
      'Resonance Physics',
    ],
    entities: [
      'Quantum State Geometry',
      'Internal Resonance State',
      'Falsifiable Physical Modeling',
      'Waveform Shift',
    ],
  },
  {
    id: 'app-project-33-aerospace',
    title: 'Project 33: Low-Cost Folding-Fin Rocket Testbed & Open Telemetry Ground Station',
    abstract: 'An open-source applied aerospace testbed combining OpenRocket aerodynamic simulation, Fusion 360 four-bar linkage fin CAD, dual ESP32 flight computer firmware with closed-loop PID roll stabilization, and a Python telemetry ground station.',
    date: '2026-08-21',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Aerospace Research',
    ],
    source: 'GitHub / Vers3Dynamics',
    url: 'https://github.com/topherchris420/33',
    tags: [
      'Aerospace Engineering',
      'Applied Physics',
      'Control Systems',
      'Embedded Hardware',
    ],
    entities: [
      'Folding-Fin Aerodynamics',
      'Closed-Loop PID Stabilization',
      'ESP32 Flight Computer',
      'OpenRocket Simulation',
      'Ground Station Telemetry',
      'Hardware Safety Interlock',
    ],
  },
  {
    id: 'app-drr-framework',
    title: 'Dynamic Resonance Rooting (DRR): Complex Systems Diagnostics & Supervisory State-Space Framework',
    abstract: 'An open mathematical framework (PyPI: drr-framework) uniting Morlet wavelet spectral decomposition, transfer entropy causal rooting, Herbst–Schorfheide tempered particle filtering, and Federal Reserve SR 11-7 supervisory banking liquidity diagnostics.',
    date: '2026-08-21',
    authors: [
      'Christopher Woodyard',
      'Vers3Dynamics Complex Systems Group',
    ],
    source: 'GitHub / Vers3Dynamics / PyPI',
    url: 'https://github.com/topherchris420/dynamic-resonance-rooting',
    tags: [
      'Cymatics',
      'Archival Intelligence & Institutional Oversight',
      'Biosignal Processing',
      'Resonance Physics',
      'Open Infrastructure',
    ],
    entities: [
      'Dynamic Resonance Rooting',
      'Wavelet Scalograms',
      'Transfer Entropy',
      'State-Space Smoothing',
      'Resonance Depth',
      'SR 11-7 Compliance',
      'Kalman Filtering',
    ],
  },
];

function ingest() {
  console.log('Loading existing curated knowledge data...');
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const normalized = normalizeKnowledgeData(raw);

  const docMap = new Map();
  normalized.documents.forEach((doc) => {
    validateDocument(doc);
    docMap.set(doc.id, doc);
  });

  let added = 0;
  NEURO2_DATASETS.forEach((ds) => {
    validateDocument(ds);
    if (!docMap.has(ds.id)) {
      added++;
    }
    docMap.set(ds.id, ds);
  });

  const mergedDocuments = Array.from(docMap.values());
  console.log(`Building 3D knowledge graph for ${mergedDocuments.length} documents (+${added} datasets)...`);
  const graph = buildGraphFromDocuments(mergedDocuments);

  const outputPayload = {
    documents: mergedDocuments,
    graph: graph,
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`Successfully updated ${DATA_PATH} with ${mergedDocuments.length} documents, ${graph.nodes.length} nodes, and ${graph.edges.length} edges.`);
}

ingest();
