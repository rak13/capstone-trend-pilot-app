// Mock data to simulate the Python backend
export interface TrendingTopic {
  topic: string;
  trendScore: number;
  topQueries: string[];
  risingQueries: { query: string; value: string }[];
}

export interface PostTitle {
  signal: string;
  title: string;
}

export interface PostVariant {
  hookStyle: string;
  postText: string;
  wordCount: number;
}

export interface EngagementPrediction {
  reactions: number;
  comments: number;
}

export function generateTrendingTopics(bio: string): TrendingTopic[] {
  const keywords = bio.toLowerCase();
  const topics: TrendingTopic[] = [];

  if (keywords.includes("ai") || keywords.includes("machine learning") || keywords.includes("data")) {
    topics.push({
      topic: "AI & Machine Learning",
      trendScore: 92.4,
      topQueries: ["AI agents 2025", "LLM fine-tuning", "AI coding assistants", "multimodal AI"],
      risingQueries: [
        { query: "AI agents workflow", value: "Breakout" },
        { query: "Claude 4 release", value: "+450%" },
        { query: "vibe coding", value: "+320%" },
      ],
    });
  }
  if (keywords.includes("product") || keywords.includes("startup") || keywords.includes("saas")) {
    topics.push({
      topic: "Product-Led Growth",
      trendScore: 78.1,
      topQueries: ["PLG strategy", "product analytics", "user onboarding", "freemium model"],
      risingQueries: [
        { query: "PLG vs sales-led", value: "+280%" },
        { query: "product qualified leads", value: "+190%" },
      ],
    });
  }
  if (keywords.includes("leadership") || keywords.includes("management") || keywords.includes("team")) {
    topics.push({
      topic: "Remote Leadership",
      trendScore: 71.6,
      topQueries: ["async communication", "remote team culture", "hybrid work policy", "distributed teams"],
      risingQueries: [
        { query: "return to office backlash", value: "Breakout" },
        { query: "async-first companies", value: "+210%" },
      ],
    });
  }

  // Always add some general topics
  topics.push({
    topic: "Career Reinvention",
    trendScore: 68.3,
    topQueries: ["career pivot 2025", "upskilling strategy", "personal branding", "side projects"],
    risingQueries: [
      { query: "AI-proof careers", value: "+350%" },
      { query: "portfolio careers", value: "+180%" },
    ],
  });
  topics.push({
    topic: "Creator Economy & Personal Branding",
    trendScore: 61.9,
    topQueries: ["LinkedIn growth hacks", "thought leadership", "content strategy", "newsletter monetization"],
    risingQueries: [
      { query: "LinkedIn algorithm 2025", value: "+220%" },
      { query: "ghostwriting services", value: "+150%" },
    ],
  });

  return topics.sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
}

export function generatePostTitles(topic: string): PostTitle[] {
  const titleMap: Record<string, PostTitle[]> = {
    "AI & Machine Learning": [
      { signal: "AI agents workflow automation — Breakout trend", title: "I replaced 3 hours of daily work with an AI agent. Here's what nobody tells you about the downsides." },
      { signal: "Vibe coding rising +320%", title: "Stop learning to code. Start learning to think. Why vibe coding changes everything." },
      { signal: "LLM fine-tuning — sustained interest", title: "We fine-tuned an LLM on our company's data. The results destroyed our assumptions." },
    ],
    "Product-Led Growth": [
      { signal: "PLG vs sales-led debate — +280%", title: "We killed our sales team and went full PLG. Revenue dropped 40% before it tripled." },
      { signal: "Product qualified leads rising", title: "Your best leads aren't in your CRM. They're in your product usage data." },
      { signal: "Freemium model optimization", title: "The freemium trap: Why giving away your product for free is killing your startup." },
    ],
    "Remote Leadership": [
      { signal: "Return to office backlash — Breakout", title: "I told my CEO we're not going back to the office. What happened next changed our entire company." },
      { signal: "Async-first communication +210%", title: "We banned meetings for 30 days. Productivity didn't just increase — it transformed." },
      { signal: "Distributed team culture", title: "The loneliest job in tech isn't coding at 2 AM. It's leading a team you've never met in person." },
    ],
  };

  return titleMap[topic] || [
    { signal: "Career resilience trending", title: "I got laid off at 42 with two kids. Best thing that ever happened to my career." },
    { signal: "Personal branding ROI", title: "My LinkedIn post got 50K views and zero leads. Here's what actually drives business." },
    { signal: "Skill stacking strategy", title: "You don't need 10,000 hours. You need 3 skills nobody else combines." },
  ];
}

