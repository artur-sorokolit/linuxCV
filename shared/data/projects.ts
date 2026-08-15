export interface Project {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  description: string;
  tags: string[];
  image?: string;
  logo?: string;
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  cardType: "wide" | "high";
}

export const projectsData: Project[] = [
  {
    id: "linuxcv",
    title: "linuxCV",
    subtitle: "Interactive Web-based Operating System Desktop",
    role: "Lead Full-Stack Developer",
    description:
      "An innovative portfolio application designed to simulate a windowed Linux operating system desktop environment. Visitors can drag, maximize, and minimize folders, converse with a built-in AI Assistant, or view professional details as virtual files.",
    tags: [
      "React 19",
      "TypeScript",
      "Framer Motion",
      "Vanilla CSS",
      "Node.js",
      "Express",
      "PostgreSQL",
      "OpenRouter LLM",
    ],
    highlights: [
      "Engineered a complete windowing layout system with dynamic z-index focusing, drag constraints, and responsive window states.",
      "Integrated an AI assistant over OpenRouter that answers from a generated knowledge graph of the portfolio data, selecting free models from the live catalogue at runtime and failing over when one is rate-limited.",
      "Runs entirely on free tiers: a CDN-served frontend, an Express API on Render, and a managed Postgres database, with schema migrations applied automatically on boot.",
      "Created custom glassmorphism styles with pure CSS variables and smooth system micro-animations.",
    ],
    githubUrl: "https://github.com/artur-sorokolit/linuxCV",
    demoUrl: "https://artur-sorokolit.uk/",
    cardType: "wide",
  },
  {
    id: "Graintrack",
    title: "Graintrack CTRM Enterprise System",
    subtitle: "High-Performance Commodity Trading & Risk Management Platform",
    role: "Full-Stack Software Engineer",
    description:
      "An enterprise-grade platform built to handle massive financial transactions, real-time physical commodity logistics, trade execution pipelines, and risk management analytics.",
    tags: [
      "React",
      "RxJS",
      "TypeScript",
      "React Query",
      "Tailwind CSS",
      "High-Density Grids",
      "Angular",
      "Python",
      "Django",
      "PostgreSQL",
    ],
    highlights: [
      "Engineered a data grid holding 4,000+ concurrent live data points at sub-16ms render times, with business logic kept in an RxJS services layer rather than components.",
      "Established a rigorous automated testing architecture of 500+ Playwright E2E and Vitest unit tests, reducing flakiness 90%.",
      "Tuned PostgreSQL indexing and queries alongside Python/Django calculation engines, cutting database overhead 35% and REST API latency 30%.",
      "Modernized a large, legacy enterprise application, converting complex state flows into declarative RxJS pipelines.",
    ],
    demoUrl: "https://graintrack.com/en/",
    cardType: "high",
  },
  {
    id: "Realis",
    title: "Realis Telegram game",
    subtitle: "Telegram mini-app game",
    role: "Full-stack Developer",
    description:
      "A Telegram game where users can claim and upgrade buildings, earn game currency, and compete with other players in a virtual city.",
    tags: ["React", "TypeScript", "Redux", "Web socket", "Framer motion"],
    highlights: [
      "Engineered a fully responsive and adaptive UI architecture for an engaging Telegram mini-app.",
      "Implemented complex game logic and real-time state updates using Redux and WebSocket connectivity.",
      "Enhanced the user experience with custom animations and smooth transitions using Framer Motion.",
    ],
    demoUrl: "https://realis.network/",
    cardType: "high",
  },
  {
    id: "Bottle",
    title: "Spin the Bottle: Kiss Game",
    subtitle: "Real-Time Multiplayer Social Telegram Mini App",
    role: "Lead Frontend Developer",
    description:
      "A high-performance, real-time multiplayer social game integrated directly into the Telegram messaging platform as a Mini App. Players join virtual tables, spin a physical-simulated bottle to choose interaction targets, chat live, send flying animated gifts, and build friendship connections.",
    tags: [
      "React 19",
      "TypeScript",
      "WebSockets",
      "Framer Motion",
      "Telegram Mini Apps API",
      "PostHog Analytics",
      "i18next",
    ],
    highlights: [
      "Built a low-latency real-time synchronization layer using custom WebSockets to support instant multiplayer player interactions, spins, and turns.",
      "Crafted complex canvas and Framer Motion physical-simulated bottle spinning mechanics and floating heart animations.",
      "Implemented rich social elements including animated gift-flight transitions, global and table-level live chat rooms, and lover pairing compatibility systems.",
      "Designed an immersive onboarding, in-game virtual shop, and referral systems tailored for highly viral mobile-first Telegram user experiences.",
    ],
    cardType: "wide",
  },
];
