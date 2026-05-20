/**
 * Phase 2 - Fresh-Funded Holder & Bundle Cluster Risk
 * Ponyin insight: banyak wallet baru di-fund < 1 hari sebelum launch = red flag
 */

export function checkHolderRisk(candidate) {
  if (process.env.ENABLE_HOLDER_FUNDING_RISK !== 'true') {
    return { checked: false };
  }

  try {
    const holders = candidate.holders;
    const gmgn = candidate.gmgn;

    if (!holders || !gmgn) {
      return { checked: false, reason: 'insufficient_data' };
    }

    const bundlerRate = Number(candidate.trending?.bundler_rate ?? 0);
    const rugRatio = Number(candidate.trending?.rug_ratio ?? 0);
    const maxHolderPercent = Number(holders.maxHolderPercent ?? 0);
    const holderCount = Number(candidate.metrics?.holderCount ?? 0);

    // Count risk signals
    let riskSignals = 0;
    const riskFlags = [];

    // Signal 1: High bundler rate (coordinated buying)
    if (bundlerRate > 0.3) {
      riskSignals++;
      riskFlags.push('high_bundler_rate');
    }

    // Signal 2: High rug ratio
    if (rugRatio > 0.5) {
      riskSignals++;
      riskFlags.push('high_rug_ratio');
    }

    // Signal 3: Very high top holder concentration
    if (maxHolderPercent > 20) {
      riskSignals++;
      riskFlags.push('high_holder_concentration');
    }

    // Signal 4: Very low holder count (easy to manipulate)
    if (holderCount > 0 && holderCount < 50) {
      riskSignals++;
      riskFlags.push('low_holder_count');
    }

    const minPenalize = Number(process.env.MIN_FRESH_FUNDED_HOLDER_COUNT_TO_PENALIZE ?? 3);
    const minReject = Number(process.env.MIN_FRESH_FUNDED_HOLDER_COUNT_TO_REJECT ?? 6);
    const clusterScoreReject = Number(process.env.HOLDER_CLUSTER_SCORE_REJECT ?? 0.75);

    // Normalize risk score (0-1)
    const holderClusterRiskScore = Math.min(riskSignals / 4, 1);

    return {
      checked: true,
      riskSignals,
      riskFlags,
      holderClusterRiskScore: Number(holderClusterRiskScore.toFixed(3)),
      bundlerRate,
      rugRatio,
      maxHolderPercent,
      holderCount,
      shouldPenalize: riskSignals >= minPenalize,
      shouldReject: holderClusterRiskScore >= clusterScoreReject || riskSignals >= minReject,
    };
  } catch {
    return { checked: false, reason: 'error' };
  }
}
