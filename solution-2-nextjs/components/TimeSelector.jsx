"use client";

import React from 'react';

export default function TimeSelector({ currentDate, currentTime, setCurrentDate, setCurrentTime, tradingDays }) {
  const timeOptions = [];
  for (let h = 9; h <= 16; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 9 && m < 30) continue;
      if (h === 16 && m > 0) continue;
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      timeOptions.push(`${hh}:${mm}`);
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 flex flex-wrap gap-6 items-center">
      <div className="flex items-center space-x-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Simulated Market Time:</span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs font-semibold text-gray-600 uppercase">Trading Day</label>
        <select
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tradingDays.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs font-semibold text-gray-600 uppercase">Interval (EST)</label>
        <select
          value={currentTime}
          onChange={(e) => setCurrentTime(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded">
        All market prices & portfolio metrics correspond to this timestamp
      </div>
    </div>
  );
}
