import React from 'react';
import { MONTHS } from '../constants';

const Header = ({ 
  month, 
  search, 
  isInitializing, 
  onMonthChange, 
  onSearchChange, 
  onInitialize 
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Transaction Dashboard</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm px-4 py-2"
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm px-4 py-2 flex-1"
        />

        <button
          onClick={onInitialize}
          disabled={isInitializing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
        >
          {isInitializing ? 'Initializing...' : 'Initialize Database'}
        </button>
      </div>
    </div>
  );
};

export default Header;