import { CommunityPost, PostComment, CommunityTopic } from "./types";

export const MOCK_TOPICS: CommunityTopic[] = [
  { tag: "ROS2", label: "ROS 2 & Middleware", postCount: 42, description: "Humble, Iron, Jazzy setups, micro-ROS, DDS tuning" },
  { tag: "Humanoid", label: "Humanoid Robotics", postCount: 38, description: "Bipedal locomotion, whole-body control, mechanics" },
  { tag: "Hardware", label: "Hardware & Actuators", postCount: 29, description: "BLDC motors, cycloidal drives, custom PCBs, 3D printing" },
  { tag: "IsaacSim", label: "Simulation & Isaac Sim", postCount: 24, description: "NVIDIA Isaac Sim, MuJoCo, Webots, Gazebo" },
  { tag: "ReinforcementLearning", label: "Robotics AI / RL", postCount: 31, description: "PPO, SAC, Sim-to-Real policy transfer" },
  { tag: "ComputerVision", label: "Vision & Perception", postCount: 26, description: "6D pose, depth estimation, point clouds, visual SLAM" }
];

export const MOCK_POSTS: CommunityPost[] = [
  {
    id: "ros2-jazzy-vs-humble-humanoid",
    slug: "ros2-jazzy-vs-humble-humanoid",
    title: "Migrating humanoid balance controllers from ROS 2 Humble to Jazzy: What are the breaking DDS changes?",
    content: `We are currently porting our bipedal robot's 500Hz joint impedance control loop from Ubuntu 22.04 (ROS 2 Humble) to Ubuntu 24.04 (ROS 2 Jazzy). 

In Humble, we relied heavily on CycloneDDS with tuned kernel socket buffer sizes (\`rmem_max=16777216\`). However, in Jazzy, the default middleware changed, and we are observing occasional 2ms latency jitter spikes during high-rate IMU and joint feedback publish callbacks.

Has anyone successfully tuned Jazzy for hard real-time bipedal locomotion? Are there specific DDS QoS profiles or zenoh-bridge settings that you recommend for sub-millisecond deterministic pub/sub?`,
    type: "QUESTION",
    author: {
      id: "u-kittisak",
      name: "Dr. Kittisak Charoen",
      handle: "kittisak_robotics",
      roleBadge: "Lab Director • KMUTT",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: true
    },
    tags: ["ROS2", "Humanoid", "RealTime", "DDS"],
    createdAt: "2026-11-06T14:30:00Z",
    timeAgo: "4 hours ago",
    upvotes: 48,
    downvotes: 1,
    userVote: null,
    commentsCount: 9,
    viewsCount: 640,
    isBookmarked: false,
    isPinned: true,
    mediaUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "low-cost-cycloidal-drive-actuator",
    slug: "low-cost-cycloidal-drive-actuator",
    title: "Open-source 3D printable cycloidal drive with 1:24 gear ratio for robot dog and biped legs",
    content: `Wanted to share our lab's latest actuator mechanism benchmark! We engineered a high-torque-density 1:24 cycloidal gearbox designed to mount directly onto a 5010 BLDC drone motor.

Key Highlights:
• Total Bill of Materials (BOM) cost: Under ฿1,200 THB (~$34 USD) per joint.
• Output torque: Measured 18.5 Nm continuous, 32 Nm peak before thermal rollback.
• Backlash: Less than 0.18 degrees after running in with PTFE dry lube.
• 3D Printable in PETG-CF or PA12-CF on standard Bambu or Voron printers.

We published all STEP files, bearing references (6808 / 6902), and pin dimension tables on our GitHub.`,
    type: "SHOWCASE",
    author: {
      id: "u-preeda",
      name: "Preeda Wuttikun",
      handle: "preeda_maker",
      roleBadge: "Open Hardware Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: true
    },
    tags: ["Hardware", "3DPrinting", "Actuators", "Humanoid"],
    createdAt: "2026-11-05T09:15:00Z",
    timeAgo: "1 day ago",
    upvotes: 94,
    downvotes: 2,
    userVote: null,
    commentsCount: 16,
    viewsCount: 1420,
    isBookmarked: true,
    mediaUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "isaac-sim-gpu-reinforcement-learning-tutorial",
    slug: "isaac-sim-gpu-reinforcement-learning-tutorial",
    title: "Step-by-step: Training a 12-DoF humanoid walking policy in NVIDIA Isaac Sim in under 30 minutes",
    content: `Here is a reproducible workflow for training stable bipedal gait locomotion policies using Isaac Lab (Omniverse) and PyTorch PPO with 4,096 parallel environments on a single RTX 4080.

What this tutorial covers:
1. Converting your URDF/MJCF humanoid to USD with correct joint collision hulls and inertia tensors.
2. Formulating reward functions: forward velocity tracking, penalizing vertical torso oscillations, and joint acceleration regularization.
3. Domain randomization: friction variation (0.4 to 1.1), random push impulses (10-30 N), and latency buffer simulation.
4. Exporting to ONNX for deployment on an onboard Jetson Orin Nano.

Repository includes docker-compose scripts and pretrained checkpoint weights.`,
    type: "TUTORIAL",
    author: {
      id: "u-thanaphat",
      name: "Thanaphat Siriporn",
      handle: "thanaphat_ai",
      roleBadge: "Embodied AI Researcher",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: true
    },
    tags: ["IsaacSim", "ReinforcementLearning", "PyTorch", "Humanoid"],
    createdAt: "2026-11-04T18:00:00Z",
    timeAgo: "2 days ago",
    upvotes: 112,
    downvotes: 0,
    userVote: null,
    commentsCount: 22,
    viewsCount: 2150,
    isBookmarked: false,
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "thailand-humanoid-robotics-market-discussion",
    slug: "thailand-humanoid-robotics-market-discussion",
    title: "Discussion: Which service humanoid use cases make commercial sense in Thailand over the next 3 years?",
    content: `As humanoid hardware costs drop towards $16,000-$25,000 USD (e.g. Unitree G1, Fourier GR-1), what are the real deployment venues in Thailand where a bipedal form factor beats a wheeled AMR or a stationary robotic arm?

Promising sectors being piloted:
1. Hospital patient navigation & physical escort in multi-floor facilities with steps.
2. Cleanroom inspection in EEC electronics semiconductor factories.
3. High-end hospitality and interactive corporate showrooms.

What are the biggest deployment bottlenecks you see from local customers? Hardware reliability, battery life, or safety compliance?`,
    type: "DISCUSSION",
    author: {
      id: "u-nattaya",
      name: "Nattaya Boonkerd",
      handle: "nattaya_robotics",
      roleBadge: "Automation Consultant",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: false
    },
    tags: ["Industry", "ThailandRobotics", "Ecosystem"],
    createdAt: "2026-11-04T11:20:00Z",
    timeAgo: "3 days ago",
    upvotes: 35,
    downvotes: 3,
    userVote: null,
    commentsCount: 14,
    viewsCount: 890,
    isBookmarked: false,
    mediaUrl: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "unitree-g1-ros2-bridge-news",
    slug: "unitree-g1-ros2-bridge-news",
    title: "Unitree releases official ROS 2 Jazzy humanoid control SDK & Isaac Lab gym environment",
    content: `Unitree has open-sourced their official ROS 2 package for the G1 humanoid platform. The release includes full URDF/mesh definitions, joint state publishers, low-level motor command interfaces (DDS), and a verified Isaac Lab simulation asset.

This is a major win for Thai university research labs participating in the National Humanoid Navigation Hackathon, as it eliminates months of proprietary reverse engineering!`,
    type: "NEWS",
    author: {
      id: "u-newsroom",
      name: "HumanoidTH Editorial",
      handle: "editorial",
      roleBadge: "Official Atlas Team",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: true
    },
    tags: ["Humanoid", "ROS2", "News"],
    createdAt: "2026-11-03T16:00:00Z",
    timeAgo: "4 days ago",
    upvotes: 76,
    downvotes: 1,
    userVote: null,
    commentsCount: 8,
    viewsCount: 1830,
    isBookmarked: false,
    mediaUrl: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "soft-gripper-agriculture-idea",
    slug: "soft-gripper-agriculture-idea",
    title: "Idea: Compliant pneumatically actuated soft gripper for delicate fruit harvesting in Thai orchards",
    content: `Current robotic harvesters for mangoes and durian struggle with bruise prevention. What if we use 3D-printed flexible TPU bellows with embedded fiber optic curvature sensors?

The compliance of the soft silicone contact surface distributes contact pressure evenly, and pressure modulation can be driven by a miniature onboard 12V diaphragm pump. Looking for collaborators who want to test this on an open-source 6-DoF arm!`,
    type: "IDEA",
    author: {
      id: "u-somchai",
      name: "Somchai Prasert",
      handle: "somchai_maker",
      roleBadge: "Bio-Robotics Student",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80",
      isVerified: false
    },
    tags: ["Idea", "SoftRobotics", "Hardware"],
    createdAt: "2026-11-02T13:10:00Z",
    timeAgo: "5 days ago",
    upvotes: 29,
    downvotes: 0,
    userVote: null,
    commentsCount: 5,
    viewsCount: 520,
    isBookmarked: false,
    mediaUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80"
  }
];

