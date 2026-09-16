export type ItemCategory = "comic" | "trading_card" | "video_game" | "lego";

export const CATEGORIES: ItemCategory[] = ["comic", "trading_card", "video_game", "lego"];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  comic: "Comics",
  trading_card: "Trading Cards",
  video_game: "Video Games",
  lego: "Legos",
};

export interface ComicDetails {
  series: string;
  issueNumber: string;
  publisher?: string;
  year?: number;
  variant?: string;
  grade?: string;
  keyIssue: boolean;
}

export interface TradingCardDetails {
  game: string;
  setName?: string;
  cardNumber?: string;
  subject?: string;
  year?: number;
  grade?: string;
  rarity?: string;
}

export type VideoGameCondition = "sealed" | "cib" | "loose" | "digital";

export interface VideoGameDetails {
  platform: string;
  region?: string;
  condition: VideoGameCondition;
  genre?: string;
  publisher?: string;
  year?: number;
}

export const VIDEO_GAME_CONDITIONS: VideoGameCondition[] = ["sealed", "cib", "loose", "digital"];

export const VIDEO_GAME_CONDITION_LABELS: Record<VideoGameCondition, string> = {
  sealed: "Sealed",
  cib: "Complete in box",
  loose: "Loose",
  digital: "Digital",
};

export type LegoBoxCondition = "misb" | "opened_complete" | "opened_incomplete" | "no_box";

export interface LegoDetails {
  setNumber: string;
  theme?: string;
  pieceCount?: number;
  boxCondition: LegoBoxCondition;
  minifigsIncluded?: number;
  year?: number;
}

export const LEGO_BOX_CONDITIONS: LegoBoxCondition[] = [
  "misb",
  "opened_complete",
  "opened_incomplete",
  "no_box",
];

export const LEGO_BOX_CONDITION_LABELS: Record<LegoBoxCondition, string> = {
  misb: "Sealed (MISB)",
  opened_complete: "Opened — complete",
  opened_incomplete: "Opened — incomplete",
  no_box: "No box",
};

export interface ItemBase {
  itemId: string;
  ownerId: string;
  name: string;
  photoUrls: string[];
  acquiredDate?: number;
  purchasePrice?: number;
  currentValue?: number;
  notes?: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Item =
  | (ItemBase & { category: "comic"; details: ComicDetails })
  | (ItemBase & { category: "trading_card"; details: TradingCardDetails })
  | (ItemBase & { category: "video_game"; details: VideoGameDetails })
  | (ItemBase & { category: "lego"; details: LegoDetails });

type ItemBaseFormData = Omit<ItemBase, "itemId" | "ownerId" | "createdAt" | "updatedAt">;

// Defined as an explicit discriminated union (rather than derived via Omit<Item, ...>)
// so that narrowing on `category` still narrows `details` — Omit over a union type
// flattens it into a single object type and loses that correlation.
export type ItemFormData =
  | (ItemBaseFormData & { category: "comic"; details: ComicDetails })
  | (ItemBaseFormData & { category: "trading_card"; details: TradingCardDetails })
  | (ItemBaseFormData & { category: "video_game"; details: VideoGameDetails })
  | (ItemBaseFormData & { category: "lego"; details: LegoDetails });

export const EMPTY_DETAILS: {
  comic: ComicDetails;
  trading_card: TradingCardDetails;
  video_game: VideoGameDetails;
  lego: LegoDetails;
} = {
  comic: { series: "", issueNumber: "", keyIssue: false },
  trading_card: { game: "" },
  video_game: { platform: "", condition: "loose" },
  lego: { setNumber: "", boxCondition: "opened_complete" },
};

export function emptyFormData(category: ItemCategory): ItemFormData {
  const base = {
    name: "",
    photoUrls: [],
    tags: [],
    favorite: false,
  };
  switch (category) {
    case "comic":
      return { ...base, category, details: { ...EMPTY_DETAILS.comic } };
    case "trading_card":
      return { ...base, category, details: { ...EMPTY_DETAILS.trading_card } };
    case "video_game":
      return { ...base, category, details: { ...EMPTY_DETAILS.video_game } };
    case "lego":
      return { ...base, category, details: { ...EMPTY_DETAILS.lego } };
  }
}
