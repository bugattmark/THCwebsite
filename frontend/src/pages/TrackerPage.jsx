import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lanyard from '../components/Lanyard';
import './TrackerPage.css';

// Sample events data (will be replaced with actual scraper data)
const sampleEvents = [
  {
    id: 1,
    name: "NeurIPS 2025 Hackathon",
    date: "December 03, 2025",
    time: "09:00 AM",
    location: "San Diego Convention Center",
    url: "https://lu.ma/neurips",
    category: "hackathon",
    source: "luma"
  },
  {
    id: 2,
    name: "AI Community Wrap Party",
    date: "December 16, 2025",
    time: "06:00 PM",
    location: "London, UK",
    url: "https://lu.ma/evt-HBfBcLLoje5ol80",
    category: "non-hackathon",
    source: "luma"
  },
  {
    id: 3,
    name: "Claude Code Meetup London",
    date: "December 10, 2025",
    time: "05:30 PM",
    location: "London, UK",
    url: "https://lu.ma/evt-iETYy0ZR3syvCRM",
    category: "non-hackathon",
    source: "luma"
  },
  {
    id: 4,
    name: "Agentic Hackathon with SpoonOS",
    date: "December 05, 2025",
    time: "03:00 PM",
    location: "Encode Hub, London",
    url: "https://lu.ma/evt-LJ8WvPEanAUspMn",
    category: "hackathon",
    source: "luma"
  },
  {
    id: 5,
    name: "ETHGlobal Bangkok",
    date: "November 15, 2025",
    time: "09:00 AM",
    location: "Bangkok, Thailand",
    url: "https://ethglobal.com/bangkok",
    category: "hackathon",
    source: "non-luma"
  },
  {
    id: 6,
    name: "MCP Connect with Anthropic",
    date: "December 09, 2025",
    time: "06:00 PM",
    location: "London, UK",
    url: "https://lu.ma/evt-akj8aIyvRbCSiAf",
    category: "non-hackathon",
    source: "luma"
  },
  {
    id: 7,
    name: "ETHLDN: Fusaka Upgrade",
    date: "December 04, 2025",
    time: "06:00 PM",
    location: "Encode Hub, London",
    url: "https://lu.ma/evt-SDCizEJfrTgAOGE",
    category: "non-hackathon",
    source: "luma"
  },
  {
    id: 8,
    name: "vLLM Party @ NeurIPS 2025",
    date: "December 04, 2025",
    time: "02:00 AM",
    location: "Coin-Op Game Room, San Diego",
    url: "https://lu.ma/evt-qfl8J9IP60ycbwa",
    category: "non-hackathon",
    source: "luma"
  }
];

export default function TrackerPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(sampleEvents);
  const [filteredEvents, setFilteredEvents] = useState(sampleEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    hackathon: true,
    'non-hackathon': true,
    'non-luma': true
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    let result = events;

    // Apply category/source filters
    result = result.filter(event => {
      if (event.source === 'non-luma') {
        return filters['non-luma'];
      }
      return filters[event.category];
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(result);
  }, [events, filters, searchQuery]);

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  return (
    <div className="tracker-page">
      {/* Lanyard Section - Left 25% */}
      <div className="lanyard-section">
        <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
        <button className="back-button" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Events Section - Right 75% */}
      <div className="events-section">
        {/* Header */}
        <div className="events-header">
          <h1 className="events-title">Event Tracker</h1>
          <p className="events-subtitle">Find hackathons and tech events</p>
        </div>

        {/* Controls */}
        <div className="events-controls">
          {/* Search */}
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filters */}
          <div className="filters-container">
            <button
              className={`filter-btn ${filters.hackathon ? 'active' : ''}`}
              onClick={() => toggleFilter('hackathon')}
            >
              Hackathons
            </button>
            <button
              className={`filter-btn ${filters['non-hackathon'] ? 'active' : ''}`}
              onClick={() => toggleFilter('non-hackathon')}
            >
              Non-Hackathons
            </button>
            <button
              className={`filter-btn ${filters['non-luma'] ? 'active' : ''}`}
              onClick={() => toggleFilter('non-luma')}
            >
              Non-Luma
            </button>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Events List/Grid */}
        <div className={`events-container ${viewMode}`}>
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <p>No events found matching your criteria</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="event-card"
              >
                <div className="event-tags">
                  <span className={`event-tag ${event.category}`}>
                    {event.category === 'hackathon' ? 'Hackathon' : 'Event'}
                  </span>
                  {event.source === 'non-luma' && (
                    <span className="event-tag non-luma">Non-Luma</span>
                  )}
                </div>
                <h3 className="event-name">{event.name}</h3>
                <div className="event-details">
                  <div className="event-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{event.date}</span>
                  </div>
                  <div className="event-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span>{event.time}</span>
                  </div>
                  {event.location && (
                    <div className="event-detail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
