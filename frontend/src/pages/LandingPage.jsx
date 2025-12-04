import { useNavigate } from 'react-router-dom';
import Dither from '../components/Dither';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Dither Background */}
      <div className="dither-background">
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Glass Navigation Bar */}
      <nav className="glass-nav">
        <div className="nav-logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="logo-text">The Hack Collective</span>
        </div>
        <div className="nav-links">
          <a href="https://chat.whatsapp.com/BZGHqYIV25rIiZpV1Numfb" target="_blank" rel="noopener noreferrer" className="nav-link">
            Whatsapp
          </a>
          <a href="https://lu.ma/thehackcollective" target="_blank" rel="noopener noreferrer" className="nav-link">
            Luma
          </a>
          <a href="https://www.linkedin.com/company/the-hack-collective" target="_blank" rel="noopener noreferrer" className="nav-link">
            LinkedIn
          </a>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-icon">///</span>
          <span>New Background</span>
        </div>
        <h1 className="hero-title">
          Hackathons served on your<br />front door. Wanna find out?
        </h1>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => navigate('/tracker')}>
            Visit Tracker
          </button>
          <button className="btn-secondary">
            Learn More
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <span className="footer-text">Demo Content</span>
        <div className="footer-toggle">
          <span className="toggle-dot"></span>
        </div>
      </div>
    </div>
  );
}
