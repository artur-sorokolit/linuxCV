import { useWindowInfo } from '@/core/window/WindowInfoContext';
import mePhoto from '@/shared/assets/images/me.webp';
import { profileData } from '@shared/data';
import './AboutMe.css';

const AboutMe = () => {
  const { isMaximized } = useWindowInfo();

  return (
    <div className={`about-me${isMaximized ? ' about-me--maximized' : ''}`}>
      <div className="about-me__photo">
        <img src={mePhoto} alt={profileData.name} className="about-me__photo-img" />
      </div>

      <div className="about-me__info">
        <span className="about-me__greeting">Hi, I&apos;m Artur,</span>
        <h2 className="about-me__title">
          <span className="gradient-text">
            A Full-Stack <br />
            Developer
          </span>
        </h2>
        <p className="about-me__location">{profileData.location}</p>
        <p className="about-me__bio">{profileData.shortBio}</p>

        {isMaximized && (
          <div className="about-me__bio--extended">
            {profileData.extendedBio.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutMe;
