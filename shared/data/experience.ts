export interface ExperienceItem {
  id: number;
  company: string;
  period: string;
  title: string;
  description: string;
  tags: string[];
}

export const experienceData: ExperienceItem[] = [
  {
    id: 1,
    company: 'UITOP (B2B software development & product design)',
    period: 'Jul 2026 - Present',
    title: 'Software Engineer',
    description:
      'Outstaffing engagement on a client project (Surge AI), working close to the client team on evaluation of agentic coding models. Stress-test agentic coding models on real engineering work: find where they break, reproduce the failure, and document the failure mode. Author realistic coding tasks and evaluation scenarios across full-stack work in TypeScript/React and Node.js/Python, so model performance is measured on production-shaped problems instead of toy prompts. Assess model output quality end to end: correctness, architectural judgment, test coverage, and how the model behaves in long multi-step agent loops.',
    tags: [
      'Agentic Model Evaluation',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'LLM Tooling',
      'Prompt Engineering',
    ],
  },
  {
    id: 2,
    company: 'Graintrack (CTRM System)',
    period: 'Aug 2025 - Jul 2026',
    title: 'Full-Stack Software Engineer',
    description:
      "Engineered a complex React 19 / RxJS data grid for bulk commodity operations, managing 4,000+ concurrent dynamic data points at sub-16ms render times, with React Query (TanStack Query) for efficient server-state caching. Built calculation engines in Python/Django and optimized slow PostgreSQL queries via advanced indexing and query rewriting, reducing query overhead 35% and REST API latency 30% under peak transaction loads. Led internal security audits aligning full-stack systems with OWASP Top 10 and established secure database and API authorization controls for transaction calculation modules. As one of the team's technical decision-makers, drove architecture decisions, reviewed every pull request, mentored teammates, and partnered with product and design to scope and deliver features. Developed and maintained 500+ E2E (Playwright) and unit (Vitest) tests, reducing flakiness 90%, and used AI-assisted workflows to accelerate refactoring and testing pipelines. Led incremental migration of legacy AngularJS (1.8) modules to TypeScript and React, improving client-server data flow and observability.",
    tags: [
      'React 19',
      'RxJS',
      'TypeScript',
      'React Query',
      'Python',
      'Django',
      'PostgreSQL',
      'AngularJS',
      'Playwright',
      'Vitest',
    ],
  },
  {
    id: 3,
    company: 'Independent / Contract',
    period: 'Jun 2023 - Jul 2025',
    title: 'Full-Stack Developer',
    description:
      'Built high-performance, consumer-facing web applications for early-stage startups using React 19 and Next.js, including gaming Telegram Web Apps, optimizing cross-browser performance. Engineered fluid 60 FPS UI animations, tuning garbage collection and state updates within constrained mobile WebView environments. Built and deployed a split-architecture full-stack app — React frontend on a global CDN, Node.js/Express backend and database secured behind Cloudflare Zero Trust with MFA and no open public ports. Integrated LLM APIs (OpenAI, Anthropic, Gemini) into products and built a reusable LLM context-management system of rules, skills, commands and MCP integrations. Worked asynchronously across projects, extending existing codebases and automating deployments with rsync-over-SSH scripts.',
    tags: [
      'React 19',
      'Next.js',
      'Node.js',
      'Express',
      'Telegram Web Apps',
      'Cloudflare Zero Trust',
      'LLM Integration',
    ],
  },
  {
    id: 4,
    company: 'Realis',
    period: 'Jan 2025 - Jun 2025',
    title: 'Frontend Developer (Contract)',
    description:
      'Developed interactive game features for a crypto-focused Telegram Web App serving ~2,000 users, using real-time WebSockets and Redux, and cut initial page load time 30% on low-end mobile devices. Delivered 5+ interactive React interface features per two-week sprint within rapid product development cycles, ensuring smooth 60 FPS animation rendering and consistent layout across iOS, Android and desktop viewports.',
    tags: ['React', 'TypeScript', 'Redux', 'WebSockets', 'Telegram Web Apps', 'Performance'],
  },
];
