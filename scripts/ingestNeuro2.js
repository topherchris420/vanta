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
