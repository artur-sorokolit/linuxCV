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
    company: 'Graintrack (CTRM System)',
    period: 'Aug 2025 - Present',
    title: 'Full-Stack Software Engineer',
    description:
      "Delivered features across a CTRM platform's core domains — logistics, warehouse management, contract flow, passports, sales/purchases, calculations, analytics and reporting — including role-based access control with fine-grained permissions. Engineered a React 19 / RxJS data grid holding 4,000+ concurrent live data points at sub-16ms render times, with business logic kept in an RxJS services layer and React Query caching. Built calculation engines in Python/Django with Celery workers, refactored a legacy raw-SQL-in-viewsets antipattern toward maintainable ORM code, and tuned PostgreSQL indexing and queries to cut database overhead 35% and REST API latency 30%. Co-designed an EARS-based requirements tree pinned in code, and as Head of QA owned 500+ Playwright E2E and Vitest unit tests, reducing flakiness 90%. Within 8 months became second final approver alongside the CTO, reviewing every PR, mentoring, and leading the incremental migration of legacy AngularJS to TypeScript/React via the strangler pattern. Led internal security audits against OWASP Top 10 and established database and API authorization controls including Row-Level Security.",
    tags: [
      'React 19',
      'RxJS',
      'TypeScript',
      'React Query',
      'Python',
      'Django',
      'Celery',
      'PostgreSQL',
      'Playwright',
      'Vitest',
    ],
  },
  {
    id: 2,
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
    id: 3,
    company: 'Realis',
    period: 'Jan 2025 - Jun 2025',
    title: 'Frontend Developer (Contract)',
    description:
      'Developed interactive game features for a crypto-focused Telegram Web App serving ~2,000 users, using real-time WebSockets and Redux, and cut initial page load time 30% on low-end mobile devices. Delivered 5+ interactive React interface features per two-week sprint within rapid product development cycles, ensuring smooth 60 FPS animation rendering and consistent layout across iOS, Android and desktop viewports.',
    tags: ['React', 'TypeScript', 'Redux', 'WebSockets', 'Telegram Web Apps', 'Performance'],
  },
];
