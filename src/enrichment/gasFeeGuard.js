/**
 * Phase 4 - Gas Fee Guard
 * Ponyin insight: kalau gas fee tinggi = network padat, skip trading
 */

const GAS_FEE_CACHE = { value: null, fetchedAt: 0 };
const CACHE_TTL_MS = 30000; // 30 seconds

export async function checkGasFeeCondition() {
  if (process.env.ENABLE_GAS_FEE_GUARD !== 'true') {
    return { checked: false };
  }

  try {
    const now = Date.now();
    if (GAS_FEE_CACHE.value !== null && now - GAS_FEE_CACHE.fetchedAt < CACHE_TTL_MS) {
      return GAS_FEE_CACHE.value;
    }

    const rpcUrl = process.env.SOLANA_RPC_URL;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPrioritizationFees',
        params: [],
      }),
    });

    const data = await response.json();
    const fees = data?.result ?? [];

    if (!fees.length) {
      return { checked: false, reason: 'no_data' };
    }

    // Get average of recent fees
    const avgFee = fees.reduce((sum, f) => sum + f.prioritizationFee, 0) / fees.length;

    const maxFee = Number(process.env.GAS_FEE_MAX_MICROLAMPORTS ?? 100000);
    const warnFee = Number(process.env.GAS_FEE_WARN_MICROLAMPORTS ?? 50000);

    const result = {
      checked: true,
      avgFee: Math.round(avgFee),
      congested: avgFee > maxFee,
      warning: avgFee > warnFee,
      maxFee,
      warnFee,
    };

    GAS_FEE_CACHE.value = result;
    GAS_FEE_CACHE.fetchedAt = now;

    return result;
  } catch {
    return { checked: false, reason: 'error' };
  }
}
