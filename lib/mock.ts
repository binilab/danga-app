export type MockPost = {
  id: string;
  title: string;
  author: string;
  styleTag: string;
  likes: number;
  score: number;
  comments: number;
  imageLabel: string;
  createdAt: string;
};

export type RankEntry = {
  rank: number;
  nickname: string;
  score: number;
  streakDays: number;
};

export type LandingStep = {
  id: number;
  title: string;
  description: string;
};

export type LandingGalleryItem = {
  id: string;
  title: string;
  author: string;
  votes: number;
  comments: number;
  imageLabel: string;
};

export type WeeklyTopRanker = {
  rank: number;
  nickname: string;
  score: number;
  trend: "up" | "same" | "down";
  topPercent: boolean;
};

export const feedPosts: MockPost[] = [
  {
    id: "1001",
    title: "출근 룩, 깔끔하게 맞췄어요",
    author: "minji_fit",
    styleTag: "미니멀",
    likes: 142,
    score: 91,
    comments: 21,
    imageLabel: "오프화이트 셔츠 + 슬랙스",
    createdAt: "2026-02-13",
  },
  {
    id: "1002",
    title: "비 오는 날 레이어드 테스트",
    author: "raincoat_ho",
    styleTag: "레이어드",
    likes: 97,
    score: 86,
    comments: 12,
    imageLabel: "후드 + 트렌치",
    createdAt: "2026-02-13",
  },
  {
    id: "1003",
    title: "올블랙인데 심심하지 않게",
    author: "blackmood",
    styleTag: "스트릿",
    likes: 188,
    score: 94,
    comments: 35,
    imageLabel: "블랙 재킷 + 카고팬츠",
    createdAt: "2026-02-14",
  },
  {
    id: "1004",
    title: "데님 셋업 첫 도전",
    author: "yoon_denim",
    styleTag: "캐주얼",
    likes: 72,
    score: 82,
    comments: 9,
    imageLabel: "데님 재킷 + 와이드 진",
    createdAt: "2026-02-11",
  },
  {
    id: "1005",
    title: "단번에 눈에 띄는 컬러 매치",
    author: "colorpick",
    styleTag: "포인트컬러",
    likes: 203,
    score: 95,
    comments: 43,
    imageLabel: "오렌지 니트 + 네이비 팬츠",
    createdAt: "2026-02-14",
  },
  {
    id: "1006",
    title: "주말 브런치 룩 평가 부탁",
    author: "brunch_j",
    styleTag: "데일리",
    likes: 85,
    score: 83,
    comments: 17,
    imageLabel: "가디건 + 플리츠",
    createdAt: "2026-02-10",
  },
  {
    id: "1007",
    title: "운동 끝나고 바로 입는 애슬레저",
    author: "fit_fast",
    styleTag: "애슬레저",
    likes: 111,
    score: 88,
    comments: 14,
    imageLabel: "집업 + 조거팬츠",
    createdAt: "2026-02-15",
  },
  {
    id: "1008",
    title: "봄 대비 라이트 자켓 조합",
    author: "spring_ready",
    styleTag: "시즌룩",
    likes: 64,
    score: 80,
    comments: 8,
    imageLabel: "라이트 블루 자켓",
    createdAt: "2026-02-09",
  },
  {
    id: "1009",
    title: "포멀+스트릿 믹스 실험",
    author: "mixnmatch",
    styleTag: "믹스매치",
    likes: 156,
    score: 90,
    comments: 28,
    imageLabel: "블레이저 + 스니커즈",
    createdAt: "2026-02-12",
  },
  {
    id: "1010",
    title: "톤온톤 코디 어디까지 가능?",
    author: "tonetone",
    styleTag: "톤온톤",
    likes: 119,
    score: 89,
    comments: 16,
    imageLabel: "베이지 니트 + 코트",
    createdAt: "2026-02-08",
  },
  {
    id: "1011",
    title: "요즘 유행한 실루엣 적용해봄",
    author: "trend_hub",
    styleTag: "트렌드",
    likes: 133,
    score: 87,
    comments: 24,
    imageLabel: "오버핏 셔츠 + 숏팬츠",
    createdAt: "2026-02-11",
  },
  {
    id: "1012",
    title: "기본템으로만 만든 출근룩 2",
    author: "office_loop",
    styleTag: "베이식",
    likes: 76,
    score: 84,
    comments: 11,
    imageLabel: "셔츠 + 니트 베스트",
    createdAt: "2026-02-15",
  },
];

