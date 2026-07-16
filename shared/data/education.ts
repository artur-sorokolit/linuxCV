export interface CourseItem {
  name: string;
  level: string;
}

export interface EducationDegree {
  title: string;
  institution: string;
  department: string;
  year: number;
  specialization: string;
}

export const educationDegree: EducationDegree = {
  title: 'Bachelor of Science in Cybersecurity',
  institution: 'Kyiv Aviation Institute (KAI), formerly NAU',
  department: 'Faculty of Information Security & Cybersecurity (BICS)',
  year: 2026,
  specialization: 'Cybersecurity & Information Protection',
};

export const coursesData: CourseItem[] = [
  { name: 'Python', level: 'Advanced' },
  { name: 'JavaScript / TypeScript', level: 'Advanced' },
  { name: 'React & Angular', level: 'Advanced' },
  { name: 'Node.js & Express', level: 'Intermediate' },
];
