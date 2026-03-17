/**
 * Feature Flags — ver 1.0.0
 *
 * Set a flag to `false` to hide that element from the UI.
 * Set it back to `true` to restore it.
 * Uses *ngIf, so hidden elements are fully removed from the DOM —
 * layouts reflow cleanly with no leftover spacing or CSS issues.
 */
export const FEATURE_FLAGS = {
  // ── Home Page ──────────────────────────────────────────────────────────────
  homeMultiplayerPanel: false,
  homeChallengesSection: true,
  homeSpecialOffersBanner: false,
  homeStatisticsSection: true,

  // ── Bottom Tab Bar ─────────────────────────────────────────────────────────
  tabTraining: true,
  tabBulletCount: false,
  tabChallenges: true,
  tabStatistics: true,

  // ── Challenges Page ────────────────────────────────────────────────────────
  challengesGlobalTab: false,
  challengesMyTab: true,
  challengesHeroesTab: false,

  // ── Statistics Page ────────────────────────────────────────────────────────
  statsLeaderboard: true,
  statsInsightsTab: true,
  statsHistoryTab: true,

  // ── Settings Page ──────────────────────────────────────────────────────────
  settingsUpgradeBanner: true,

  // ── Connection Transport ────────────────────────────────────────────────────
  useWifiConnection: true,  // true = WiFi UDP, false = BLE

  // ── Bullet System ───────────────────────────────────────────────────────────
  bulletSystemEnabled: false, // false = skip bullet check, proceed directly to drill
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
