import { useOS } from '@/core/os/OSContext';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Code } from 'lucide-react';
import { type Project, projectsData } from './projectsData';
import './Projects.css';

const Projects = () => {
  const { openWindow } = useOS();

  return (
    <div className="projects-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="projects-grid-view"
      >
        <div className="projects-grid-header">
          <h2 className="projects-grid-title">Featured Projects</h2>
        </div>

        <div className="projects-grid">
          {projectsData.map((project) => (
            <div
              className="project-grid-card"
              key={project.id}
              onClick={() => {
                openWindow(
                  `project-${project.id}`,
                  project.title,
                  <ProjectDetail project={project} />
                );
              }}
            >
              <div className="project-grid-card__image-wrapper">
                <img src={project.logo} alt={project.title} className="project-grid-card__image" />
              </div>
              <div className="project-grid-card__caption">
                <span className="project-grid-card__caption-title">{project.title}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export const ProjectDetail = ({ project }: { project: Project }) => {
  const { closeWindow } = useOS();

  const hasImage = !!project.image;
  const hasMedia = hasImage || !!project.githubUrl || !!project.demoUrl;

  return (
    <div className="projects-container">
      <div className="project-detail-view">
        <button
          className="project-detail-back"
          onClick={() => closeWindow(`project-${project.id}`)}
        >
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