export const landingHowSteps: LandingStep[] = [
  {
    id: 1,
    title: "올린다",
    description: "오늘 코디 사진과 한 줄 설명을 올리고 빠르게 피드에 노출합니다.",
  },
  {
    id: 2,
    title: "투표받는다",
    description: "유저들의 좋아요와 코멘트로 즉시 반응을 확인할 수 있습니다.",
  },
  {
    id: 3,
    title: "랭킹 오른다",
    description: "지속적으로 좋은 평가를 받으면 주간 랭킹 상위권에 진입합니다.",
  },
];

export const landingGalleryItems: LandingGalleryItem[] = feedPosts
  .slice(0, 10)
  .map((post) => ({
    id: post.id,
    title: post.title,
    author: post.author,
    votes: post.likes,
    comments: post.comments,
    imageLabel: post.imageLabel,
  }));

export const rankEntries: RankEntry[] = [
  { rank: 1, nickname: "blackmood", score: 9870, streakDays: 42 },
  { rank: 2, nickname: "colorpick", score: 9430, streakDays: 31 },
  { rank: 3, nickname: "minji_fit", score: 9065, streakDays: 18 },
  { rank: 4, nickname: "mixnmatch", score: 8840, streakDays: 24 },
  { rank: 5, nickname: "tonetone", score: 8615, streakDays: 12 },
  { rank: 6, nickname: "fit_fast", score: 8208, streakDays: 9 },
  { rank: 7, nickname: "raincoat_ho", score: 7995, streakDays: 10 },
  { rank: 8, nickname: "trend_hub", score: 7750, streakDays: 7 },
  { rank: 9, nickname: "spring_ready", score: 7622, streakDays: 8 },
  { rank: 10, nickname: "office_loop", score: 7480, streakDays: 6 },
];

export const weeklyTopRankers: WeeklyTopRanker[] = rankEntries.map((entry) => ({
  rank: entry.rank,
  nickname: entry.nickname,
  score: entry.score,
  trend: entry.rank <= 3 ? "up" : entry.rank <= 7 ? "same" : "down",
  topPercent: entry.rank <= 2,
}));

export const landingPreviewPosts = feedPosts.slice(0, 6);

/**
 * 상세 페이지에서 id에 맞는 게시글 데이터를 찾아 반환합니다.
 */
export function getPostById(id: string): MockPost | undefined {
  return feedPosts.find((post) => post.id === id);
}

/**
 * 이미지 파일 없이도 카드 썸네일을 보여주기 위해 SVG data URL을 생성합니다.
 */
export function createPlaceholderImage(label: string): string {
  const safeLabel = label.length > 24 ? `${label.slice(0, 24)}...` : label;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720"><rect width="960" height="720" fill="#f8fafc"/><rect x="36" y="36" width="888" height="648" rx="32" fill="#e2e8f0"/><circle cx="170" cy="170" r="58" fill="#cbd5e1"/><rect x="270" y="122" width="500" height="26" rx="13" fill="#cbd5e1"/><rect x="270" y="170" width="360" height="22" rx="11" fill="#dbe4ee"/><rect x="90" y="420" width="780" height="168" rx="24" fill="#f1f5f9"/><text x="480" y="510" text-anchor="middle" font-size="40" font-family="sans-serif" font-weight="700" fill="#475569">${safeLabel}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
