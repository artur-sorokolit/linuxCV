import profileIcon from '@/shared/assets/icons/profile.svg';
import experienceIcon from '@/shared/assets/icons/experience.svg';
import educationIcon from '@/shared/assets/icons/education.svg';
import techIcon from '@/shared/assets/icons/tech.svg';
import contactIcon from '@/shared/assets/icons/contact.svg';
import projectsIcon from '@/shared/assets/icons/projects.svg';
import type { AppConfig } from '@/shared/types/app';

import AboutMe from '@/features/AboutMe/AboutMe';
import Experience from '@/features/Experience/Experience';
import Education from '@/features/Education/Education';
import TechStack from '@/features/TechStack/TechStack';
import Contact from '@/features/Contact/Contact';
import Chat from '@/features/Chat/Chat';
import Projects from '@/features/Projects/Projects';
import chatIcon from '@/shared/assets/icons/chat.svg';

import { createElement } from 'react';

export const appConfigs: AppConfig[] = [
  {
    id: 'chat',
    title: 'AI Assistant',
    icon: chatIcon,
    content: createElement(Chat),
  },
  {
    id: 'about',
    title: 'About Me',
    icon: profileIcon,
    content: createElement(AboutMe),
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: experienceIcon,
    content: createElement(Experience),
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: projectsIcon,
    content: createElement(Projects),
  },
  {
    id: 'education',
    title: 'Education',
    icon: educationIcon,
    content: createElement(Education),
  },
  {
    id: 'tech',
    title: 'Tech Stack',
    icon: techIcon,
    content: createElement(TechStack),
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: contactIcon,
    content: createElement(Contact),
  },
];
