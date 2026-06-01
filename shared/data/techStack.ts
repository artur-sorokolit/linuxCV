export interface TechCategory {
  title: string;
  color: string;
  tags: string[];
}

export const techStackData: TechCategory[] = [
  {
    title: 'Frontend',
    color: '#A651FB',
    tags: [
      'React 19',
      'TypeScript',
      'JavaScript (ES6+)',
      'RxJS',
      'Next.js',
      'AngularJS',
      'Tailwind CSS',
      'HTML5/CSS3',
      'Framer Motion',
      'Vite',
    ],
  },
  {
    title: 'Backend',
    color: '#3C83F6',
    tags: [
      'Node.js',
      'Express.js',
      'Python',
      'Django',
      'FastAPI',
      'REST APIs',
      'WebSockets',
      'Webhooks',
    ],
  },
  {
    title: 'Databases',
    color: '#1FD5F9',
    tags: ['PostgreSQL', 'Redis', 'SQLite3', 'MongoDB'],
  },
  {
    title: 'DevOps & Infrastructure',
    color: '#F59E0B',
    tags: [
      'Docker',
      'Git',
      'GitHub Actions',
      'CI/CD',
      'Linux Admin',
      'Cloudflare Zero Trust',
      'AWS',
    ],
  },
  {
    title: 'Testing & Security',
    color: '#10B981',
    tags: [
      'Playwright',
      'Vitest',
      'E2E Testing',
      'Unit Testing',
      'OWASP Top 10',
      'Secure SDLC',
    ],
  },
];
