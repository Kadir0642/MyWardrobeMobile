import axios from 'axios';

// Telefonunun bilgisayarına bağlanabilmesi için kendi Wi-Fi IP adresini (eski çalışan adresini) girdik.
// İleride sunucuya yüklediğimizde buraya sadece "https://vestify-api.com/api/v1" yazacağız ve tüm sistem tek tıkla değişecek.
const BASE_URL = 'http:///192.168.1.103:8080/api/v1'; 

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // DİKKAT: Content-Type kısmını sildik! Axios, veri gönderirken (POST) bunu otomatik ayarlayacak, 
  // GET isteklerinde ise gereksiz yere Java'nın kafasını karıştırmayacak.
});

// RLHF Geri Bildirim Tipi (Java DTO'su ile %100 uyumlu)
export interface OutfitFeedbackPayload {
  userId: number;
  outfitItemIds: number[];
  feedbackType: 'LIKE' | 'DISLIKE';
  reasonCode: 'DONT_PAIR_THESE' | 'COLOR_MISMATCH' | 'TOO_COOL_FOR_WEATHER' | 'TOO_WARM_FOR_WEATHER' | 'MISMATCHED_CATEGORIES' | 'NONE';
  targetItemIds: number[];
  weatherContext: string;
}

// AI'ı Eğiten Post Fonksiyonu
export const sendOutfitFeedback = async (payload: OutfitFeedbackPayload) => {
  try {
    const response = await apiClient.post('/feedback', payload);
    console.log('✅ [RLHF] Geri bildirim Java Backend\'e fırlatıldı!');
    return response.data;
  } catch (error) {
    console.error('🚨 [RLHF] Geri bildirim gönderilirken hata oluştu:', error);
    throw error;
  }
};