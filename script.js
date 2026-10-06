const Transaction = require('./Transaction');

class User {
  constructor(name, cashBalance = 10000) {
    this.name = name;
    this.cashBalance = Number(cashBalance);
    this.holdings = {};
    this.transactions = [];
    this.performanceHistory = [];
    this.initialInvestment = Number(cashBalance);
  }

  buy(stock, quantity, market) {
    const selectedStock = typeof stock === 'string' ? market.getStock(stock) : stock;

    if (!selectedStock) {
      throw new Error('Stock not found in market.');
    }

    const buyQuantity = Number(quantity);
    if (!Number.isFinite(buyQuantity) || buyQuantity <= 0) {
      throw new Error('Buy quantity must be a positive number.');
    }

    const cost = selectedStock.price * buyQuantity;
    if (this.cashBalance < cost) {
      throw new Error(`Insufficient funds. You need $${cost.toFixed(2)} but only have $${this.cashBalance.toFixed(2)}.`);
    }

    this.cashBalance = Number((this.cashBalance - cost).toFixed(2));
    this.holdings[selectedStock.symbol] = (this.holdings[selectedStock.symbol] || 0) + buyQuantity;

    const txn = new Transaction('BUY', selectedStock.symbol, buyQuantity, selectedStock.price);
    this.transactions.push(txn);

    return txn;
  }

  sell(stock, quantity, market) {
    const selectedStock = typeof stock === 'string' ? market.getStock(stock) : stock;

    if (!selectedStock) {
      throw new Error('Stock not found in market.');
    }

    const sellQuantity = Number(quantity);
    const ownedShares = this.holdings[selectedStock.symbol] || 0;

    if (!Number.isFinite(sellQuantity) || sellQuantity <= 0) {
      throw new Error('Sell quantity must be a positive number.');
    }

    if (ownedShares < sellQuantity) {
      throw new Error(`You do not own enough shares of ${selectedStock.symbol}.`);
    }

    const revenue = selectedStock.price * sellQuantity;
    this.cashBalance = Number((this.cashBalance + revenue).toFixed(2));
    this.holdings[selectedStock.symbol] -= sellQuantity;

    if (this.holdings[selectedStock.symbol] === 0) {
      delete this.holdings[selectedStock.symbol];
    }

    const txn = new Transaction('SELL', selectedStock.symbol, sellQuantity, selectedStock.price);
    this.transactions.push(txn);

    return txn;
  }

  getPortfolioValue(market) {
    let total = this.cashBalance;

    Object.entries(this.holdings).forEach(([symbol, quantity]) => {
      const stock = market.getStock(symbol);
      if (stock) {
        total += stock.price * quantity;
      }
    });

    return Number(total.toFixed(2));
  }

  recordPerformanceSnapshot(market) {
    const totalValue = this.getPortfolioValue(market);
    const profit = Number((totalValue - this.initialInvestment).toFixed(2));

    const snapshot = {
      timestamp: new Date().toISOString(),
      totalValue,
      cashBalance: Number(this.cashBalance.toFixed(2)),
      holdings: { ...this.holdings },
      profit
    };

    this.performanceHistory.push(snapshot);
    return snapshot;
  }

  printPortfolio(market) {
    const holdings = Object.entries(this.holdings).map(([symbol, quantity]) => {
      const stock = market.getStock(symbol);
      const marketValue = stock ? stock.price * quantity : 0;
      return {
        Symbol: symbol,
        Shares: quantity,
        Price: stock ? `$${stock.price.toFixed(2)}` : '$0.00',
        Value: `$${marketValue.toFixed(2)}`
      };
    });

    console.log(`\n=== ${this.name.toUpperCase()}'S PORTFOLIO ===`);
    console.table([
      { label: 'Cash Balance', value: `$${this.cashBalance.toFixed(2)}` },
      { label: 'Portfolio Value', value: `$${this.getPortfolioValue(market).toFixed(2)}` }
    ]);

    if (holdings.length > 0) {
      console.table(holdings);
    } else {
      console.log('No positions currently held.');
    }

    console.log('');
  }

  showPerformanceHistory() {
    if (this.performanceHistory.length === 0) {
      console.log('No performance history available yet.');
      return;
    }

    console.log('\n=== PERFORMANCE OVER TIME ===');
    console.table(this.performanceHistory.map((entry) => ({
      Time: new Date(entry.timestamp).toLocaleTimeString(),
      Value: `$${entry.totalValue.toFixed(2)}`,
      Profit: `$${entry.profit.toFixed(2)}`
    })));
  }
}

module.exports = User;
