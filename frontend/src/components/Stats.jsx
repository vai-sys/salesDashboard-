import React from 'react';

const Stats = ({ statistics }) => {
  const { totalSaleAmount = 0, soldItems = 0, notSoldItems = 0 } = statistics;

  const statsData = [
    {
      title: 'Total Sale Amount',
      value: `$${totalSaleAmount.toFixed(2)}`,
      color: 'bg-blue-500'
    },
    {
      title: 'Sold Items',
      value: soldItems,
      color: 'bg-green-500'
    },
    {
      title: 'Not Sold Items',
      value: notSoldItems,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{stat.title}</h3>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${stat.color} mr-2`}></div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;