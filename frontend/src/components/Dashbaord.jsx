import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Stats from './Stats';
import Charts from './Charts';
import TransactionTable from './TransactionTable';

const Dashboard = () => {
  const [month, setMonth] = useState('May');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    transactions: { transactions: [], total: 0, totalPages: 0, currentPage: 1 },
    statistics: { totalSaleAmount: 0, soldItems: 0, notSoldItems: 0 },
    barChart: [],
    pieChart: [],
  });
  const [isInitializing, setIsInitializing] = useState(false);

  const fetchCombinedData = async (month, search, page) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/combined-data?month=${month}&search=${search}&page=${page}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchCombinedData(month, search, page);
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDataWithDebounce = setTimeout(() => {
      fetchData();
    }, 300); 

    return () => clearTimeout(fetchDataWithDebounce);
  }, [month, search, page]);

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('http://localhost:5000/api/initialize-database');
      const result = await response.json();
      if (result.message) {
        alert('Database initialized successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      alert('Failed to initialize database');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div>
      <Header
        month={month}
        search={search}
        onMonthChange={setMonth} 
        onSearchChange={setSearch} 
        isInitializing={isInitializing}
        onInitialize={handleInitialize}
      />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      ) : (
        <>
          <Stats statistics={data.statistics} />
          <Charts barChartData={data.barChart} pieChartData={data.pieChart} />
          <TransactionTable
            transactions={data.transactions}
            page={page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;

