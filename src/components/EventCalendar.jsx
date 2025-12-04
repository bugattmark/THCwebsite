import { useState } from 'react';

export default function EventCalendar({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get events by date
  const eventsByDate = {};
  events.forEach(event => {
    if (event.date) {
      try {
        // Parse date string (format: "December 05, 2025")
        const dateStr = event.date;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const dateKey = date.toISOString().split('T')[0];
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        }
      } catch {
        // Skip invalid dates
      }
    }
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create calendar grid
  const days = [];
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasEvent = (day) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;
  };

  const getEventCount = (day) => {
    if (!day) return 0;
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate[dateKey] ? eventsByDate[dateKey].length : 0;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="bg-white/5 border border-white/10 rounded-md p-1.5 text-white cursor-pointer transition-all hover:bg-white/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h3 className="m-0 text-base font-semibold text-white">{monthNames[month]} {year}</h3>
        <button onClick={() => changeMonth(1)} className="bg-white/5 border border-white/10 rounded-md p-1.5 text-white cursor-pointer transition-all hover:bg-white/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[11px] font-semibold text-white/50 py-2 px-1 uppercase tracking-wider">{day}</div>
        ))}
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`aspect-square flex flex-col items-center justify-center rounded-md relative cursor-pointer transition-all ${hasEvent(day) ? 'bg-green-500/10 hover:bg-green-500/20' : 'hover:bg-white/5'} ${!day ? 'cursor-default' : ''}`}
            title={day && hasEvent(day) ? `${getEventCount(day)} event(s)` : ''}
          >
            {day && <span className={`text-[13px] font-medium ${hasEvent(day) ? 'text-white font-semibold' : 'text-white/80'}`}>{day}</span>}
            {day && hasEvent(day) && (
              <span className="absolute bottom-1 bg-green-500 rounded-full min-w-[6px] min-h-[6px]" style={{ 
                width: `${Math.min(getEventCount(day) * 4, 12)}px`,
                height: `${Math.min(getEventCount(day) * 4, 12)}px`
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

