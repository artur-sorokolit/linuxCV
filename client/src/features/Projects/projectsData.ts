import { projectsData as sharedProjectsData } from '@shared/data/projects';
import avatarImg from '@/shared/assets/images/avatar.svg';
import realisImg from '@/shared/assets/images/Realis.svg';
import project1Img from '@/shared/assets/images/projects1.png';
import project2Img from '@/shared/assets/images/projects2.png';
import project3Img from '@/shared/assets/images/projects3.png';
import graintrackImg from '@/shared/assets/images/Graintrack.svg';
import bottleImg from '@/shared/assets/images/bottle.png';

export type { Project } from '@shared/data/projects';

const logoMap: Record<string, string> = {
  linuxcv: avatarImg,
  Graintrack: graintrackImg,
  Realis: realisImg,
  Bottle: bottleImg,
};

const imageMap: Record<string, string> = {
  linuxcv: project1Img,
  Graintrack: project3Img,
  Realis: project2Img,
  Bottle: '',
};

export const projectsData = sharedProjectsData.map((p) => ({
  ...p,
  logo: logoMap[p.id] || '',
  image: imageMap[p.id] || '',
}));
