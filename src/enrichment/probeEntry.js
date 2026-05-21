/**
 * Phase 6 - Probe Entry
 * Ponyin insight: beli kecil dulu (20%), kalau naik baru full entry
 * Kalau turun, exit cepat dengan loss kecil
 */

import { now } from '../utils.js';
import { db } from '../db/connection.js';

const PROBE_POSITIONS = new Map(); // mint -> probe data

export function isProbeEnabled() {
  return process.env.ENABLE_PROBE_ENTRY === 'true';
}

export function getProbeEntryPct() {
  return Number(process.env.PROBE_ENTRY_PCT ?? 20) / 100;
}

export function getProbeConfirmMinPnl() {
  return Number(process.env.PROBE_CONFIRM_MIN_PNL_PCT ?? 3);
}

export function getProbeConfirmMaxAgeMs() {
  return Number(process.env.PROBE_CONFIRM_MAX_AGE_MINUTES ?? 4) * 60 * 1000;
}

export function getProbeFailExitPct() {
  return Number(process.env.PROBE_FAIL_EXIT_PCT ?? -7);
}

export function recordProbeEntry(mint, entryMcap, sizeSol) {
  PROBE_POSITIONS.set(mint, {
    mint,
    entryMcap,
    sizeSol,
    entryAtMs: now(),
    confirmed: false,
    failed: false,
  });
}

export function checkProbeStatus(mint, currentMcap) {
  if (!isProbeEnabled()) return { status: 'disabled' };

  const probe = PROBE_POSITIONS.get(mint);
  if (!probe) return { status: 'no_probe' };

  const ageMs = now() - probe.entryAtMs;
  const pnlPct = (currentMcap / probe.entryMcap - 1) * 100;
  const maxAgeMs = getProbeConfirmMaxAgeMs();
  const minPnl = getProbeConfirmMinPnl();
  const failPct = getProbeFailExitPct();

  // Already resolved
  if (probe.confirmed) return { status: 'confirmed', pnlPct };
  if (probe.failed) return { status: 'failed', pnlPct };

  // Check if should confirm (full entry)
  if (pnlPct >= minPnl) {
    probe.confirmed = true;
    PROBE_POSITIONS.set(mint, probe);
    console.log(`[probe] ${mint} confirmed at +${pnlPct.toFixed(1)}% → full entry`);
    return { status: 'confirmed', pnlPct, shouldAddPosition: true };
  }

  // Check if should exit (probe failed)
  if (pnlPct <= failPct || ageMs >= maxAgeMs) {
    probe.failed = true;
    PROBE_POSITIONS.set(mint, probe);
    const reason = pnlPct <= failPct ? 'sl_hit' : 'timeout';
    console.log(`[probe] ${mint} failed (${reason}) at ${pnlPct.toFixed(1)}%`);
    return { status: 'failed', pnlPct, reason, shouldExit: true };
  }

  return {
    status: 'watching',
    pnlPct,
    ageMs,
    maxAgeMs,
  };
}

export function clearProbe(mint) {
  PROBE_POSITIONS.delete(mint);
}

export function getProbeInfo(mint) {
  return PROBE_POSITIONS.get(mint) || null;
}
