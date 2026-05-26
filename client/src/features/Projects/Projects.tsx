import { useState } from 'react';
import { useOS } from '@/core/os/OSContext';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Code } from 'lucide-react';
import { type Project, projectsData } from './projectsData';
import './Projects.css';

const Projects = () => {
  const { openWindow, isMobile } = useOS();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  if (isMobile && activeProject) {
    return <ProjectDetail project={activeProject} onBack={() => setActiveProject(null)} />;
  }

  return (
    <div className="projects-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="projects-grid-view"
      >
        <div className="projects-explorer-header">
          <div className="projects-explorer-path">
            <span className="path-segment">📁 root</span>
            <span className="path-separator">/</span>
            <span className="path-segment active">📂 projects</span>
          </div>
          <div className="projects-explorer-info">{projectsData.length} items</div>
        </div>

        <div className="projects-grid">
          {projectsData.map((project) => (
            <div
              className="project-folder-icon"
              key={project.id}
              onClick={() => {
                if (isMobile) {
                  setActiveProject(project);
                } else {
                  openWindow(
                    `project-${project.id}`,
                    project.title,
                    <ProjectDetail project={project} />
                  );
                }
              }}
            >
              <div className="folder-icon-wrapper">
                <svg className="folder-svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
                  {/* Back cover */}
                  <path
                    className="folder-back"
                    d="M6 16C6 13.7909 7.79086 12 10 12H24L31 19H60C62.2091 19 64 20.7909 64 23V56C64 58.2091 62.2091 60 60 60H10C7.79086 60 6 58.2091 6 56V16Z"
                    fill={`url(#folderBackGrad-${project.id})`}
                  />
                  {/* Front cover */}
                  <path
                    className="folder-front"
                    d="M6 24C6 21.7909 7.79086 20 10 20H60C62.2091 20 64 21.7909 64 24V56C64 58.2091 62.2091 60 60 60H10C7.79086 60 6 58.2091 6 56V24Z"
                    fill={`url(#folderFrontGrad-${project.id})`}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1.2"
                  />

                  <defs>
                    <linearGradient
                      id={`folderBackGrad-${project.id}`}
                      x1="6"
                      y1="12"
                      x2="64"
                      y2="60"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#a855f7" stopOpacity="0.45" />
                      <stop offset="1" stopColor="#4facfe" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient
                      id={`folderFrontGrad-${project.id}`}
                      x1="6"
                      y1="20"
                      x2="64"
                      y2="60"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#a855f7" stopOpacity="0.3" />
                      <stop offset="1" stopColor="#00f2fe" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating badge over folder front flap */}
                <div className="folder-logo-badge">
                  <img
                    src={project.logo}
                    alt={project.title}
                    className={`folder-logo-img logo-img--${project.id}`}
                  />
                </div>
              </div>
              <span className="folder-label">{project.title}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

interface ProjectDetailProps {
  project: Project;
  onBack?: () => void;
}

export const ProjectDetail = ({ project, onBack }: ProjectDetailProps) => {
  const { closeWindow } = useOS();

  const hasImage = !!project.image;
  const hasMedia = hasImage || !!project.githubUrl || !!project.demoUrl;

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      closeWindow(`project-${project.id}`);
    }
  };

  return (
    <div className="projects-container">
      <div className="project-detail-view">
        <button className="project-detail-back" onClick={handleBackClick}>
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>

        <div
          className={`project-detail-layout ${!hasMedia ? 'project-detail-layout--no-media' : ''}`}
        >
          {/* Left Pane - Image and Links */}
          {hasMedia && (
            <div className="project-detail-media">
              {hasImage && (
                <div className="project-detail-img-container">
                  <img src={project.image} alt={project.title} className="project-detail-img" />
                </div>
              )}
              {(project.githubUrl || project.demoUrl) && (
                <div className="project-detail-actions">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-btn project-btn--secondary"
                    >
                      <Code size={16} />
                      Source Code
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-btn project-btn--primary"
                    >
                      <ExternalLink size={16} />
                      Open
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Pane - Rich Specifications */}
          <div className="project-detail-info">
            <div className="project-detail-header">
              <div className="project-detail-role">{project.role}</div>
              <h1 className="project-detail-title">{project.title}</h1>
              <p className="project-detail-subtitle">{project.subtitle}</p>
            </div>

            <div className="project-detail-section">
              <h3 className="project-detail-section-title">Overview</h3>
              <p className="project-detail-description">{project.description}</p>
            </div>

            <div className="project-detail-section">
              <h3 className="project-detail-section-title">Tech Stack</h3>
              <div className="project-detail-tags">
                {project.tags.map((tag) => (
                  <span className="project-detail-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="project-detail-section">
              <h3 className="project-detail-section-title">Key Contributions & Architecture</h3>
              <ul className="project-detail-highlights">
                {project.highlights.map((highlight, index) => (
                  <li key={index} className="project-detail-highlight-item">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
