export type Chapter = {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
  subscribersOnly: boolean;
  chapterUrl: string;
  isRead?: boolean;
};

export type Manga = {
  id: string;
  title: string;
  slug?: string;
  cover: string;
  isNSFW?: boolean;
  scanName?: string;
  scanSlug?: string;
  scanUrl?: string;
  mangaSlug?: string;
  mangaUrl?: string;
  badgeColor?: string;
  chapters?: Chapter[];
};

export type Tenant = {
  id: string;
  name: string;
  description: string;
  url: string;
  color: string;
  features?: string[];
  mostRead: Manga[];
  recent: Manga[];
};

export type Step = {
  number: number;
  title: string;
  description: string;
};
