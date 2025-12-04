import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TrackerPage from './pages/TrackerPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
