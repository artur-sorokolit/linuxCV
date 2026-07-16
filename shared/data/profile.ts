export interface ProfileData {
  name: string;
  role: string;
  location: string;
  shortBio: string;
  extendedBio: string[];
}

export const profileData: ProfileData = {
  name: 'Artur Sorokolit',
  role: 'Full-Stack Software Engineer',
  location: 'Kyiv, Ukraine · Open to relocation',
  shortBio:
    'With expertise spanning frontend and backend technologies, I create seamless experiences from concept to deployment.',
  extendedBio: [
    'Security-conscious Full-Stack Software Engineer with 3+ years designing scalable backend services, optimizing relational databases, and engineering high-performance web interfaces in TypeScript, React, Next.js, Node.js, Python and Django.',
    'Strong in REST APIs, React Query state management, PostgreSQL tuning, Docker, CI/CD, secure SDLC (OWASP Top 10), and automated E2E/unit testing.',
    'Currently building an enterprise CTRM platform, where I own architecture and code review across the codebase, mentor the team, and lead the incremental migration of a legacy AngularJS application to TypeScript/React.',
  ],
};
