import './Experience.css';
import factoryIcon from '@/shared/assets/icons/factory.svg';
import calendarIcon from '@/shared/assets/icons/calendar.svg';
import { experienceData } from '@shared/data/experience';

const Experience = () => {
  return (
    <div className="experience-page">
      <header className="experience-header">
        <h1>
          Professional <span className="text-accent">Journey</span>
        </h1>
      </header>

      <div className="experience-container">
        <div className="experience-list">
          {experienceData.map((item) => (
            <div key={item.id} className="experience-card">
              <div className="card-top">
                <div className="company-info">
                  <img src={factoryIcon} alt="" className="card-icon" />
                  <span>{item.company}</span>
                </div>
                <div className="period-info">
                  <img src={calendarIcon} alt="" className="card-icon" />
                  <span>{item.period}</span>
                </div>
              </div>

              <h2 className="card-title">{item.title}</h2>

              <p className="card-description">{item.description}</p>

              <div className="card-tags">
                {item.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="experience-timeline">
          <div className="timeline-line"></div>
          <div className="timeline-markers">
            {experienceData.map((item, index) => (
              <div key={item.id} className={`marker ${index === 0 ? 'active' : ''}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
