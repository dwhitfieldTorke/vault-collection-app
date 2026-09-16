export type ItemCategory = "comic" | "trading_card" | "video_game" | "lego";

export const CATEGORIES: ItemCategory[] = ["comic", "trading_card", "video_game", "lego"];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  comic: "Comics",
  trading_card: "Trading Cards",
  video_game: "Video Games",
  lego: "Legos",
};

export const CATEGORY_TAB_LABELS: Record<ItemCategory, string> = {
  comic: "Comics",
  trading_card: "Trading cards",
  video_game: "Video games",
  lego: "Legos",
};

export const CATEGORY_SHELF_LABELS: Record<ItemCategory, string> = {
  comic: "comics shelf",
  trading_card: "card binder",
  video_game: "game shelf",
  lego: "brick shelf",
};

export const EDITION_LABELS: Record<ItemCategory, string> = {
  comic: "Issue number",
  trading_card: "Card number",
  video_game: "Platform",
  lego: "Set number",
};

export const SOURCE_LABELS: Record<ItemCategory, string> = {
  comic: "Publisher",
  trading_card: "Set",
  video_game: "Publisher",
  lego: "Theme",
};

export const SEARCH_PLACEHOLDERS: Record<ItemCategory, string> = {
  comic: "Search title, issue, publisher",
  trading_card: "Search player, set, number",
  video_game: "Search title, platform, publisher",
  lego: "Search set name, number, theme",
};

export const CATEGORY_SLUGS: Record<ItemCategory, string> = {
  comic: "comics",
  trading_card: "cards",
  video_game: "games",
  lego: "legos",
};

export function categoryFromSlug(slug: string): ItemCategory | undefined {
  return CATEGORIES.find((c) => CATEGORY_SLUGS[c] === slug);
}

export interface GradeOption {
  key: string;
  label: string;
  note: string;
  multiplier: number;
}

export const COMIC_GRADES: GradeOption[] = [
  { key: "nm94", label: "NM 9.4", note: "Near mint", multiplier: 1.0 },
  { key: "vf80", label: "VF 8.0", note: "Very fine", multiplier: 0.62 },
  { key: "fn60", label: "FN 6.0", note: "Fine", multiplier: 0.38 },
  { key: "vg40", label: "VG 4.0", note: "Very good", multiplier: 0.24 },
  { key: "gd20", label: "GD 2.0", note: "Good", multiplier: 0.14 },
  { key: "ungraded", label: "Ungraded", note: "Raw, unslabbed", multiplier: 0.3 },
];

export const CARD_GRADES: GradeOption[] = [
  { key: "psa10", label: "PSA 10", note: "Gem mint", multiplier: 1.0 },
  { key: "psa9", label: "PSA 9", note: "Mint", multiplier: 0.44 },
  { key: "psa8", label: "PSA 8", note: "NM-MT", multiplier: 0.26 },
  { key: "bgs95", label: "BGS 9.5", note: "Gem mint", multiplier: 0.72 },
  { key: "rawnm", label: "Raw NM", note: "Ungraded", multiplier: 0.2 },
  { key: "rawex", label: "Raw EX", note: "Ungraded", multiplier: 0.1 },
];

export const VIDEO_GAME_GRADES: GradeOption[] = [
  { key: "sealed", label: "Sealed", note: "Factory sealed", multiplier: 1.0 },
  { key: "cib", label: "CIB", note: "Complete in box", multiplier: 0.55 },
  { key: "loose", label: "Loose", note: "Cart/disc only", multiplier: 0.3 },
  { key: "digital", label: "Digital", note: "Digital copy", multiplier: 0.15 },
];

export const LEGO_GRADES: GradeOption[] = [
  { key: "misb", label: "Sealed (MISB)", note: "Mint in sealed box", multiplier: 1.0 },
  { key: "opened_complete", label: "Opened · Complete", note: "All pieces present", multiplier: 0.55 },
  { key: "opened_incomplete", label: "Opened · Incomplete", note: "Missing pieces", multiplier: 0.3 },
  { key: "no_box", label: "No box", note: "Built, no box", multiplier: 0.35 },
];

const GRADE_TABLES: Record<ItemCategory, GradeOption[]> = {
  comic: COMIC_GRADES,
  trading_card: CARD_GRADES,
  video_game: VIDEO_GAME_GRADES,
  lego: LEGO_GRADES,
};

export function gradesFor(category: ItemCategory): GradeOption[] {
  return GRADE_TABLES[category];
}

export function gradeOption(category: ItemCategory, gradeKey: string): GradeOption {
  const grades = gradesFor(category);
  return grades.find((g) => g.key === gradeKey) ?? grades[0];
}

export function computeMarket(category: ItemCategory, gradeKey: string, basePrice: number): number {
  return Math.round(basePrice * gradeOption(category, gradeKey).multiplier);
}

// Only comics and trading cards go through a third-party grading service —
// the "what if I graded this?" comparison only makes sense for those two.
export function isGradable(category: ItemCategory): boolean {
  return category === "comic" || category === "trading_card";
}

const RAW_GRADE_KEYS = new Set(["ungraded", "rawnm", "rawex"]);

export function isRawGrade(gradeKey: string): boolean {
  return RAW_GRADE_KEYS.has(gradeKey);
}

export interface Item {
  itemId: string;
  ownerId: string;
  category: ItemCategory;
  title: string;
  edition: string;
  source: string;
  variant?: string;
  year?: number;
  coverPrice?: number;
  gradeKey: string;
  basePrice: number;
  market: number;
  quantity: number;
  purchasePrice?: number;
  value: number;
  note?: string;
  photoUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export function itemTotalValue(item: Item): number {
  return item.value * item.quantity;
}

export function itemTotalCost(item: Item): number {
  return (item.purchasePrice ?? 0) * item.quantity;
}

export function itemProfit(item: Item): number {
  return itemTotalValue(item) - itemTotalCost(item);
}

export function itemROI(item: Item): number | null {
  if (!item.purchasePrice) return null;
  return ((item.value - item.purchasePrice) / item.purchasePrice) * 100;
}

export type ItemFormData = Omit<Item, "itemId" | "ownerId" | "createdAt" | "updatedAt">;

export function toFormData(item: Item): ItemFormData {
  return {
    category: item.category,
    title: item.title,
    edition: item.edition,
    source: item.source,
    variant: item.variant,
    year: item.year,
    coverPrice: item.coverPrice,
    gradeKey: item.gradeKey,
    basePrice: item.basePrice,
    market: item.market,
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    value: item.value,
    note: item.note,
    photoUrl: item.photoUrl,
  };
}

export function emptyFormData(category: ItemCategory): ItemFormData {
  const gradeKey = gradesFor(category)[0].key;
  return {
    category,
    title: "",
    edition: "",
    source: "",
    gradeKey,
    basePrice: 0,
    market: 0,
    quantity: 1,
    value: 0,
  };
}
