/**
 * Phase 7 - Wallet Alpha Watchlist
 * Ponyin insight: kalau wallet alpha yang kita track beli token ini = sinyal kuat
 * Track wallet-wallet yang historis profitable
 */

const ALPHA_WALLETS = new Set();
const ALPHA_WALLET_ACTIVITY = new Map(); // mint -> Set of wallets that bought

// Load alpha wallets from env
function loadAlphaWallets() {
  if (ALPHA_WALLETS.size > 0) return;
  const walletList = process.env.ALPHA_WALLET_LIST ?? '';
  walletList.split(',').forEach(w => {
    const trimmed = w.trim();
    if (trimmed) ALPHA_WALLETS.add(trimmed);
  });
}

export function registerAlphaActivity(mint, walletAddress) {
  if (!ALPHA_WALLETS.has(walletAddress)) return false;

  if (!ALPHA_WALLET_ACTIVITY.has(mint)) {
    ALPHA_WALLET_ACTIVITY.set(mint, new Set());
  }
  ALPHA_WALLET_ACTIVITY.get(mint).add(walletAddress);

  const count = ALPHA_WALLET_ACTIVITY.get(mint).size;
  console.log(`[alpha] wallet ${walletAddress.slice(0, 8)}... active on ${mint.slice(0, 8)}... (${count} alpha wallets)`);
  return true;
}

export function checkWalletAlpha(candidate) {
  if (process.env.ENABLE_WALLET_ALPHA !== 'true') {
    return { checked: false };
  }

  loadAlphaWallets();

  const mint = candidate.token?.mint;
  if (!mint) return { checked: false, reason: 'no_mint' };

  const minScore = Number(process.env.WALLET_ALPHA_MIN_SCORE ?? 0.65);
  const minConfirmations = Number(process.env.WALLET_ALPHA_MIN_CONFIRMATIONS ?? 2);
  const scoreBoost = Number(process.env.WALLET_ALPHA_SCORE_BOOST ?? 0.08);

  const activeWallets = ALPHA_WALLET_ACTIVITY.get(mint) ?? new Set();
  const confirmations = activeWallets.size;
  const alphaScore = ALPHA_WALLETS.size > 0
    ? Math.min(confirmations / ALPHA_WALLETS.size, 1)
    : 0;

  const hasAlphaSignal = confirmations >= minConfirmations && alphaScore >= minScore;

  return {
    checked: true,
    confirmations,
    alphaScore: Number(alphaScore.toFixed(3)),
    hasAlphaSignal,
    scoreBoost: hasAlphaSignal ? scoreBoost : 0,
    activeWallets: [...activeWallets],
    totalAlphaWallets: ALPHA_WALLETS.size,
  };
}

export function getAlphaWallets() {
  loadAlphaWallets();
  return [...ALPHA_WALLETS];
}

export function addAlphaWallet(address) {
  ALPHA_WALLETS.add(address);
  console.log(`[alpha] added wallet ${address.slice(0, 8)}... (total: ${ALPHA_WALLETS.size})`);
}

export function removeAlphaWallet(address) {
  ALPHA_WALLETS.delete(address);
  console.log(`[alpha] removed wallet ${address.slice(0, 8)}... (total: ${ALPHA_WALLETS.size})`);
}
