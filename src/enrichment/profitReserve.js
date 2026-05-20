/**
 * Phase 8 - Profit Reserve & Daily Report
 * Ponyin insight: sisihkan sebagian profit, jangan all-in terus
 */

let totalProfit = 0;
let totalTrades = 0;
let winningTrades = 0;
let dailyStats = { date: null, profit: 0, trades: 0, wins: 0 };

export function recordTradeResult(pnlPct, solAmount) {
  const isWin = pnlPct > 0;
  const profitSol = solAmount * (pnlPct / 100);

  totalProfit += profitSol;
  totalTrades++;
  if (isWin) winningTrades++;

  // Daily stats
  const today = new Date().toISOString().split('T')[0];
  if (dailyStats.date !== today) {
    dailyStats = { date: today, profit: 0, trades: 0, wins: 0 };
  }
  dailyStats.profit += profitSol;
  dailyStats.trades++;
  if (isWin) dailyStats.wins++;

  return {
    totalProfit,
    totalTrades,
    winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0,
    dailyStats,
  };
}

export function getReservedAmount(profitSol) {
  if (process.env.ENABLE_PROFIT_RESERVE !== 'true') return 0;
  const reservePct = Number(process.env.PROFIT_RESERVE_PCT ?? 35);
  return profitSol > 0 ? profitSol * (reservePct / 100) : 0;
}

export function getDailyReport() {
  const winRate = dailyStats.trades > 0
    ? (dailyStats.wins / dailyStats.trades * 100).toFixed(1)
    : 0;

  return {
    date: dailyStats.date,
    profitSol: dailyStats.profit.toFixed(4),
    trades: dailyStats.trades,
    wins: dailyStats.wins,
    winRate: `${winRate}%`,
    totalProfitSol: totalProfit.toFixed(4),
    totalTrades,
    totalWinRate: totalTrades > 0 ? `${(winningTrades / totalTrades * 100).toFixed(1)}%` : '0%',
  };
}
