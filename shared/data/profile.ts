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
  location: 'Eastbourne, United Kingdom',
  shortBio:
    'With expertise spanning frontend and backend technologies, I build products end to end, from database schema to the last pixel.',
  extendedBio: [
    'Security-conscious Full-Stack Software Engineer with 3+ years designing scalable backend services, optimizing relational databases, and engineering high-performance web interfaces in TypeScript, React, Next.js, Node.js, Python and Django.',
    'Strong in REST APIs, React Query state management, PostgreSQL tuning, Docker, CI/CD, secure SDLC (OWASP Top 10), and automated E2E/unit testing, with recent hands-on evaluation of agentic coding models.',
    'Currently evaluating agentic coding models on a client project, authoring production-shaped engineering tasks and judging model output on correctness, architectural judgment and behaviour across long multi-step agent loops.',
    'Before that I spent a year on an enterprise CTRM platform as one of its technical decision-makers, reviewing every pull request, mentoring the team, and leading the incremental migration of a legacy AngularJS application to TypeScript/React.',
  ],
};
