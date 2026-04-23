// Java'daki Enum'larımızın Typescript karşılıkları (Güvenli veri tipleri)
export type ItemStatus = 'WARDROBE' | 'ARCHIVED' | 'DELETED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ItemSeason = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'ALL_SEASON' | 'BELIRTILMEDI';
export type ItemCondition = 'NEW_WITH_TAG' | 'LIKE_NEW' | 'USED' | 'HEAVILY_USED';

export interface ClothingItem {
  id: number;
  name: string;
  brand?: string; // Soru işareti (?) bu alanın boş (null) gelebileceğini belirtir
  imageUrl: string;
  category: string;
  subCategory: string;
  formality?: string;
  color: string;
  size?: string;
  condition?: ItemCondition;
  status: ItemStatus;
  season?: ItemSeason;
  description?: string;
  purchasePrice?: number;
  purchasedDate?: string;
  wearCount: number;
  loveFactor?: number;
  isSharable: boolean;
  isFavorite: boolean;
  moderationStatus: ModerationStatus;
  createdAt?: string;
  costPerWear?: number; // Java'daki @Transient metodumuzdan gelecek
}

// AI'dan dönecek olan o yeşil "COMPLETED" yanıtının tipi
export interface AiExtractionResponse {
  status: string;
  message: string;
  saved_urls?: string[];
}