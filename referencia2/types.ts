
export interface Manga {
  id: string;
  title: string;
  cover: string;
  scan: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  lastUpdate: string;
  chapter: string;
  author?: string;
  genres?: string[];
  description?: string;
  chapterTitle?: string;
  lastPage?: string;
  prevChapter?: string;
  prevChapterTitle?: string;
  prevChapterUpdate?: string;
  isRead?: boolean;
  prevIsRead?: boolean;
  isSubscriberOnly?: boolean; // Nuevo: indica si el último cap es exclusivo
}

export interface Scan {
  id: string;
  name: string;
  logo: string;
  memberCount: number;
  isNSFW?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  rank: string;
  price: string;
  benefits: string[];
  color: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  banner?: string;
  email: string;
  description?: string;
  isPro?: boolean;
}