export function generatePostVariants(title: string, profile: string): PostVariant[] {
  return [
    {
      hookStyle: "Contrarian",
      postText: `Everyone's celebrating AI taking over their workflows.\n\nI'm worried.\n\nLast month, I automated 3 hours of my daily work with an AI agent. The productivity gains were immediate and impressive.\n\nBut here's what nobody's talking about:\n\nI stopped understanding my own business processes. When the agent broke down for 2 days, I couldn't do the work manually anymore. I'd forgotten the nuances.\n\nWe're not just automating tasks. We're outsourcing institutional knowledge.\n\nThe companies that will win aren't the ones that automate fastest. They're the ones that automate intentionally — keeping humans in the loop where understanding matters.\n\n3 questions I now ask before automating anything:\n\n→ Will I lose critical knowledge if this breaks?\n→ Is the AI handling judgment calls or just repetitive tasks?\n→ Can a new hire learn this process without the AI?\n\nAutomation without understanding is just sophisticated dependency.\n\nWhat's your approach to balancing AI automation with human expertise?\n\n#AI #Leadership #FutureOfWork #Automation`,
      wordCount: 152,
    },
    {
      hookStyle: "Transformation",
      postText: `I used to believe working harder was the answer.\n\n12-hour days. Weekend sprints. "Hustle culture" disguised as dedication.\n\nThen I set up an AI agent to handle my most time-consuming tasks.\n\n3 hours freed up. Every. Single. Day.\n\nBut the real transformation wasn't about productivity.\n\nIt was about what I did with those 3 hours:\n\n→ Deep strategy work I'd been postponing for months\n→ Actual conversations with my team (not status updates)\n→ Creative thinking that led to our best product feature this year\n\nThe uncomfortable truth? I wasn't busy. I was hiding behind busy.\n\nAI didn't replace my work. It exposed which parts of my work actually mattered.\n\nThe question isn't "What can AI do for me?"\n\nIt's "What will I do with the time AI gives me back?"\n\nMost people will fill it with more busywork. Don't be most people.\n\nWhat would you do with 3 extra hours every day?\n\n#AI #Productivity #Leadership #PersonalGrowth`,
      wordCount: 163,
    },
    {
      hookStyle: "Hidden Insight",
      postText: `Nobody talks about AI's biggest risk.\n\nIt's not job displacement. It's not hallucinations. It's not even bias.\n\nIt's competence erosion.\n\nI automated 3 hours of daily work last month. Reporting, data cleaning, email drafts — all handled by an AI agent.\n\nWeek 1: Euphoria. "Why didn't I do this sooner?"\nWeek 2: Confidence. "I'm so much more productive."\nWeek 3: Realization. "Wait, how did I used to do this?"\nWeek 4: Panic. The agent went down. I was lost.\n\nThis is the pattern nobody's discussing:\n\nAutomation → Convenience → Dependency → Incompetence\n\nIt happened with GPS and navigation skills.\nIt happened with calculators and mental math.\nIt's happening now with AI and critical thinking.\n\nThe fix isn't avoiding AI. It's designing your automation with "knowledge checkpoints" — regular intervals where you do the work manually.\n\nYour AI should be a tool, not a crutch.\n\nHave you noticed your skills changing since using AI tools?\n\n#AI #CriticalThinking #Technology #FutureOfWork`,
      wordCount: 168,
    },
  ];
}

export function predictEngagement(postText: string, followers: number): EngagementPrediction {
  const words = postText.split(/\s+/).length;
  const hasQuestion = postText.includes("?");
  const hasEmoji = /[\u{1F600}-\u{1F9FF}]/u.test(postText);
  const hashtags = (postText.match(/#\w+/g) || []).length;
  const hasPersonalStory = /\b(I |my |me )\b/i.test(postText);
  const hasNumbers = /\b\d+\b/.test(postText);

  let baseReactions = Math.log(followers + 1) * 3.2;
  let baseComments = Math.log(followers + 1) * 0.8;

  // Word count sweet spot
  if (words >= 100 && words <= 200) { baseReactions *= 1.4; baseComments *= 1.3; }
  if (hasQuestion) { baseComments *= 1.6; baseReactions *= 1.1; }
  if (hasPersonalStory) { baseReactions *= 1.35; baseComments *= 1.25; }
  if (hasNumbers) { baseReactions *= 1.15; }
  if (hashtags >= 3 && hashtags <= 5) { baseReactions *= 1.1; }

  // Add some variance
  const variance = 0.8 + Math.random() * 0.4;

  return {
    reactions: Math.max(5, Math.round(baseReactions * variance)),
    comments: Math.max(1, Math.round(baseComments * variance)),
  };
}
