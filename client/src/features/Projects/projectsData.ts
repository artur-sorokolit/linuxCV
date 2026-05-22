import avatarImg from '@/shared/assets/images/avatar.svg';
import realisImg from '@/shared/assets/images/Realis.svg';
import project1Img from '@/shared/assets/images/projects1.png';
import project2Img from '@/shared/assets/images/projects2.png';
import project3Img from '@/shared/assets/images/projects3.png';
import graintrackImg from '@/shared/assets/images/Graintrack.svg';
import bottleImg from '@/shared/assets/images/bottle.png';

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  description: string;
  tags: string[];
  image?: string;
  logo: string;
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  cardType: 'wide' | 'high';
}

export const projectsData: Project[] = [
  {
    id: 'linuxcv',
    title: 'linuxCV',
    subtitle: 'Interactive Web-based Operating System Desktop',
    role: 'Lead Full-Stack Developer',
    description:
      'An innovative portfolio application designed to simulate a windowed Linux operating system desktop environment. Visitors can drag, maximize, and minimize folders, converse with a built-in AI Assistant, or view professional details as virtual files.',
    tags: [
      'React 19',
      'TypeScript',
      'Framer Motion',
      'Vanilla CSS',
      'Node.js',
      'SQLite',
      'Gemini LLM',
    ],
    image: project1Img,
    logo: avatarImg,
    highlights: [
      'Engineered a complete windowing layout system with dynamic z-index focusing, drag constraints, and responsive window states.',
      'Integrated an intelligent AI Chatbot powered by Google Gemini API to dynamically answer developer-related inquiries.',
      'Created custom glassmorphism styles with pure CSS variables and smooth system micro-animations.',
    ],
    githubUrl: 'https://github.com/artur-sorokolit/linuxCV',
    demoUrl: 'https://artur-sorokolit.github.io/linuxCV/',
    cardType: 'wide',
  },
  {
    id: 'Graintrack',
    title: 'Graintrack CTRM Enterprise System',
    subtitle: 'High-Performance Commodity Trading & Risk Management Platform',
    role: 'Full-stack Developer',
    description:
      'An enterprise-grade platform built to handle massive financial transactions, real-time physical commodity logistics, trade execution pipelines, and risk management analytics.',
    tags: [
      'React',
      'RxJS',
      'TypeScript',
      'Tailwind CSS',
      'High-Density Grids',
      'State Machines',
      'Angular',
      'Python',
    ],
    image: project3Img,
    logo: graintrackImg,
    highlights: [
      'Designed custom virtualization grids rendering 10k+ rows of real-time trading data with sub-second rendering latency.',
      'Established a rigorous automated testing architecture containing over 100 E2E and Unit test blocks.',
      'Modernized a large, legacy enterprise application, converting complex state flows into declarative RxJS pipelines.',
    ],
    demoUrl: 'https://graintrack.com/en/',
    cardType: 'high',
  },
  {
    id: 'Realis',
    title: 'Realis Telegram game',
    subtitle: 'Telegram mini-app game',
    role: 'Full-stack Developer',
    description:
      'A Telegram game where users can claim and upgrade buildings, earn game currency, and compete with other players in a virtual city.',
    tags: ['React', 'TypeScript', 'Redux', 'Web socket', 'Framer motion'],
    image: project2Img,
    logo: realisImg,
    highlights: [
      'Engineered a fully responsive and adaptive UI architecture for an engaging Telegram mini-app.',
      'Implemented complex game logic and real-time state updates using Redux and WebSocket connectivity.',
      'Enhanced the user experience with custom animations and smooth transitions using Framer Motion.',
    ],
    demoUrl: 'https://realis.network/',
    githubUrl: 'https://github.com/artur-sorokolit',
    cardType: 'high',
  },
  {
    id: 'Bottle',
    title: 'Spin the Bottle: Kiss Game',
    subtitle: 'Real-Time Multiplayer Social Telegram Mini App',
    role: 'Lead Frontend Developer',
    description:
      'A high-performance, real-time multiplayer social game integrated directly into the Telegram messaging platform as a Mini App. Players join virtual tables, spin a physical-simulated bottle to choose interaction targets, chat live, send flying animated gifts, and build friendship connections.',
    tags: [
      'React 19',
      'TypeScript',
      'WebSockets',
      'Framer Motion',
      'Telegram Mini Apps API',
      'PostHog Analytics',
      'i18next',
    ],
    image: '',
    logo: bottleImg,
    highlights: [
      'Built a low-latency real-time synchronization layer using custom WebSockets to support instant multiplayer player interactions, spins, and turns.',
      'Crafted complex canvas and Framer Motion physical-simulated bottle spinning mechanics and floating heart animations.',
      'Implemented rich social elements including animated gift-flight transitions, global and table-level live chat rooms, and lover pairing compatibility systems.',
      'Designed an immersive onboarding, in-game virtual shop, and referral systems tailored for highly viral mobile-first Telegram user experiences.',
    ],
    cardType: 'wide',
  },
];
