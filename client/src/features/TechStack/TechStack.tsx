import './TechStack.css';
import { techStackData } from '@shared/data/techStack';

const TechStack = () => {
  return (
    <div className="tech-stack">
      <div className="tech-stack__header">
        <h1 className="tech-stack__main-title">
          Tools & <span className="gradient-text">Technologies</span>
        </h1>
        <p className="tech-stack__main-subtitle">
          A curated collection of technologies I use to bring ideas to life
        </p>
      </div>
      <div className="tech-stack__categories">
        {techStackData.map((category, i) => (
          <div
            className="tech-stack-card"
            key={i}
            style={{ '--category-color': category.color } as React.CSSProperties}
          >
            <div className="tech-stack-card__header">
              <div className="tech-stack-card__marker" style={{ background: category.color }}></div>
              <h3 className="tech-stack-card__title">{category.title}</h3>
            </div>
            <div className="tech-stack-card__tags">
              {category.tags.map((tag) => (
                <span className="tech-stack-card__tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechStack;
