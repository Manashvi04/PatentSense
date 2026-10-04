const { run, get } = require('./database');

const patentsToSeed = [
  {
    patent_number: "US-11048956-B2",
    title: "Transformer-based neural network model for semantic legal document analysis",
    category: "Artificial Intelligence",
    filing_date: "2021-03-12",
    inventors: "Dr. Sarah Jenkins, Rajesh Kuppuswamy",
    assignee: "LexisAI Technologies Inc.",
    abstract: "A system and method for analyzing legal documents using a specialized transformer neural network. The model employs self-attention mechanisms trained on legal corpora to identify clauses, assess risk, and classify legal provisions. It constructs hierarchical semantic vector representations of legal language to find structural and contextual deviations from standard reference templates.",
    description: "The present invention relates to natural language processing and transformer architectures specialized for the legal domain. Traditional legal search relies on exact keyword matching, which fails to capture semantic meaning or context. The system processes a legal document by tokenizing text, applying a multi-head self-attention mechanism trained specifically on a large corpus of case law, contracts, and regulations. It generates a multi-dimensional semantic vector representing each paragraph. An anomaly detection module compares the vectors of a target contract against standard pre-approved templates to compute a risk index. The invention also includes a classification head that labels contract clauses such as indemnification, limitation of liability, and termination. The result is a highly accurate semantic mapping that flags non-standard language even when completely paraphrased."
  },
  {
    patent_number: "US-11589412-B1",
    title: "Non-invasive wearable blood glucose monitoring using multi-wavelength optical spectroscopy",
    category: "Biotechnology & Healthcare",
    filing_date: "2022-06-18",
    inventors: "Dr. Elena Rostova, Marcus Vance",
    assignee: "BioVitals Wearables Corp.",
    abstract: "A wearable device for continuous, non-invasive monitoring of blood glucose levels using optical spectroscopy. The device includes a sensor array that emits light at multiple near-infrared and visible wavelengths into the skin tissue. It measures the reflected and backscattered light, filters noise using photoplethysmography (PPG) signals, and inputs the spectral data into a calibrated machine learning regression model to predict glucose concentration.",
    description: "Monitoring glucose levels is critical for diabetes management. Invasive finger-stick tests are painful, leading to poor compliance. The present invention details a wrist-worn or finger-worn wearable sensor utilizing optical spectroscopy. An emitter array utilizes light-emitting diodes (LEDs) spanning wavelengths between 650nm and 1050nm, targetting absorption peaks of glucose. Reflected light is received by a high-sensitivity photodiode array. To eliminate blood volume pulsation noise, a co-located photoplethysmography (PPG) sensor captures blood flow dynamics. A microcontroller processes the raw spectral response and applies a partial least squares regression (PLSR) or neural network model to calculate the active concentration of glucose in the interstitial fluid. The calibration is updated continuously using skin temperature and moisture readings."
  },
  {
    patent_number: "US-10877543-B2",
    title: "High-efficiency perovskite-silicon tandem solar cell with micro-textured interface",
    category: "Green Energy & CleanTech",
    filing_date: "2020-09-05",
    inventors: "Dr. Arthur Pendelton, Mei-Ling Chen",
    assignee: "SolarNova Energies",
    abstract: "A tandem solar cell device combining a silicon bottom sub-cell and a perovskite top sub-cell. An intermediate recombination layer with a micro-textured interface connects the sub-cells. This micro-texture reduces light reflection and enhances optical trapping across both sub-cells, yielding a higher combined conversion efficiency. A passivation layer of organic-inorganic halide blocks defect states, improving durability.",
    description: "Silicon solar cells are approaching their theoretical efficiency limit. Tandem architectures offer a way to exceed this limit by stacking materials with complementary bandgaps. This invention describes a perovskite-silicon tandem solar cell. The bottom sub-cell is composed of crystalline silicon optimized for absorbing long-wavelength infrared light. The top sub-cell uses a metal halide perovskite material optimized for short-wavelength visible light. A key feature of the invention is the interface layer which is micro-textured using reactive-ion etching. This texturing prevents back-reflection and traps light, forcing it to undergo multiple internal reflections. A specialized passivating formulation of phenethylammonium iodide is applied to the perovskite layer to neutralize dangling bonds, reducing charge carrier recombination and significantly extending the degradation lifetime of the cell."
  },
  {
    patent_number: "US-11985443-B2",
    title: "Decentralized blockchain consensus ledger for securing IoT device identity and authorization",
    category: "Internet of Things (IoT)",
    filing_date: "2023-01-20",
    inventors: "Viktor Petrov, Sandra Cole",
    assignee: "SecurIoT Solutions Ltd.",
    abstract: "A method for managing identity and access rights for Internet of Things (IoT) devices using a decentralized blockchain ledger. Devices are registered on-chain with cryptographic public key identities. Interactions and resource requests between devices are validated via smart contracts running a proof-of-authority consensus, eliminating centralized cloud broker bottlenecks and single points of failure.",
    description: "The explosion of IoT devices presents significant cybersecurity risks, as centralized authentication servers are prone to DDoS attacks and compromises. This invention implements a decentralized identity management system. Each IoT device generates an elliptic-curve public-private key pair. The public key is registered as a unique identifier (DID) on a private blockchain. When an edge gateway requests access to a sensor stream, it submits a transaction signed by its private key. A smart contract verifies the authorization credentials, checks the policy rules stored in the blockchain ledger, and updates the device's state. The ledger utilizes a Proof of Authority (PoA) consensus mechanism run by designated validator nodes, ensuring low-latency validation suitable for resource-constrained edge computing environments."
  },
  {
    patent_number: "US-11304910-B1",
    title: "Soft robotic gripper with integrated pneumatic actuators and flexible tactile feedback sensors",
    category: "Robotics & Automation",
    filing_date: "2022-02-14",
    inventors: "Dr. Kenji Sato, Chloe Dubois",
    assignee: "RoboFlex Systems Inc.",
    abstract: "A soft robotic gripper designed for delicate object manipulation. The gripper comprises multiple elastomeric fingers with internal pneumatic networks that inflate to bend the fingers. The fingertips are integrated with flexible, capacitive tactile sensors that measure contact pressure and shear force. A closed-loop control system regulates air pressure based on sensor feedback to prevent slipping and crushing.",
    description: "Standard industrial grippers are rigid and can damage delicate or irregularly shaped items like fruit, glassware, or electronic components. This invention describes a soft robotic gripper made of silicone elastomer. The fingers contain chambers designed according to PneuNet (pneumatic network) principles; inflating these chambers with air causes them to bend predictably. Integrated along the grasping surface is a flexible capacitive sensor array using carbon nanotube electrodes. This array measures tactile pressure distribution and shear stress. A PID controller receives the sensor values and adjusts the output of a pneumatic regulator in real-time. This keeps the grasping force within a safe target window, allowing the gripper to pick up a strawberry, a lightbulb, or a heavy metal nut without damage."
  },
  {
    patent_number: "US-10255410-B2",
    title: "Autonomous drone navigation in GPS-denied environments using visual inertial odometry",
    category: "Robotics & Automation",
    filing_date: "2019-11-03",
    inventors: "Liam O'Connor, Fatima Al-Fayed",
    assignee: "AeroNav Autonomous Systems",
    abstract: "An onboard navigation system for unmanned aerial vehicles (UAVs) operating in environments without GPS signal. The system fuses high-frequency data from an Inertial Measurement Unit (IMU) with video frames from a monocular or stereo camera. A localized Extended Kalman Filter (EKF) estimates the drone's position, velocity, and orientation in real-time, mapping obstacles and planning paths dynamically.",
    description: "Drones operating indoors, under forest canopies, or in urban canyons frequently lose GPS signals. This invention provides an autopilot navigation system that operates entirely offline and onboard. It consists of a stereo camera module and an inertial measurement unit (IMU). The system performs visual feature extraction (e.g., FAST or ORB features) from successive camera frames and tracks them to estimate relative motion. This visual odometry is fused with accelerometer and gyroscope readings from the IMU using an Extended Kalman Filter (EKF) or factor graph optimization. The resulting visual-inertial odometry (VIO) provides a drift-resistant state estimate. Concurrently, a dense 3D occupancy map is built using octrees, enabling an onboard path planner to avoid obstacles and navigate to a target coordinate."
  },
  {
    patent_number: "US-11221008-B2",
    title: "Bidirectional vehicle-to-grid (V2G) smart charging coordination and battery degradation mitigation",
    category: "Green Energy & CleanTech",
    filing_date: "2021-08-22",
    inventors: "Dr. Hans-Dieter Weber, Lisa Wong",
    assignee: "GridSync Utilities",
    abstract: "A smart-grid system for coordinating bidirectional energy transfer between electric vehicles (EVs) and the electrical grid. The system schedules charging and discharging cycles for a fleet of EVs based on grid demand, electricity pricing, and driver departure schedules. It incorporates an optimization algorithm that limits battery depth of discharge to minimize capacity fading and degradation.",
    description: "Electric vehicle batteries can act as distributed energy storage to stabilize the power grid. However, cycling the battery for grid services can accelerate wear and capacity loss. This invention details a coordinator server that manages bidirectional power flow. When an EV connects to a charging station, the user inputs their target departure time. The server collects real-time grid frequency and spot electricity prices. It solves a mixed-integer linear programming (MILP) problem to schedule charge/discharge intervals. Crucially, the optimization model includes a lithium-ion battery degradation model. The algorithm restricts deep discharging, limits high-rate charging when the state-of-charge (SoC) is high, and avoids temperature spikes. This permits V2G grid balancing while protecting the vehicle battery lifetime."
  },
  {
    patent_number: "US-11400295-B2",
    title: "CRISPR-based target sequencing vector design and localized gene editing system",
    category: "Biotechnology & Healthcare",
    filing_date: "2021-10-30",
    inventors: "Dr. Alexander Thorne, Beatrice Labonte",
    assignee: "GeneEdit Therapeutics Corp.",
    abstract: "A recombinant vector system for CRISPR-based gene editing with improved targeting efficiency and reduced off-target activity. The vector incorporates a modified Cas9 endonuclease driven by a tissue-specific promoter, and a dual-guide RNA targeting a specific genomic locus. The vector is encapsulated in target-functionalized lipid nanoparticles for tissue-specific delivery.",
    description: "Gene editing holds immense promise for treating genetic disorders, but off-target mutations and systemic toxicity remain key challenges. The present invention solves this with a highly localized delivery and activation vector. The DNA vector encodes a modified Cas9 enzyme that is only expressed in the presence of specific tissue-specific promoters (e.g., hepatocytes). The guide RNA is designed with a secondary hairpin structure that only unlocks upon binding the exact target genomic locus, reducing non-specific cleavage. The vector is packaged inside lipid nanoparticles (LNPs) coated with ligands targeting specific cell receptors (e.g., asialoglycoprotein receptors for liver targeting), ensuring the CRISPR components are delivered and activated exclusively in the target tissue."
  },
  {
    patent_number: "US-11105999-B1",
    title: "Generative adversarial network (GAN) for high-resolution medical image synthesis and augmentation",
    category: "Artificial Intelligence",
    filing_date: "2022-01-15",
    inventors: "Dr. Rajan Patel, Samantha Miller",
    assignee: "MedImage Synthesis Inc.",
    abstract: "A generative adversarial network (GAN) model designed to generate synthetic, high-resolution medical images for training data augmentation. The model uses a progressive growing generator structure and a multi-scale discriminator. It incorporates a structural similarity index (SSIM) loss component to preserve fine anatomical structures and pathological details, avoiding hallucinated artifacts.",
    description: "Training deep learning models for medical image analysis requires large annotated datasets, which are scarce due to privacy laws and labeling costs. This invention addresses the scarcity of medical images by synthesizing high-fidelity MRI, CT, or X-ray scans. The system implements a Generative Adversarial Network. The generator starts with low resolution and progressively adds layers to output higher details (progressive growing). To ensure the generated images are anatomically correct and do not contain hallucinations, the discriminator evaluates images at multiple scales. Additionally, the loss function combines traditional adversarial binary cross-entropy with a Structural Similarity Index Measure (SSIM) loss. This forces the generator to retain realistic bone, tissue, and vessel patterns, making the synthetic images suitable for training diagnostic algorithms."
  },
  {
    patent_number: "US-10901234-B2",
    title: "Real-time edge-computing anomaly detection in industrial manufacturing equipment",
    category: "Internet of Things (IoT)",
    filing_date: "2020-05-18",
    inventors: "Gregory Smith, Hans Muller",
    assignee: "Siemens-Tech Industry",
    abstract: "An edge-computing node and algorithm for real-time anomaly detection in industrial machinery. The node interfaces directly with vibration, temperature, and acoustic sensors on a machine. It runs a lightweight Autoencoder neural network model locally to compute a reconstruction error. Anomalies are flagged immediately when the error exceeds a dynamically adjusted threshold, triggering maintenance alerts.",
    description: "Industrial equipment failures can cause costly unplanned downtime. Cloud-based predictive maintenance suffers from latency and high bandwidth costs. This invention places a ruggedized edge-computing node directly on the machine. The node aggregates sensor streams (vibration accelerometer, thermal probe, acoustic microphone) at high sampling rates. It runs a pre-trained Autoencoder neural network. The Autoencoder compresses the sensor data into a low-dimensional bottleneck and reconstructs it. Under normal operating conditions, the reconstruction error is low. When mechanical parts wear or bearings fail, the sensor patterns shift, causing the reconstruction error to spike. The edge node calculates a dynamic threshold based on rolling average parameters and alerts the SCADA network without uploading raw data to the cloud."
  }
];

