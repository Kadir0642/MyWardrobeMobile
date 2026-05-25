import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, ImageBackground, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// YENİ: Gerçek Takvim Bileşeni
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { COLORS, SHADOWS } from '../theme/theme'; // Gofrik Paletini çekiyoruz

const { width, height } = Dimensions.get('window');

const DYNAMIC_IMAGES: Record<string, any> = {
    'london': { uri: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop' },
    'paris': { uri: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea58e?q=80&w=2073&auto=format&fit=crop' },
    'travel_default': { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop' },
    'event_default': { uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop' }
};

export default function PlannerScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    
    const [mode, setMode] = useState<'travel' | 'event'>('travel');
    const [inputText, setInputText] = useState(''); 
    const [tripPurpose, setTripPurpose] = useState('Leisure'); 
    
    // YENİ: Tarih Aralığı State'leri
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [weatherData, setWeatherData] = useState<{ temp: string, city: string, icon: string, color: string } | null>(null);

    const normalizedInput = inputText.trim().toLowerCase();
    const bgImage = DYNAMIC_IMAGES[normalizedInput] || (mode === 'travel' ? DYNAMIC_IMAGES['travel_default'] : DYNAMIC_IMAGES['event_default']);

    // Takvimde seçilen gün aralığını hesapla ve işaretle
    const getMarkedDates = () => {
        let marked: any = {};
        if (startDate) {
            marked[startDate] = { startingDay: true, color: COLORS.primary, textColor: 'white' };
        }
        if (endDate) {
            marked[endDate] = { endingDay: true, color: COLORS.primary, textColor: 'white' };
            // Eğer başlangıç ve bitiş farklıysa arayı doldur
            if (startDate !== endDate) {
                // Basit bir tarih aralığı doldurma mantığı (Gerçek uygulamada moment.js veya date-fns kullanılabilir)
                 // Burası UI göstermek içindir, şimdilik sadece uç noktaları boyayalım.
            }
        }
        return marked;
    };

    const handleDayPress = (day: any) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(day.dateString);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (day.dateString >= startDate) {
                setEndDate(day.dateString);
            } else {
                setStartDate(day.dateString); // Eğer geriye tıklarsa başlangıcı sıfırla
            }
        }
    };

    const handleGenerate = async () => {
        if (!inputText || !startDate || !endDate) {
            alert("Lütfen destinasyon ve geçerli bir tarih aralığı (Başlangıç ve Bitiş) seçin.");
            return;
        }

        setIsLoading(true);
        try {
            // Önce Hava Durumunu Çek (Mevcut mantık)
            let currentTemp = "15°C"; // Fallback sıcaklık
            if (mode === 'travel') {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputText)}&count=1&language=en&format=json`);
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude, name, country } = geoData.results[0];
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                    const weatherJson = await weatherRes.json();
                    if (weatherJson.current_weather) {
                        currentTemp = `${Math.round(weatherJson.current_weather.temperature)}°C`;
                        setWeatherData({ temp: currentTemp, city: `${name}, ${country}`, icon: 'weather-cloudy', color: '#90A4AE' });
                    }
                }
            }


            // Seçilen tarihler arasındaki gün sayısını hesapla
            let tripDurationInDays = 3; // Varsayılan 3 gün
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                tripDurationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 ile başlangıç gününü de sayıyoruz
            }

            // 🚀 ANA BAĞLANTI: Spring Boot Backend'e İstek Atıyoruz
            const requestPayload = {
                userId: "1", // Şimdilik statik, ileride Auth sisteminden (ProfileContext) gelecek
                mode: mode,
                target: inputText,
                date: `${startDate} to ${endDate}`, 
                days: tripDurationInDays, // Tarih aralığını yolluyoruz | Backend'e gün sayısını yolluyoruz!
                temperature: currentTemp,
                tripPurpose: tripPurpose
            };

            const response = await apiClient.post('/capsules/generate', requestPayload);
            
            // Başarılı olursa Lüks Sonuç Ekranına Yönlendir (Bu ekranı sonra yapacağız)
            navigation.navigate('CapsuleResultScreen', { capsuleData: response.data });

        } catch (error) {
            console.error("API Hatası:", error);
            alert("Bavulunuz hazırlanırken bir sorun oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    // UI'da gösterilecek tarih metni
    const dateDisplayText = startDate ? (endDate ? `${startDate} - ${endDate}` : startDate) : 'Tarih Seç (Başlangıç ve Bitiş)';

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ImageBackground source={bgImage} style={styles.headerBackground} imageStyle={{ opacity: 0.65 }}>
                <BlurView intensity={20} tint="dark" style={styles.blurOverlay}>
                    {/* Mode Toggle Kısmı */}
                    <View style={[styles.modeToggleContainer, { top: Math.max(insets.top, 40) }]}>
                        <TouchableOpacity style={[styles.modeBtn, mode === 'travel' && styles.modeBtnActive]} onPress={() => setMode('travel')}>
                            <Feather name="plane" size={16} color={mode === 'travel' ? COLORS.primary : '#FFF'} />
                            <Text style={[styles.modeBtnText, mode === 'travel' && styles.modeBtnTextActive]}>Seyahat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modeBtn, mode === 'event' && styles.modeBtnActive]} onPress={() => setMode('event')}>
                            <Feather name="star" size={16} color={mode === 'event' ? COLORS.primary : '#FFF'} />
                            <Text style={[styles.modeBtnText, mode === 'event' && styles.modeBtnTextActive]}>Etkinlik</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{mode === 'travel' ? 'Nereye Gidiyoruz?' : 'Özel Bir An?'}</Text>
                        <Text style={styles.headerSubtitle}>
                            {mode === 'travel' ? "Rotanı belirle, bavulunu Vestify hazırlasın." : "Kusursuz görün, gerisini bize bırak."}
                        </Text>
                    </View>
                </BlurView>
            </ImageBackground>

            <View style={styles.plannerCard}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}>
                    
                    {/* Destinasyon Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{mode === 'travel' ? 'Destinasyon' : 'Etkinlik Türü'}</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name={mode === 'travel' ? 'map-pin' : 'activity'} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={mode === 'travel' ? "Örn: Londra, Paris..." : "Örn: Düğün, Tarihi Gezi..."}
                                placeholderTextColor={COLORS.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                            />
                        </View>
                    </View>

                    {/* Lüks Tarih Seçici Buton */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{mode === 'travel' ? 'Seyahat Tarihleri' : 'Etkinlik Tarihi'}</Text>
                        <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.7} onPress={() => setDatePickerVisible(true)}>
                            <Feather name="calendar" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <Text style={[styles.inputText, !startDate && { color: COLORS.textSecondary }]}>{dateDisplayText}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Hava Durumu & Satış Ortaklığı Banner */}
                    <View style={styles.promoBanner}>
                        <Feather name="zap" size={18} color={COLORS.primary} />
                        <Text style={styles.promoText}>Vestify AI, seyahat sürene uygun bir ana bavul oluşturup eksik parçaları premium partnerlerimizle tamamlar.</Text>
                    </View>

                    {/* Generate Butonu (Gofrik Accent Rengi) */}
                    <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleGenerate} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.text} />
                        ) : (
                            <>
                                <Text style={styles.createButtonText}>Akıllı Bavulumu Hazırla</Text>
                                <Feather name="arrow-right" size={20} color={COLORS.text} />
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </View>

            {/* GERÇEK VE ŞIK TAKVİM MODALI */}
            <Modal visible={isDatePickerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.datePickerCard}>
                        <Text style={styles.datePickerTitle}>Tarih Aralığı Seçin</Text>
                        
                        <Calendar
                            markingType={'period'}
                            markedDates={getMarkedDates()}
                            onDayPress={handleDayPress}
                            theme={{
                                todayTextColor: COLORS.primary,
                                arrowColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                textDayFontWeight: '500',
                            }}
                            style={{ width: width * 0.85, borderRadius: 10, marginTop: 15 }}
                        />

                        <View style={{ flexDirection: 'row', marginTop: 20, gap: 15 }}>
                            <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: '#F5F5F5' }]} onPress={() => setDatePickerVisible(false)}>
                                <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.calendarBtn, { backgroundColor: COLORS.primary }]} onPress={() => setDatePickerVisible(false)}>
                                <Text style={{ color: '#FFF', fontWeight: '600' }}>Onayla</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

// 🚀 GOFRİK RENK PALETİNE UYUMLU STİLLER
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerBackground: { width: '100%', height: height * 0.40, justifyContent: 'flex-end', backgroundColor: COLORS.text },
    blurOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', paddingBottom: 40 },
    modeToggleContainer: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, padding: 4, zIndex: 10 },
    modeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, gap: 8 },
    modeBtnActive: { backgroundColor: COLORS.accent }, // Fıstık Yeşili
    modeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    modeBtnTextActive: { color: COLORS.primary }, // İç yazı koyu yeşil
    headerContent: { paddingHorizontal: 25 },
    headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
    headerSubtitle: { fontSize: 16, color: '#F0F0F0', marginTop: 5, fontWeight: '500' },
    plannerCard: { flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -30, ...SHADOWS.medium },
    inputGroup: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10, letterSpacing: 0.3 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: COLORS.border },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
    inputText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
    promoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5F2', padding: 15, borderRadius: 16, gap: 12, marginBottom: 30, borderWidth: 1, borderColor: '#D0E3D9' },
    promoText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600', lineHeight: 20 },
    createButton: { flexDirection: 'row', backgroundColor: COLORS.accent, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', gap: 10, ...SHADOWS.light },
    createButtonText: { fontSize: 16, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(28, 48, 38, 0.7)', justifyContent: 'center', alignItems: 'center' },
    datePickerCard: { width: width * 0.9, backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, alignItems: 'center', ...SHADOWS.medium },
    datePickerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    calendarBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }
});