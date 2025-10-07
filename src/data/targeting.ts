export type TargetingCardKey =
  | 'audienceSegments'
  | 'influencerCollaborators'
  | 'bestChannels'
  | 'timingBudget'
  | 'triggeringMoments'
  | 'activationGuidance';

export interface TargetingCardData {
  key: TargetingCardKey;
  title: string;
  essentials: string[];
  advanced: string[];
}

export const targetingCards: TargetingCardData[] = [
  {
    key: 'audienceSegments',
    title: 'Audience Segments',
    essentials: [
      'Bettor mindsets: Underdog chaser, ego-driven bettor, casual social bettor',
      'Demographics: 25–44, male-skewed (65%), mobile-first (iOS 55%, Android 45%), Tier-1 EN + LATAM high-LTV',
    ],
    advanced: [
      'Purchase intent signals (recent store visits, engaged with relevant influencers in past 7 days)',
      'Micro-moments (lunchtime scroll, evening relaxation)',
      'Life events (engagement, moving, new job)',
      'Brand affinity, lookalikes, anti-affinity',
    ],
  },
  {
    key: 'influencerCollaborators',
    title: 'Influencer Collaborators',
    essentials: [
      'Thoughtful analysis: Twitch streamer (methodical analyzers)',
      'Football memes: Instagram reel creators (emotion-driven bettors)',
      'Football history: YouTuber (loyalty-first, suspicious of mainstream)',
      'Bro podcast sphere: Europe-based (social bettors & risk-maximizers)',
    ],
    advanced: [
      'Cross-platform reach overlap (IG → TikTok spillover)',
      'Engagement tiering (high/mid/micro)',
      'Audience psychographic fit mapping (identity-driven, novelty-seeking)',
    ],
  },
  {
    key: 'bestChannels',
    title: 'Best-Performing Channels',
    essentials: [
      'Meta: Facebook feed, reels, audience network (rewarded video)',
      'Google: YouTube in-stream, display network – sports & betting affinity audiences',
      'Programmatic/DV360: Sports news, betting forums, esports streams',
    ],
    advanced: [
      'Placement preferences (in-feed, stories, reels, search)',
      'Time-on-platform patterns (heavy scrollers vs quick scanners)',
      'Cross-app ecosystem usage (shopping, entertainment, finance)',
      'Creative format mapping (Reels for discovery, Shorts for intent, Search for close)',
    ],
  },
  {
    key: 'timingBudget',
    title: 'Timing & Budget',
    essentials: [
      '1–2 hours before live matches or big events',
      '<$5 for mobile acquisition, then scale to tROAS campaigns after day 3',
    ],
    advanced: [
      'Engagement-level retargeting (3s, 10s, 75% viewers, clickers, ATC, purchasers)',
      'Recency decay windows (1-day hot, 7-day warm, 30-day cold)',
      'Budget ramp sequencing for each tier',
      'Bid strategy notes per channel (tCPA for cold, tROAS for warm, manual bids for hot)',
      'Frequency capping & creative fatigue windows per platform',
    ],
  },
  {
    key: 'triggeringMoments',
    title: 'Triggering Moments',
    essentials: [
      'Breaking injury updates: lineup changes and team news',
      'Live odds swings: momentum shifts during games',
      'Cup finals & rivalries: derby matches and high-stakes games',
    ],
    advanced: [
      'Emotion-led content triggers (trending topics, reactive memes)',
      'Resonance profiles (identity-driven, aspirational, novelty-seeking)',
      'Seasonal/event-based spikes',
    ],
  },
  {
    key: 'activationGuidance',
    title: 'Activation Guidance',
    essentials: [
      'Sequential messaging: awareness → education → conversion flow',
      'Geo/time segmentation: around stadiums and match windows',
      'Coordinate with influencers: align with posting schedules',
    ],
    advanced: [
      'Cross-channel sequence (TikTok hooks → IG retarget → Google search → purchase page)',
      'Influencer sync strategy (posting windows around match/event)',
      'Creative/message variation by audience emotional state',
      'Exclusion strategies (competitor audience blocks, unprofitable past converters)',
    ],
  },
];
