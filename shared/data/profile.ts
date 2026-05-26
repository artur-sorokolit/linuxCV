export interface ProfileData {
  name: string;
  role: string;
  shortBio: string;
  extendedBio: string[];
}

export const profileData: ProfileData = {
  name: "Artur Sorokolit",
  role: "Full-Stack Developer & Frontend Architect",
  shortBio:
    "With expertise spanning frontend and backend technologies, I create seamless experiences from concept to deployment.",
  extendedBio: [
    "Results-oriented Full-Stack Developer with strong expertise in frontend architecture and building enterprise-grade CTRM (Commodity Trading and Risk Management) systems.",
    "Proficient in modernizing legacy applications and developing high-performance, data-intensive UIs using React 19, RxJS, and TypeScript.",
    "Demonstrated ability to translate complex business requirements into scalable technical solutions, establish robust testing environments (>100 E2E/Unit tests), and optimize complex state management for financial and logistics operations.",
  ],
};
