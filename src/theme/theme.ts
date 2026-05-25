// Vestify Ana Renk Paleti - "Earthy Minimalist / Lüks Toprak Tonları"

export const COLORS = {
  // 1. Ana Marka Rengi (Zümrüt / Orman Yeşili) - Header, İkonlar, Ana Vurgular
  primary: '#115C38',
  
  // 2. Aksiyon Rengi (Fıstık Yeşili) - Satın Al Butonları, Kaydet, Önemli Tıklamalar
  accent: '#B2D235',
  
  // 3. Metin Rengi (Zengin Çikolata Kahvesi) - Simsiyah yerine lüks ve yumuşak bir okuma deneyimi
  text: '#4A2E1B',
  
  // 4. İkincil Metin Rengi (Açık Kahve / Gri-Kahve) - Alt başlıklar, pasif yazılar
  textSecondary: '#8B7355',

  // 5. Arka Plan (Kırık Beyaz / Krem) - Uygulamanın genel zemin rengi
  background: '#F9F6F0',
  
  // 6. Kart Arka Planı (Saf Beyaz) - Kıyafet kartlarının zemin rengi (kremin üstünde patlaması için)
  surface: '#FFFFFF',

  // 7. Uyarı Rengi (Bordo / Şarap Kırmızısı) - Hatalar, tükendi bildirimleri
  error: '#721C24',
  
  // Çizgiler ve Kenarlıklar (Borders)
  border: '#E5DFD3',
};

// Ortak Gölgelendirme (Shadow) Stilleri - Kartların havada süzülüyormuş gibi durması için
export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, // Android için
  },
  medium: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  }
};