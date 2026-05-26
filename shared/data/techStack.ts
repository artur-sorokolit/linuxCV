export interface TechCategory {
  title: string;
  color: string;
  tags: string[];
}

export const techStackData: TechCategory[] = [
  {
    title: 'Frontend',
    color: '#A651FB',
    tags: ['React', 'TypeScript', 'Vite', 'Framer Motion', 'CSS'],
  },
  {
    title: 'Backend',
    color: '#3C83F6',
    tags: ['Node.js', 'Express', 'Python', 'Django', 'FastAPI', 'PostgreSQL'],
  },
  {
    title: 'Databases',
    color: '#1FD5F9',
    tags: ['PostgreSQL', 'MongoDB', 'Redis'],
  },
  {
    title: 'DevOps & Tools',
    color: '#1FD5F9',
    tags: ['Docker', 'Git', 'AWS', 'CI/CD', 'Linux'],
  },
];
