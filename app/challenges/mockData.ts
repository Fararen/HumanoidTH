import { Challenge, Submission } from "./types";

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "th-humanoid-nav-2026",
    slug: "th-humanoid-nav-2026",
    title: "Thailand Humanoid Navigation Hackathon 2026",
    shortDescription: "Develop robust autonomous SLAM and bipedal dynamic obstacle avoidance algorithms for humanoid platforms in cluttered hospital environments.",
    fullDescription: `The Thailand Humanoid Navigation Hackathon challenges engineers, researchers, and university robotics teams to push the frontiers of autonomous bipedal navigation.

Teams must build or configure a full-stack navigation pipeline (Perception, 3D LiDAR/Visual SLAM, Path Planning, Dynamic Footstep Trajectory Optimization) tested against realistic indoor obstacle scenarios simulating Bangkok hospital corridors and rehabilitation wards.

Both simulation results (Isaac Sim / Webots / MuJoCo) and physical robot testbed logs with open-source code are eligible for awards.`,
    category: "Humanoid Robotics",
    kaggleCategory: "Featured",
    type: "OFFICIAL",
    mode: "PROJECT_SHOWCASE",
    status: "ACTIVE",
    organizer: {
      name: "National Robotics Innovation Consortium",
      organizationType: "Research Institution & Industry Alliance",
      isVerified: true,
      avatarEmoji: "🏛️",
      websiteUrl: "https://robotics.or.th"
    },
    bannerEmoji: "🤖",
    bannerGradient: "linear-gradient(135deg, #0e3728 0%, #19523c 50%, #2a7356 100%)",
    thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    badgeLetter: "k",
    prizePool: "฿100,000 THB",
    prizeDisplay: "฿100,000 THB ($2,850)",
    prizes: [
      { place: "1st Place (Gold Medal)", reward: "฿60,000 THB + 1-Year NVIDIA Isaac Sim GPU Credits + Trophy", description: "Grand Champion Award" },
      { place: "2nd Place (Silver Medal)", reward: "฿25,000 THB + Cloud Simulation Grants", description: "Outstanding Innovation" },
      { place: "3rd Place (Bronze Medal)", reward: "฿15,000 THB + Hardware Sensor Kit", description: "Technical Excellence" }
    ],
    schedule: {
      registrationDeadline: "2026-12-01",
      submissionDeadline: "2026-12-20",
      announcementDate: "2026-12-25",
      daysRemaining: 43,
      closingText: "43 days to go"
    },
    participantsCount: 142,
    submissionsCount: 38,
    tags: ["Humanoid", "ROS2", "SLAM", "Navigation", "Path Planning", "Isaac Sim"],
    evaluationMetric: "Collision Drift & Goal Path Efficiency (0.0 to 1.0)",
    datasetOverview: "50 GB 3D LiDAR point cloud sequences, RGB-D hospital corridor runs, and ground truth trajectory poses.",
    rubric: [
      { id: "innovation", name: "Innovation & Approach", weight: 25, description: "Novelty of sensor fusion architecture and dynamic footstep adaptation." },
      { id: "technical", name: "Technical Implementation", weight: 30, description: "Code quality, modular ROS 2 architecture, documentation, and reproducibility." },
      { id: "performance", name: "Navigation Performance", weight: 25, description: "Collision rate, time-to-goal, stability margin, and recovery from sudden dynamic obstacles." },
      { id: "presentation", name: "Video Demo & Presentation", weight: 20, description: "Clarity of video demo, architectural explanation, and benchmark evidence." }
    ],
    rules: [
      "Open to university student teams, research labs, startups, and independent roboticists worldwide.",
      "Teams may have 1 to 5 members.",
      "All submissions must include an open-source GitHub repository with reproduction steps (ROS 2 Humble / Iron / Jazzy supported).",
      "Simulation demos must provide reproducible bag files or dockerized simulation run scripts.",
      "Plagiarism or undocumented commercial code will result in immediate disqualification."
    ],
    submissionRequirements: [
      "Project Title & Team Name",
      "Public GitHub Repository URL with README and setup instructions",
      "Video demonstration URL (YouTube, Vimeo, or Google Drive) max 5 minutes",
      "Executive technical summary (under 600 words) detailing sensor fusion & trajectory planner",
      "Benchmark metrics table (Collision count, Average path length, Localization drift %)"
    ]
  },
  {
    id: "vision-bin-picking-2026",
    slug: "vision-bin-picking-2026",
    title: "Vision-based 6-DoF Robotic Bin Picking Challenge",
    shortDescription: "Solve cluttered industrial bin picking of reflective and semi-occluded automotive parts using RGB-D perception and 6D pose estimation.",
    fullDescription: `Industrial logistics and manufacturing assembly require robots to grasp randomly oriented, overlapping parts from deep bins. 

This challenge evaluates 6-DoF object pose estimation, grasp synthesis, and collision-free trajectory planning. Contestants are provided with a calibrated dataset of 5,000 RGB-D frames featuring metallic and plastic automotive fasteners in complex clutter.`,
    category: "Robot Manipulation",
    kaggleCategory: "Research",
    type: "OFFICIAL",
    mode: "DATASET_BENCHMARK",
    status: "ACTIVE",
    organizer: {
      name: "Chulalongkorn & KMUTT Robotics Alliance",
      organizationType: "University Joint Lab",
      isVerified: true,
      avatarEmoji: "🔬",
      websiteUrl: "https://eng.chula.ac.th"
    },
    bannerEmoji: "🦾",
    bannerGradient: "linear-gradient(135deg, #1b263b 0%, #274c5e 50%, #1f5f5b 100%)",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
    badgeLetter: "k",
    prizePool: "฿50,000 THB",
    prizeDisplay: "฿50,000 THB ($1,425)",
    prizes: [
      { place: "1st Place", reward: "฿30,000 THB + Industrial Depth Camera Kit", description: "Highest Grasp Success Rate" },
      { place: "2nd Place", reward: "฿15,000 THB", description: "Top Inference Speed & Efficiency" },
      { place: "3rd Place", reward: "฿5,000 THB", description: "Honorable Mention" }
    ],
    schedule: {
      registrationDeadline: "2026-11-28",
      submissionDeadline: "2026-12-15",
      announcementDate: "2026-12-22",
      daysRemaining: 38,
      closingText: "38 days to go"
    },
    participantsCount: 89,
    submissionsCount: 26,
    tags: ["Computer Vision", "6D Pose", "RGB-D", "Manipulation", "Grasping", "PyTorch"],
    evaluationMetric: "ADD-S Threshold Accuracy (< 2cm error)",
    datasetOverview: "5,000 calibrated multi-view RGB-D frames with ground-truth 6D object pose CAD models.",
    rubric: [
      { id: "accuracy", name: "6D Pose Accuracy (ADD-S < 2cm)", weight: 35, description: "Precision of object rotation and translation coordinates." },
      { id: "grasp_success", name: "Grasp Synthesis Success Rate", weight: 35, description: "Simulation verified collision-free grasp reachability." },
      { id: "latency", name: "Inference Latency (FPS)", weight: 15, description: "Algorithm runtime per frame on standard GPU." },
      { id: "reproducibility", name: "Code Cleanliness & Docs", weight: 15, description: "Reproducibility with clear conda/docker environment." }
    ],
    rules: [
      "Submissions must evaluate against the official validation split test set.",
      "No manual labeling of test set images permitted.",
      "Pretrained foundational vision models (Segment Anything, DINOv2) are allowed with proper citation."
    ],
    submissionRequirements: [
      "Prediction output JSON containing 6D transformation matrices and confidence scores",
      "GitHub repository link with training and evaluation checkpoints",
      "Short methodology paper/report (2-4 pages)"
    ]
  },
  {
    id: "diy-robot-gripper-showcase",
    slug: "diy-robot-gripper-showcase",
    title: "Best Low-Cost 3D Printed Robot Gripper & Hand",
    shortDescription: "Showcase innovative, accessible end-effector designs under $100 USD total BOM cost. Community voted and peer reviewed.",
    fullDescription: `Accessible robotics starts with hardware that students, makers, and indie developers can build at home.

Showcase your 3D printed mechanical hands, compliant underactuated grippers, tendon-driven fingers, or vacuum suction tools. Entries are judged on affordability, ease of assembly, grip versatility, and open-source documentation.`,
    category: "Hardware Design",
    kaggleCategory: "Community",
    type: "COMMUNITY",
    mode: "PROJECT_SHOWCASE",
    status: "ACTIVE",
    organizer: {
      name: "Makers & Robotics Thailand Community",
      organizationType: "Open Source Maker Group",
      isVerified: false,
      avatarEmoji: "🛠️"
    },
    bannerEmoji: "🖐️",
    bannerGradient: "linear-gradient(135deg, #7c3f00 0%, #a45a12 50%, #c47c1a 100%)",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    badgeLetter: "k",
    prizePool: "Community Showcase & Badge Award",
    prizeDisplay: "Swag & Filament Kits",
    prizes: [
      { place: "Community Favorite", reward: "Featured Project Spotlight on Homepage + 3D Filament Spool Bundle" },
      { place: "Most Innovative Mechanism", reward: "Open Hardware Badge + Micro-controller Dev Kit" }
    ],
    schedule: {
      registrationDeadline: "2026-12-05",
      submissionDeadline: "2026-12-30",
      announcementDate: "2027-01-05",
      daysRemaining: 53,
      closingText: "53 days to go"
    },
    participantsCount: 64,
    submissionsCount: 19,
    tags: ["3D Printing", "CAD", "Gripper", "Hardware", "Arduino", "Low Cost"],
    evaluationMetric: "BOM Cost (<$100) & Grip Adaptability Score",
    rubric: [
      { id: "cost", name: "Affordability (BOM < $100)", weight: 30, description: "Accessible bill of materials with off-the-shelf fasteners." },
      { id: "versatility", name: "Grip Adaptability", weight: 30, description: "Ability to grasp fragile, irregular, and heavy objects." },
      { id: "cad_docs", name: "CAD & Build Instructions", weight: 40, description: "Step-by-step STL files, assembly diagrams, and wiring guide." }
    ],
    rules: [
      "All CAD files (STEP / STL / Fusion360) must be shared under an open-source license (CC-BY-SA, MIT, or CERN OHL).",
      "Total estimated bill of materials must not exceed $100 USD (3,500 THB)."
    ],
    submissionRequirements: [
      "Bill of Materials (BOM) spreadsheet with purchase links",
      "Thingiverse, Printables, or GitHub link containing 3D print STLs",
      "Video demonstrating grasping at least 4 different objects (e.g. egg, bottle, coin, apple)"
    ]
  },
  {
    id: "mini-walking-gait-sim",
    slug: "mini-walking-gait-sim",
    title: "Mini Bipedal Walking Gait Simulation Challenge",
    shortDescription: "Train reinforcement learning policies for bipedal robot walking stability over uneven terrain in MuJoCo physics simulation.",
    fullDescription: `A simulation sprint focused on dynamic walking, balance recovery, and energy-efficient bipedal gait cycles.

Using an open-source 12-DoF humanoid model in MuJoCo, participants trained PPO/SAC neural network controllers to walk forward at 1.2 m/s while rejecting random perturbation lateral pushes.`,
    category: "Robotics AI",
    kaggleCategory: "Getting Started",
    type: "COMMUNITY",
    mode: "SIMULATION",
    status: "COMPLETED",
    organizer: {
      name: "MuJoCo Thai Enthusiasts",
      organizationType: "Student Research Club",
      isVerified: false,
      avatarEmoji: "⚡"
    },
    bannerEmoji: "🏃",
    bannerGradient: "linear-gradient(135deg, #37204e 0%, #4f2f70 50%, #684191 100%)",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    badgeLetter: "k",
    prizePool: "Hall of Fame Recognition",
    prizeDisplay: "Knowledge & Hall of Fame",
    prizes: [
      { place: "1st Place (Winner)", reward: "Official Hall of Fame Certificate + Gold Badge" },
      { place: "2nd Place", reward: "Silver Contributor Badge" }
    ],
    schedule: {
      registrationDeadline: "2026-09-01",
      submissionDeadline: "2026-10-15",
      announcementDate: "2026-10-20",
      daysRemaining: 0,
      closingText: "Finalized"
    },
    participantsCount: 112,
    submissionsCount: 42,
    tags: ["Reinforcement Learning", "MuJoCo", "Locomotion", "Humanoid", "PyTorch"],
    evaluationMetric: "Cost of Transport (Lower is Better) & Push Recovery Rate",
    rubric: [
      { id: "stability", name: "Push Recovery Balance", weight: 40, description: "Sustained walking stability during external force vectors." },
      { id: "energy", name: "Energy Economy (CoT)", weight: 35, description: "Low cost of transport joint torque efficiency." },
      { id: "naturalness", name: "Gait Aesthetics", weight: 25, description: "Smooth natural human-like footstep symmetry." }
    ],
    rules: [
      "Controller weights must be open-sourced and reproducible with python scripts provided."
    ],
    submissionRequirements: [
      "Pretrained model checkpoint (.pt or .onnx)",
      "Evaluation video recording of 30 seconds uninterrupted walking",
      "GitHub repo containing MuJoCo environment setup"
    ]
  }
];

