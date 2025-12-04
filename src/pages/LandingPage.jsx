import { useNavigate } from 'react-router-dom';
import Dither from '../components/Dither';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Dither Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
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
      <nav className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center justify-between px-6 py-3 bg-[rgba(30,30,30,0.6)] backdrop-blur-[20px] border border-white/10 rounded-[50px] z-[100] min-w-[600px] md:min-w-auto md:w-[calc(100%-40px)] md:px-4">
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-white text-base font-medium tracking-tight">The Hack Collective</span>
        </div>
        <div className="flex gap-6 md:gap-3">
          <a href="https://chat.whatsapp.com/EWCPnquUzXD9uppsSuQFVk" target="_blank" rel="noopener noreferrer" className="text-white/80 no-underline text-sm font-normal transition-colors hover:text-white md:text-xs">
            Whatsapp
          </a>
          <a href="https://luma.com/thehackcollective" target="_blank" rel="noopener noreferrer" className="text-white/80 no-underline text-sm font-normal transition-colors hover:text-white md:text-xs">
            Luma
          </a>
          <a href="https://www.linkedin.com/company/the-hack-collective" target="_blank" rel="noopener noreferrer" className="text-white/80 no-underline text-sm font-normal transition-colors hover:text-white md:text-xs">
            LinkedIn
          </a>
          <a href="https://www.instagram.com/hackcollective" target="_blank" rel="noopener noreferrer" className="text-white/80 no-underline text-sm font-normal transition-colors hover:text-white md:text-xs">
            Instagram
          </a>
          <a href="https://x.com/hackcollective" target="_blank" rel="noopener noreferrer" className="text-white/80 no-underline text-sm font-normal transition-colors hover:text-white md:text-xs">
            X
          </a>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
        <h1 className="text-white text-5xl font-semibold leading-tight mb-8 tracking-tight md:text-3xl md:px-5">
          Hackathons served on your<br />front door. Wanna find out?
        </h1>
        <div className="flex gap-4 justify-center md:flex-col md:px-10">
          <button className="px-7 py-3.5 bg-white text-black border-none rounded-[30px] text-[15px] font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]" onClick={() => navigate('/tracker')}>
            Visit Tracker
          </button>
        </div>
      </div>

    </div>
  );
}
