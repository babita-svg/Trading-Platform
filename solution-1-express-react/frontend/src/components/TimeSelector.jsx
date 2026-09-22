import React from 'react';

export default function TimeSelector({ currentDate, currentTime, setCurrentDate, setCurrentTime, tradingDays }) {
  // Generate time options from 09:30 to 16:00
  const timeOptions = [];
  for (let h = 9; h <= 16; h++) {
    for (let m = 0; m < 60; m++) {
      if (h === 9 && m < 30) continue;
      if (h === 16 && m > 0) continue;
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      timeOptions.push(`${hh}:${mm}`);
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-center">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trading Day</label>
        <select
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tradingDays.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time (EST)</label>
        <select
          value={currentTime}
          onChange={(e) => setCurrentTime(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto text-sm text-gray-500">
        Time Travel Mode Active
      </div>
    </div>
  );
}