export const INITIAL_SUBMISSIONS: Record<string, Submission[]> = {
  "th-humanoid-nav-2026": [
    {
      id: "sub-nav-1",
      challengeId: "th-humanoid-nav-2026",
      rank: 1,
      rankChange: 0,
      awardBadge: "GOLD",
      teamName: "KMITL RoboNav Lab",
      teamAvatarEmoji: "🐯",
      title: "Omni-SDF: Continuous Signed Distance Field SLAM with Dynamic Footstep Optimization",
      description: "Combines 3D LiDAR continuous SDF mapping with a real-time QP footstep planner running at 50Hz on an onboard Jetson Orin.",
      submittedAt: "2026-11-04",
      lastSubmitTime: "2 hours ago",
      githubUrl: "https://github.com/example/kmitl-omni-sdf-slam",
      demoUrl: "https://youtu.be/dQw4w9WgXcQ",
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
      totalScore: 94.6,
      scoreDisplay: "0.9460",
      entriesCount: 16,
      rubricScores: { innovation: 24, technical: 29, performance: 23.6, presentation: 18 },
      status: "APPROVED",
      votesCount: 88
    },
    {
      id: "sub-nav-2",
      challengeId: "th-humanoid-nav-2026",
      rank: 2,
      rankChange: 2,
      awardBadge: "SILVER",
      teamName: "FIBO Humanoid Team",
      teamAvatarEmoji: "🤖",
      title: "BioVoxel-Nav: Voxelized Occupancy Grid with Zero-Shot Pedestrian Trajectory Prediction",
      description: "Fast occupancy flow prediction network predicting crowd trajectories 3 seconds into the future for proactive evasive steering.",
      submittedAt: "2026-11-03",
      lastSubmitTime: "yesterday",
      githubUrl: "https://github.com/example/fibo-biovoxel-nav",
      demoUrl: "https://youtu.be/example",
      totalScore: 91.2,
      scoreDisplay: "0.9120",
      entriesCount: 12,
      rubricScores: { innovation: 23, technical: 28, performance: 22.2, presentation: 18 },
      status: "APPROVED",
      votesCount: 65
    },
    {
      id: "sub-nav-3",
      challengeId: "th-humanoid-nav-2026",
      rank: 3,
      rankChange: -1,
      awardBadge: "BRONZE",
      teamName: "CU Robotics Vanguard",
      teamAvatarEmoji: "🐘",
      title: "Legged-Nav2: Native Nav2 Plugin Suite for Bipedal Stability Margins",
      description: "Custom costmap2d recovery behaviors and balance-aware path smoother preventing tipping over sudden ramps and thresholds.",
      submittedAt: "2026-11-02",
      lastSubmitTime: "3 days ago",
      githubUrl: "https://github.com/example/legged-nav2-plugin",
      totalScore: 88.5,
      scoreDisplay: "0.8850",
      entriesCount: 9,
      rubricScores: { innovation: 21, technical: 28, performance: 22.5, presentation: 17 },
      status: "APPROVED",
      votesCount: 52
    },
    {
      id: "sub-nav-4",
      challengeId: "th-humanoid-nav-2026",
      rank: 4,
      rankChange: 1,
      awardBadge: "FINALIST",
      teamName: "Chiang Mai AI Dynamics",
      teamAvatarEmoji: "🌲",
      title: "Adaptive MPC Gait with RTAB-Map RGB-D Fusion",
      description: "Low-cost dual RealSense D435i vision configuration with predictive model control gait stabilization.",
      submittedAt: "2026-11-01",
      lastSubmitTime: "5 days ago",
      githubUrl: "https://github.com/example/cmai-dynamics-nav",
      totalScore: 84.0,
      scoreDisplay: "0.8400",
      entriesCount: 7,
      rubricScores: { innovation: 20, technical: 26, performance: 21, presentation: 17 },
      status: "APPROVED",
      votesCount: 39
    },
    {
      id: "sub-nav-5",
      challengeId: "th-humanoid-nav-2026",
      rank: 5,
      rankChange: -2,
      awardBadge: "FINALIST",
      teamName: "Mahanakorn Bipedal Crew",
      teamAvatarEmoji: "⚡",
      title: "Hierarchical Reinforcement Navigation with Safety Barrier Functions",
      description: "High-level goal pathing coupled with low-level neural gait network conditioned on elevation maps.",
      submittedAt: "2026-10-29",
      lastSubmitTime: "1 week ago",
      githubUrl: "https://github.com/example/mut-hierarchical-rl",
      totalScore: 81.3,
      scoreDisplay: "0.8130",
      entriesCount: 4,
      rubricScores: { innovation: 22, technical: 24, performance: 19.3, presentation: 16 },
      status: "APPROVED",
      votesCount: 31
    }
  ],
  "vision-bin-picking-2026": [
    {
      id: "sub-pick-1",
      challengeId: "vision-bin-picking-2026",
      rank: 1,
      rankChange: 0,
      awardBadge: "GOLD",
      teamName: "VISTEC Vision Agents",
      teamAvatarEmoji: "🔬",
      title: "GraspNet-6D+: Specular-Robust Point Cloud Pose Estimator",
      description: "Trained on synthetic ray-traced CAD data with domain randomization; achieves 98.4% grasp success rate on reflective chrome parts.",
      submittedAt: "2026-11-03",
      lastSubmitTime: "5 hours ago",
      githubUrl: "https://github.com/example/vistec-graspnet-6d",
      totalScore: 96.2,
      scoreDisplay: "0.9620",
      entriesCount: 14,
      rubricScores: { accuracy: 34.2, grasp_success: 34.5, latency: 14.0, reproducibility: 13.5 },
      status: "APPROVED",
      votesCount: 71
    },
    {
      id: "sub-pick-2",
      challengeId: "vision-bin-picking-2026",
      rank: 2,
      rankChange: 1,
      awardBadge: "SILVER",
      teamName: "Thammasat Automation Group",
      teamAvatarEmoji: "🏛️",
      title: "FastPick-YOLOv10 with Depth Normal Alignment",
      description: "Runs at 45 FPS on edge hardware by combining 2D oriented bounding boxes with fast surface normal PCA fitting.",
      submittedAt: "2026-11-01",
      lastSubmitTime: "2 days ago",
      githubUrl: "https://github.com/example/tu-fastpick-yolo",
      totalScore: 90.8,
      scoreDisplay: "0.9080",
      entriesCount: 8,
      rubricScores: { accuracy: 31.0, grasp_success: 32.0, latency: 15.0, reproducibility: 12.8 },
      status: "APPROVED",
      votesCount: 44
    }
  ],
  "diy-robot-gripper-showcase": [
    {
      id: "sub-grip-1",
      challengeId: "diy-robot-gripper-showcase",
      rank: 1,
      rankChange: 0,
      awardBadge: "GOLD",
      teamName: "MakerSpace Korat",
      teamAvatarEmoji: "🛠️",
      title: "Tendon-Flex 3D: Underactuated Fin-Ray Hand with TPU Compliant Pads",
      description: "A 3-finger compliant gripper costing only $28 USD in total materials that automatically conforms to delicate fruit and heavy metal cylinders.",
      submittedAt: "2026-11-02",
      lastSubmitTime: "1 day ago",
      githubUrl: "https://github.com/example/tendon-flex-gripper",
      demoUrl: "https://youtu.be/example",
      totalScore: 95.0,
      scoreDisplay: "95.00",
      entriesCount: 5,
      rubricScores: { cost: 29.5, versatility: 29.0, cad_docs: 36.5 },
      status: "APPROVED",
      votesCount: 114
    },
    {
      id: "sub-grip-2",
      challengeId: "diy-robot-gripper-showcase",
      rank: 2,
      rankChange: 0,
      awardBadge: "SILVER",
      teamName: "Bangkok DIY Robotics",
      teamAvatarEmoji: "⚡",
      title: "Dual-Mode Parallel-Angular Mechanical Gripper with MG996R Servos",
      description: "Geared mechanism allowing linear parallel pinching and wide angular grasping with a single micro servo.",
      submittedAt: "2026-10-30",
      lastSubmitTime: "4 days ago",
      githubUrl: "https://github.com/example/dual-mode-gripper",
      totalScore: 89.0,
      scoreDisplay: "89.00",
      entriesCount: 3,
      rubricScores: { cost: 28.0, versatility: 27.0, cad_docs: 34.0 },
      status: "APPROVED",
      votesCount: 83
    }
  ],
  "mini-walking-gait-sim": [
    {
      id: "sub-walk-1",
      challengeId: "mini-walking-gait-sim",
      rank: 1,
      rankChange: 0,
      awardBadge: "GOLD",
      teamName: "MuJoCo Bipedal Masters",
      teamAvatarEmoji: "🏃",
      title: "Phase-Conditioned PPO with Centroidal Momentum Stabilization",
      description: "Achieved continuous 1.4 m/s walking over 15-degree inclines and random 80N impulse lateral pushes.",
      submittedAt: "2026-10-14",
      lastSubmitTime: "Finalized",
      githubUrl: "https://github.com/example/phase-ppo-biped",
      totalScore: 97.4,
      scoreDisplay: "0.24 CoT",
      entriesCount: 21,
      rubricScores: { stability: 39.4, energy: 34.0, naturalness: 24.0 },
      status: "APPROVED",
      votesCount: 156
    }
  ]
};
