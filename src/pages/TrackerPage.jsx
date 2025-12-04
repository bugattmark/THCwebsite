import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import Lanyard from '../components/Lanyard';
import EventCalendar from '../components/EventCalendar';
import EventMap from '../components/EventMap';

// Import Convex API from convex.ts
import { api } from '../convex';

// Wrapper component that safely uses useQuery
// This component only renders when we have a valid query reference
function ConvexQueryWrapper({ queryRef, onData }) {
  // useQuery is called unconditionally here (hooks rule satisfied)
  // Returns undefined while loading, null if no data, or array if data exists
  // Pass empty object {} as args since the query takes no arguments
  const data = useQuery(queryRef, {});
  
  useEffect(() => {
    if (onData) {
      // Pass data (can be undefined, null, or array)
      onData(data);
    }
  }, [data, onData]);
  
  return null; // This component doesn't render anything
}

export default function TrackerPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    hackathon: true,
    'non-hackathon': true,
    'non-luma': false
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [convexEvents, setConvexEvents] = useState(undefined);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or default to 80px
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarWidth');
      return saved ? parseInt(saved, 10) : 80;
    }
    return 80;
  });
  const [isResizing, setIsResizing] = useState(false);
  
  // Reset loading state on mount to handle refresh
  useEffect(() => {
    setLoading(true);
    setEvents([]);
    setFilteredEvents([]);
    setConvexEvents(undefined);
  }, []);
  
  // Save sidebar width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    }
  }, [sidebarWidth]);
  
  // Handle sidebar resize
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    // Constrain between 60px and 400px
    const constrainedWidth = Math.max(60, Math.min(400, newWidth));
    setSidebarWidth(constrainedWidth);
  }, [isResizing]);
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);
  
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Fetch events from Convex database
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  
  // Check if we have a valid API and query reference
  // api.events.list is a FunctionReference object, not a function
  const hasConvexUrl = convexUrl && convexUrl.startsWith("http");
  const hasValidQuery = hasConvexUrl && api?.events?.list;
  
  // Always render the content component
  // Conditionally render the query wrapper only when we have a valid query
  return (
    <>
      {/* Only render query wrapper when we have a valid query reference */}
      {hasValidQuery && (
        <ConvexQueryWrapper 
          queryRef={api.events.list} 
          onData={setConvexEvents}
        />
      )}
      <TrackerPageContent 
        convexEvents={convexEvents}
        navigate={navigate}
        events={events}
        setEvents={setEvents}
        filteredEvents={filteredEvents}
        setFilteredEvents={setFilteredEvents}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        convexUrl={convexUrl}
        sidebarWidth={sidebarWidth}
        isResizing={isResizing}
        onResizeStart={handleMouseDown}
      />
    </>
  );
}

