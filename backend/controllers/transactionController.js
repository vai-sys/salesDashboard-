const Transaction = require('../models/Transaction');
const axios = require('axios');

exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = response.data;
    
    await Transaction.deleteMany({});
    await Transaction.insertMany(data);
    
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getTransactions = async (req, res) => {
  try {
    const { month, search = '', page = 1, perPage = 10 } = req.query;
    const skip = (page - 1) * perPage;

    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
    
    const query = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber]
      }
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(search) ? undefined : Number(search) }
      ].filter(Boolean);
    }

    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(parseInt(perPage))
      .sort({ dateOfSale: -1 });

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getStatistics = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const stats = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] }
          },
          soldItems: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] }
          },
          notSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || { totalSaleAmount: 0, soldItems: 0, notSoldItems: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getBarChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const result = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
          }
        }
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
          default: "901-above",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Pie Chart Data
exports.getPieChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;

    const result = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
          }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Combined Data
exports.getCombinedData = async (req, res) => {
  try {
    const { month, page = 1, search = '' } = req.query;
    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
    const perPage = 10;
    const skip = (page - 1) * perPage;

    // Transactions Query
    const transactionQuery = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber]
      }
    };

    if (search) {
      transactionQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(search) ? undefined : Number(search) }
      ].filter(Boolean);
    }

    // Execute all queries in parallel
    const [transactions, total, statistics, barChart, pieChart] = await Promise.all([
      // Transactions with pagination
      Transaction.find(transactionQuery)
        .skip(skip)
        .limit(parseInt(perPage))
        .sort({ dateOfSale: -1 }),

      // Total count for pagination
      Transaction.countDocuments(transactionQuery),

      // Statistics
      Transaction.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$dateOfSale" }, monthNumber]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSaleAmount: {
              $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] }
            },
            soldItems: {
              $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] }
            },
            notSoldItems: {
              $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] }
            }
          }
        }
      ]),

      // Bar Chart Data
      Transaction.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$dateOfSale" }, monthNumber]
            }
          }
        },
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
            default: "901-above",
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),

      // Pie Chart Data
      Transaction.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $month: "$dateOfSale" }, monthNumber]
            }
          }
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format bar chart data
    const formattedBarChart = barChart.map(item => ({
      range: item._id === "901-above" ? "901-above" : `${item._id}-${item._id + 99}`,
      count: item.count
    }));

  
    const formattedPieChart = pieChart.map(item => ({
      category: item._id,
      count: item.count
    }));

    
    res.json({
      transactions: {
        transactions,
        total,
        totalPages: Math.ceil(total / perPage),
        currentPage: parseInt(page)
      },
      statistics: statistics[0] || { totalSaleAmount: 0, soldItems: 0, notSoldItems: 0 },
      barChart: formattedBarChart,
      pieChart: formattedPieChart
    });
  } catch (error) {
    console.error('Combined Data Error:', error);
    res.status(500).json({ error: error.message });
  }
};