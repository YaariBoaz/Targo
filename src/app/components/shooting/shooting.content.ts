export const CHALLENGE_TEXT = {
  title: 'Nationwide Tactical',
  description: 'Join a global leaderboard in this elite tactical challenge.',
  overlay: {
    title: 'Challenge: Precision Rush',
    description:
      'Hit 10 shots in under 10 seconds to win the drill. Keep it tight and fast!',
  },
  buttons: {
    start: 'Start Shooting',
    finish: 'FINISH DRILL',
    retry: '🔁 Retry',
    stats: '📊 View Stats',
    exit: '🏁 Exit',
  },
  completeTitle: '🎯 Drill Complete',
  completeMessage: (totalShots: number) =>
    `Nice shooting! You fired ${totalShots} rounds.`,
};
