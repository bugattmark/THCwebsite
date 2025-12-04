import { useEffect, useRef } from 'react';

export default function EventMap({ events }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Extract locations from events
    const locations = events
      .filter(event => event.location && event.location.toLowerCase().includes('london'))
      .map(event => ({
        name: event.name,
        location: event.location,
        category: event.category,
        url: event.url
      }));

    if (locations.length === 0 || !mapContainerRef.current) return;

    // Use Leaflet for map (you'll need to install leaflet: npm install leaflet)
    // For now, using a simple iframe with OpenStreetMap
    // In production, you'd want to use Leaflet or Google Maps API
    
    // Group events by location
    const locationGroups = {};
    locations.forEach(event => {
      const key = event.location.toLowerCase();
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(event);
    });

    // Create map iframe with London center
    if (!mapRef.current) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=-0.5%2C51.4%2C0.2%2C51.6&layer=mapnik&marker=51.5074,-0.1278`;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      mapContainerRef.current.appendChild(iframe);
      mapRef.current = iframe;
    }

    // Store location data for tooltip/interaction
    markersRef.current = Object.values(locationGroups);
  }, [events]);

  const locationCount = events.filter(e => e.location && e.location.toLowerCase().includes('london')).length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 h-full min-h-[400px]">
      <div className="flex justify-between items-center">
        <h3 className="m-0 text-base font-semibold text-white">Event Locations</h3>
        <span className="text-xs text-white/50">{locationCount} events in London</span>
      </div>
      <div className="w-full h-full flex-1 min-h-[300px] rounded-lg overflow-hidden bg-black/20 relative" ref={mapContainerRef}>
        {locationCount === 0 && (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            <p>No London locations found</p>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Hackathons</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Other Events</span>
        </div>
      </div>
    </div>
  );
}