async function seedDatabase() {
  try {
    // Check if patents already exist
    const countRow = await get("SELECT COUNT(*) as count FROM patents");
    if (countRow.count > 0) {
      console.log(`Database already seeded with ${countRow.count} patents. Skipping seeding.`);
      return;
    }

    console.log("Seeding database with default reference patents...");
    for (const patent of patentsToSeed) {
      await run(`
        INSERT INTO patents (patent_number, title, abstract, description, inventors, assignee, filing_date, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patent.patent_number,
        patent.title,
        patent.abstract,
        patent.description,
        patent.inventors,
        patent.assignee,
        patent.filing_date,
        patent.category
      ]);
    }
    console.log("Successfully seeded database.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Additional dummy data: users, saved patents, analysis history
const bcrypt = require('bcryptjs');
const usersToSeed = [
  {
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    full_name: 'Admin User',
    role: 'admin',
    organization: 'PatentSense Corp',
    research_interests: 'AI, Blockchain',
    theme: 'dark',
    notifications: 1,
    language: 'en'
  },
  {
    email: 'user1@example.com',
    password_hash: bcrypt.hashSync('user1234', 10),
    full_name: 'John Doe',
    role: 'user',
    organization: 'Tech Labs',
    research_interests: 'Green Energy',
    theme: 'dark',
    notifications: 1,
    language: 'en'
  }
];

async function seedAdditionalData() {
  // Seed users
  for (const u of usersToSeed) {
    await run(`
      INSERT OR IGNORE INTO users (email, password_hash, full_name, role, organization, research_interests, theme, notifications, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [u.email, u.password_hash, u.full_name, u.role, u.organization, u.research_interests, u.theme, u.notifications, u.language]);
  }

  // Get a user id for sample relations
  const admin = await get('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  const user1 = await get('SELECT id FROM users WHERE email = ?', ['user1@example.com']);

  // Seed saved patents for user1 (use first two patents)
  const patent1 = await get('SELECT id FROM patents WHERE patent_number = ?', ['US-11048956-B2']);
  const patent2 = await get('SELECT id FROM patents WHERE patent_number = ?', ['US-11589412-B1']);
  if (patent1 && patent2) {
    await run('INSERT OR IGNORE INTO saved_patents (user_id, patent_id) VALUES (?, ?)', [user1.id, patent1.id]);
    await run('INSERT OR IGNORE INTO saved_patents (user_id, patent_id) VALUES (?, ?)', [user1.id, patent2.id]);
  }

  // Seed analysis_history for user1 (dummy analysis)
  await run(`
    INSERT INTO analysis_history (user_id, title, abstract, description, technology_domain, keywords, novelty_score, similarity_percentage, ai_summary, raw_results_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    user1.id,
    'Sample AI Patent Analysis',
    'Analyzing AI novelty.',
    'Detailed description of AI patent analysis.',
    'Artificial Intelligence',
    'AI, Machine Learning',
    85,
    70,
    'Generated summary placeholder',
    JSON.stringify({})
  ]);

}

// Extend main seed function
async function seedDatabase() {
  try {
    // Existing patent seeding logic
    const countRow = await get("SELECT COUNT(*) as count FROM patents");
    if (countRow.count > 0) {
      console.log(`Database already seeded with ${countRow.count} patents. Skipping patent seeding.`);
    } else {
      console.log("Seeding database with default reference patents...");
      for (const patent of patentsToSeed) {
        await run(`
          INSERT INTO patents (patent_number, title, abstract, description, inventors, assignee, filing_date, category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patent.patent_number,
          patent.title,
          patent.abstract,
          patent.description,
          patent.inventors,
          patent.assignee,
          patent.filing_date,
          patent.category
        ]);
      }
      console.log("Successfully seeded patents.");
    }

    // Seed additional dummy data
    console.log("Seeding dummy users, saved patents, and analysis history...");
    await seedAdditionalData();
    console.log("Dummy data seeding complete.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// If run directly
if (require.main === module) {
  setTimeout(async () => {
    await seedDatabase();
    process.exit(0);
  }, 1000);
}

module.exports = { seedDatabase };

