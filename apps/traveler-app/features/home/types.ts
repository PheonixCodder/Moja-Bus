export type BannerActionType = "SEARCH" | "APP_SCREEN" | "BLOG_ARTICLE" | "EXTERNAL_URL";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  imageUrl: string;
  actionType: BannerActionType;
  actionPayload: any;
  gradientColors: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface PopularRoute {
  id: string;
  originName: string;
  destinationName: string;
  originSlug: string;
  destinationSlug: string;
  startingPriceXOF: number;
}
