/**
 * Phase 3 - Volume vs Fee Sanity Check
 * Ponyin insight: volume tinggi tapi fee sangat kecil = wash trading signal
 */

const POOL_FEE_RATE = 0.0025; // 0.25% default Raydium/Orca pool fee

export function checkVolumeFeeHealth(candidate) {
  if (process.env.ENABLE_VOLUME_FEE_CHECK !== 'true') {
    return { checked: false };
  }

  try {
    const volumeUsd = Number(candidate.metrics?.trendingVolumeUsd ?? candidate.metrics?.graduatedVolumeUsd ?? 0);
    const feesSol = Number(candidate.metrics?.gmgnTotalFeesSol ?? 0);
    const priceUsd = Number(candidate.metrics?.priceUsd ?? 0);

    // Skip if no volume or price data
    if (volumeUsd <= 0 || priceUsd <= 0) {
      return { checked: false, reason: 'insufficient_data' };
    }

    // Convert fees to USD for comparison
    const SOL_PRICE_ESTIMATE = 150; // rough estimate, good enough for ratio
    const feesUsd = feesSol * SOL_PRICE_ESTIMATE;

    const expectedFee = volumeUsd * POOL_FEE_RATE;
    const feeHealth = expectedFee > 0 ? feesUsd / expectedFee : 0;

    const minHealth = Number(process.env.VOLUME_FEE_MIN_HEALTH ?? 0.35);
    const rejectHealth = Number(process.env.VOLUME_FEE_REJECT_HEALTH ?? 0.15);

    return {
      checked: true,
      volumeUsd,
      feesUsd,
      expectedFee,
      feeHealth: Number(feeHealth.toFixed(3)),
      lowHealth: feeHealth < minHealth,
      criticalLowHealth: feeHealth < rejectHealth,
    };
  } catch {
    return { checked: false, reason: 'error' };
  }
            }
