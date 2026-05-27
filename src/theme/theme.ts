// Vestify Ana Renk Paleti - "Gusto / Akdeniz Lüksü"

export const COLORS = {
  // 1. Ana Marka Rengi (Domates Kırmızısı) - Aksiyonlar, ikonlar, dikkat çekici vurgular
  primary: '#D6453A',
  
  // 2. Aksiyon Rengi (Hardal Sarısı) - Badge'ler, yıldızlar, ikinci plan vurgular
  accent: '#EBB638',
  
  // 3. Metin Rengi (Kömür Grisi) - Simsiyah yerine lüks ve yumuşak bir okuma deneyimi
  text: '#2C3539',
  
  // 4. İkincil Metin Rengi (Soluk Mavi/Gri) - Alt başlıklar, pasif yazılar
  textSecondary: '#8B9BB4',

  // 5. Arka Plan (Sıcak Krem) - Uygulamanın genel lüks zemin rengi
  background: '#F8F6F0',
  
  // 6. Kart Arka Planı (Saf Beyaz) - Kıyafet kartlarının zemin rengi (kremin üstünde patlaması için)
  surface: '#FFFFFF',

  // 7. Uyarı Rengi (Bordo) 
  error: '#721C24',
  
  // Çizgiler ve Kenarlıklar (Yumuşak Krem-Gri)
  border: '#E2DEC6',
};

// Ortak Gölgelendirme (Shadow) Stilleri - Yeni renklere göre dinamik ayarlandı
export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, 
  },
  medium: {
    shadowColor: COLORS.primary, // Gölgelerde hafif bir kırmızı sıcaklığı
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  }
};