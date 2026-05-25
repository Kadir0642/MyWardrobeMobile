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

// --- VESTIFY CAPSULE ENGINE TYPES ---

export interface CapsuleOutfit {
  outfitName: string;
  userItems: string[]; // Backend'den ID listesi dönüyor ("94", "86" vb.)
  partnerUpsellItem: string; // Partner ürün ID'si
  stylistPitch: string; // Yapay zekanın yazdığı elit pazarlama metni
}

export interface CapsuleResponse { // backend'den uygulamaya
  capsuleTitle: string;
  coreCapsuleItemIds: string[];
  outfits: CapsuleOutfit[];
}

export interface CapsuleRequest { // uygulamadan backend'e
  userId: string;
  mode: string;
  target: string;
  date: string;
  temperature: string;
  tripPurpose: string;
}

// Partner (Mağaza) Ürünleri için Type (İleride genişleteceğiz)
export interface PartnerItem {
  id: string;
  brand: string;
  name: string;
  price: string;
  category: string;
  imageUrl?: string; // Uygulamada göstermek için ileride ekleyeceğiz
}