export const MOCK_COMMENTS: Record<string, PostComment[]> = {
  "ros2-jazzy-vs-humble-humanoid": [
    {
      id: "c-101",
      postId: "ros2-jazzy-vs-humble-humanoid",
      parentId: null,
      author: {
        id: "u-teerasak",
        name: "Teerasak Somboon",
        handle: "teerasak_rt",
        roleBadge: "Embedded Linux Engineer",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80",
        isVerified: true
      },
      content: `We encountered the exact same 2ms jitter spike when benchmarking Jazzy on an PREEMPT_RT kernel. The root cause in our case was that Jazzy's default middleware switched to Fast-DDS 3.0, which enables dynamic participant discovery threads with default nice priority.

To fix it:
1. Export \`RMW_IMPLEMENTATION=rmw_cyclonedds_cpp\`.
2. Configure \`cyclonedds.xml\` with \`<Internal><Watermarks><SendLow>1024</SendLow></Watermarks></Internal>\`.
3. Lock your control thread with \`sched_setscheduler(0, SCHED_FIFO, &param)\`. Our jitter dropped back to under 85 microseconds.`,
      createdAt: "2026-11-06T15:10:00Z",
      upvotes: 24,
      userVote: null,
      replies: [
        {
          id: "c-102",
          postId: "ros2-jazzy-vs-humble-humanoid",
          parentId: "c-101",
          author: {
            id: "u-kittisak",
            name: "Dr. Kittisak Charoen",
            handle: "kittisak_robotics",
            roleBadge: "Lab Director • KMUTT",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            isVerified: true
          },
          content: `Thank you Teerasak! Setting \`SCHED_FIFO\` on the Cyclone callback queue and specifying the internal watermarks completely solved our 2ms dropout. Balance state estimator is now rock solid at 500Hz.`,
          createdAt: "2026-11-06T16:20:00Z",
          upvotes: 11,
          userVote: null
        },
        {
          id: "c-103",
          postId: "ros2-jazzy-vs-humble-humanoid",
          parentId: "c-101",
          author: {
            id: "u-artit",
            name: "Artit Kongkaew",
            handle: "artit_ros",
            roleBadge: "Robotics Researcher",
            avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80",
            isVerified: false
          },
          content: `Have you considered Zenoh instead of DDS for Jazzy? The \`rmw_zenoh_cpp\` middleware eliminates discovery overhead entirely on multi-node robot backplanes.`,
          createdAt: "2026-11-06T17:05:00Z",
          upvotes: 5,
          userVote: null
        }
      ]
    },
    {
      id: "c-104",
      postId: "ros2-jazzy-vs-humble-humanoid",
      parentId: null,
      author: {
        id: "u-worawut",
        name: "Worawut Tech",
        handle: "worawut_ctrl",
        roleBadge: "Control Systems Lead",
        avatarUrl: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=120&h=120&q=80",
        isVerified: false
      },
      content: `Also verify your CPU governor! In Ubuntu 24.04, the default power profile defaults to 'powersave' on many Intel/AMD boards which causes CPU frequency scaling transitions right when IMU spikes occur. Set \`cpupower frequency-set -g performance\`.`,
      createdAt: "2026-11-06T16:45:00Z",
      upvotes: 14,
      userVote: null,
      replies: []
    }
  ]
};
