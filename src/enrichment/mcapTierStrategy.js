/**
 * Phase 5 - Market Cap Tier Strategy
 * Ponyin insight: entry mcap menentukan risk/reward ratio
 * Tier 1: $3K-$10K = ultra early, high risk high reward
 * Tier 2: $10K-$50K = early, balanced
 * Tier 3: $50K-$200K = mid, safer entry
 */

export function getMcapTier(mcapUsd) {
  const tier1Max = Number(process.env.MCAP_TIER1_MAX ?? 10000);
  const tier2Max = Number(process.env.MCAP_TIER2_MAX ?? 50000);
  const tier3Max = Number(process.env.MCAP_TIER3_MAX ?? 200000);

  if (!mcapUsd || mcapUsd <= 0) return { tier: 0, label: 'unknown' };
  if (mcapUsd <= tier1Max) return { tier: 1, label: 'ultra_early', tpMultiplier: 2.0, slMultiplier: 0.8 };
  if (mcapUsd <= tier2Max) return { tier: 2, label: 'early', tpMultiplier: 1.5, slMultiplier: 0.9 };
  if (mcapUsd <= tier3Max) return { tier: 3, label: 'mid', tpMultiplier: 1.0, slMultiplier: 1.0 };
  return { tier: 4, label: 'late', tpMultiplier: 0.7, slMultiplier: 1.2 };
}

export function checkMcapTierStrategy(candidate) {
  if (process.env.ENABLE_MCAP_TIER_STRATEGY !== 'true') {
    return { checked: false };
  }

  const mcap = candidate.metrics?.marketCapUsd ?? 0;
  const tier = getMcapTier(mcap);
  const allowedTiers = (process.env.MCAP_ALLOWED_TIERS ?? '1,2,3').split(',').map(Number);

  return {
    checked: true,
    mcap,
    ...tier,
    allowed: allowedTiers.includes(tier.tier),
    allowedTiers,
  };
}