// Main content component
function TrackerPageContent({
  convexEvents,
  navigate,
  events,
  setEvents,
  filteredEvents,
  setFilteredEvents,
  searchQuery,
  setSearchQuery,
  loading,
  setLoading,
  error,
  setError,
  filters,
  setFilters,
  viewMode,
  setViewMode,
  convexUrl,
  sidebarWidth,
  isResizing,
  onResizeStart
}) {
  
  // Process Convex events when they change
  useEffect(() => {
    // If Convex is not configured, show message
    if (!convexUrl || !convexUrl.startsWith("http")) {
      if (events.length === 0 && !error) {
        setTimeout(() => {
          setError("Convex database not configured. Please set VITE_CONVEX_URL environment variable.");
          setEvents([]);
          setFilteredEvents([]);
          setLoading(false);
        }, 0);
      } else {
        setTimeout(() => {
          setLoading(false);
        }, 0);
      }
      return;
    }
    
    // Check if we're still loading (undefined means loading)
    if (convexEvents === undefined) {
      // Still loading from Convex - keep loading state
      return;
    }
    
    // Process events - use setTimeout to avoid setState in effect warning
    const processEvents = () => {
      try {
        // Always set loading to false once we have a response (even if null or empty)
        setLoading(false);
        setError(null);
        
        // convexEvents can be null (no data) or an array
        if (convexEvents && Array.isArray(convexEvents) && convexEvents.length > 0) {
          // Transform Convex events to match expected format
          const eventsWithIds = convexEvents.map((event, index) => ({
            ...event,
            id: event._id || `event-${index}`,
            category: event.category || (event.name?.toLowerCase().includes('hackathon') ? 'hackathon' : 'non-hackathon'),
            source: event.source || 'luma'
          }));
          
          setEvents(eventsWithIds);
          setFilteredEvents(eventsWithIds);
        } else {
          // No events in database (null or empty array)
          setEvents([]);
          setFilteredEvents([]);
        }
      } catch (err) {
        setError(err?.message || 'Error loading events');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };
    
    // Use setTimeout to avoid setState in effect warning
    const timeoutId = setTimeout(processEvents, 0);
    return () => clearTimeout(timeoutId);
  }, [convexEvents, convexUrl, events.length, error, loading]);

  // Memoize filtered events for performance
  const filteredEventsMemo = useMemo(() => {
    let result = events;

    // Apply category/source filters - only show events that match active filters
    result = result.filter(event => {
      // Check if event matches any active filter
      if (event.source === 'non-luma') {
        return filters['non-luma'];
      }
      // For luma events, check category filter
      if (event.category === 'hackathon') {
        return filters.hackathon;
      }
      if (event.category === 'non-hackathon') {
        return filters['non-hackathon'];
      }
      // Default: show if no specific category (shouldn't happen, but safe fallback)
      return true;
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [events, filters, searchQuery]);

  // Update filtered events when memoized value changes
  useEffect(() => {
    setFilteredEvents(filteredEventsMemo);
  }, [filteredEventsMemo, events.length, filters, searchQuery]);

  // Memoize toggleFilter with useCallback - ensure at least one filter is always active
  const toggleFilter = useCallback((filterName) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterName]: !prev[filterName]
      };
      // Ensure at least one filter is active
      const hasActiveFilter = Object.values(newFilters).some(v => v === true);
      if (!hasActiveFilter) {
        // If all filters would be off, keep the clicked one on
        return {
          ...prev,
          [filterName]: true
        };
      }
      return newFilters;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize view mode toggle
  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if mobile viewport with state to handle resize
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize back button handler
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="flex w-screen min-h-screen bg-black text-white overflow-x-hidden relative">
        {!isMobile && (
          <>
            <div className="h-screen sticky top-0 left-0 border-r border-white/10 overflow-hidden shrink-0 flex items-center justify-center" style={{ width: `${sidebarWidth}px` }}>
              <Lanyard position={[0, 0, 25]} gravity={[0, -40, 0]} fov={25} />
              <button className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs cursor-pointer transition-colors hover:bg-white/20 z-[100]" onClick={handleBack}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div 
              className="w-1 h-full sticky top-0 cursor-col-resize hover:bg-white/20 transition-colors z-50 flex items-center justify-center group"
              onMouseDown={onResizeStart}
              style={{ left: `${sidebarWidth}px` }}
            >
              <div className="w-0.5 h-12 bg-white/30 group-hover:bg-white/60 rounded-full"></div>
            </div>
          </>
        )}
        <div className={`flex-1 flex flex-col p-6 overflow-y-auto overflow-x-hidden h-screen max-h-screen relative scroll-smooth ${isMobile ? 'w-full h-auto min-h-screen overflow-y-visible p-4' : ''}`}>
          <div className="flex justify-center items-center h-full flex-col gap-4">
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-screen min-h-screen bg-black text-white overflow-x-hidden relative">
        {!isMobile && (
          <>
            <div className="h-screen sticky top-0 left-0 border-r border-white/10 overflow-hidden shrink-0 flex items-center justify-center" style={{ width: `${sidebarWidth}px` }}>
              <Lanyard position={[0, 0, 25]} gravity={[0, -40, 0]} fov={25} />
              <button className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs cursor-pointer transition-colors hover:bg-white/20 z-[100]" onClick={handleBack}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div 
              className="w-1 h-full sticky top-0 cursor-col-resize hover:bg-white/20 transition-colors z-50 flex items-center justify-center group"
              onMouseDown={onResizeStart}
              style={{ left: `${sidebarWidth}px` }}
            >
              <div className="w-0.5 h-12 bg-white/30 group-hover:bg-white/60 rounded-full"></div>
            </div>
          </>
        )}
        <div className={`flex-1 flex flex-col p-6 overflow-y-auto overflow-x-hidden h-screen max-h-screen relative scroll-smooth ${isMobile ? 'w-full h-auto min-h-screen overflow-y-visible p-4' : ''}`}>
          <div className="flex justify-center items-center h-full flex-col gap-4">
            <p className="text-[#ff6b6b]">Error loading events: {error}</p>
            <button 
              onClick={handleRetry} 
              className="px-4 py-2 bg-[#4dabf7] text-white border-none rounded cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen min-h-screen bg-black text-white overflow-x-hidden relative">
      {!isMobile && (
        <>
          <div className="h-screen sticky top-0 left-0 border-r border-white/10 overflow-hidden shrink-0 flex items-center justify-center" style={{ width: `${sidebarWidth}px` }}>
            <Lanyard position={[0, 0, 25]} gravity={[0, -40, 0]} fov={25} />
            <button className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs cursor-pointer transition-colors hover:bg-white/20 z-[100]" onClick={handleBack}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div 
            className={`w-1 h-full sticky top-0 cursor-col-resize transition-colors z-50 flex items-center justify-center group ${isResizing ? 'bg-white/30' : 'hover:bg-white/10'}`}
            onMouseDown={onResizeStart}
            style={{ left: `${sidebarWidth}px` }}
          >
            <div className={`w-0.5 h-16 rounded-full transition-colors ${isResizing ? 'bg-white/80' : 'bg-white/30 group-hover:bg-white/60'}`}></div>
          </div>
        </>
      )}

      <div className={`flex-1 flex flex-col p-6 overflow-y-auto overflow-x-hidden h-screen max-h-screen relative scroll-smooth ${isMobile ? 'w-full h-auto min-h-screen overflow-y-visible p-4' : ''}`}>
        <div className="shrink-0 mb-6">
          <h1 className="text-[32px] font-semibold m-0 mb-2 tracking-tight">Future Events</h1>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[400px]">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-3 pl-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none transition-colors placeholder:text-white/40 focus:border-white/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all active:scale-95 ${filters.hackathon ? 'bg-white text-black border border-white font-medium' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                onClick={() => toggleFilter('hackathon')}
              >
                Hackathons
              </button>
              <button
                className={`px-4 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all active:scale-95 ${filters['non-hackathon'] ? 'bg-white text-black border border-white font-medium' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                onClick={() => toggleFilter('non-hackathon')}
              >
                Events
              </button>
              <button
                className={`px-4 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all active:scale-95 ${filters['non-luma'] ? 'bg-white text-black border border-white font-medium' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                onClick={() => toggleFilter('non-luma')}
              >
                Non-Luma
              </button>
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
              <button
                className={`p-2 bg-transparent border-none rounded-md text-white/40 cursor-pointer transition-all hover:text-white/80 ${viewMode === 'list' ? 'bg-white/10 text-white' : ''}`}
                onClick={() => toggleViewMode('list')}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                className={`p-2 bg-transparent border-none rounded-md text-white/40 cursor-pointer transition-all hover:text-white/80 ${viewMode === 'grid' ? 'bg-white/10 text-white' : ''}`}
                onClick={() => toggleViewMode('grid')}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar and Map Section */}
        <div className="shrink-0 grid grid-cols-2 gap-4 mb-6 min-h-[400px] max-md:grid-cols-1">
          <EventCalendar events={events} />
          <EventMap events={events} />
        </div>

        {/* Events List/Grid */}
        <div className={`flex-1 min-h-0 overflow-y-visible pr-2 ${viewMode === 'list' ? 'flex flex-col gap-5 w-full' : 'grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6'}`}>
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">
              <p>No events found matching your criteria</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <a
                key={event.id || event._id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-white/5 border border-white/8 rounded-xl no-underline text-white transition-all overflow-hidden flex flex-col hover:bg-white/6 hover:border-white/15 hover:-translate-y-0.5 ${viewMode === 'list' ? 'min-h-[280px]' : 'h-[520px]'}`}
              >
                <div className={`flex w-full h-full ${viewMode === 'list' ? 'flex-row min-h-[280px]' : 'flex-col h-full'}`}>
                  {/* Image - always present, placeholder if missing */}
                  <div className={`shrink-0 flex items-center justify-center bg-white/5 ${viewMode === 'list' ? 'w-[280px] min-w-[280px] h-[280px]' : 'w-full h-[340px] order-[-1]'}`}>
                    {event.imageUrl ? (
                      <div className={`w-full aspect-square overflow-hidden ${viewMode === 'list' ? 'h-full max-w-[280px] max-h-[280px]' : 'h-full'}`}>
                        <img src={event.imageUrl} alt={event.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-full aspect-square bg-white/5 flex items-center justify-center ${viewMode === 'list' ? 'h-full max-w-[280px] max-h-[280px]' : 'h-full'}`}>
                        <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 flex flex-col min-w-0 ${viewMode === 'list' ? 'p-8' : 'p-6 flex-1'}`}>
                    <div className="flex gap-2 mb-5 shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider ${event.category === 'hackathon' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {event.category === 'hackathon' ? 'Hackathon' : 'Event'}
                      </span>
                      {event.source === 'non-luma' && (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider bg-purple-500/20 text-purple-500">Non-Luma</span>
                      )}
                    </div>
                    <h3 className={`font-semibold m-0 mb-5 tracking-tight shrink-0 leading-tight ${viewMode === 'list' ? 'text-2xl' : 'text-xl'}`}>{event.name}</h3>
                    <div className="flex flex-col gap-3 shrink-0 mt-auto">
                      {event.date && (
                        <div className="flex items-center gap-3 text-white/70 text-sm">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{event.date}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center gap-3 text-white/70 text-sm">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-3 text-white/70 text-sm">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
