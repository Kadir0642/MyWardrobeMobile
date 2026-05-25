import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../theme/theme'; // Gofrik Paletimiz

const { width } = Dimensions.get('window');

// Kart Genişliği (Ekrandan biraz küçük olsun ki yandaki kartın ucu görünsün)
const CARD_WIDTH = width * 0.85; 

export default function CapsuleResultScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    
    // PlannerScreen'den gelen AI JSON verisini alıyoruz
    const { capsuleData } = route.params || {};

    if (!capsuleData) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Feather name="alert-circle" size={40} color={COLORS.error} />
                <Text style={styles.errorText}>Kapsül verisi bulunamadı.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Geri Dön</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Kullanıcının Ana Bavulunu (Core Capsule) Render Et
    // İleride gerçek resim URL'leri gelecek, şimdilik UI test için yer tutucu ikonlar
    const renderCoreItem = ({ item }: { item: string }) => (
        <View style={styles.coreItemBubble}>
            <Feather name="shopping-bag" size={24} color={COLORS.primary} />
            <Text style={styles.coreItemText}>ID: {item}</Text>
        </View>
    );

    // Günlük Kombin Kartlarını (Carousel) Render Et
    const renderOutfitCard = ({ item, index }: { item: any, index: number }) => (
        <View style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
                <Text style={styles.dayLabel}>Gün {index + 1}</Text>
                <Text style={styles.outfitName}>{item.outfitName}</Text>
            </View>

            {/* Dolaptan Seçilen Eşyalar (Senin Eşyaların) */}
            <View style={styles.userItemsSection}>
                <Text style={styles.sectionTitle}>Bavulundan:</Text>
                <View style={styles.userItemsGrid}>
                    {item.userItems.map((id: string, idx: number) => (
                        <View key={idx} style={styles.userItemBox}>
                            <Feather name="check" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.userItemText}>Ürün {id}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.divider} />

            {/* Partner Ürün ve Stilist Notu (Upsell) */}
            <View style={styles.partnerSection}>
                <View style={styles.partnerBadge}>
                    <Feather name="star" size={12} color="#FFF" />
                    <Text style={styles.partnerBadgeText}>Vestify Önerisi</Text>
                </View>
                
                <Text style={styles.partnerItemTitle}>Eksik Parça: {item.partnerUpsellItem}</Text>
                <Text style={styles.stylistPitch}>"{item.stylistPitch}"</Text>
                
                <TouchableOpacity style={styles.buyButton}>
                    <Text style={styles.buyButtonText}>Ürünü İncele</Text>
                    <Feather name="external-link" size={16} color={COLORS.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleSaveCapsule = () => {
        // İleride burası Spring Boot Backend'e "Kaydet" (POST) isteği atacak
        alert("Harika! Bu kapsül Vestify Dolabına kaydedildi. İstediğin zaman düzenleyebilirsin.");
        // Kaydettikten sonra Wardrobe sekmesine yönlendirme yapılabilir
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Lüks Başlık */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Feather name="award" size={28} color={COLORS.accent} />
                </View>
                
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{capsuleData.capsuleTitle}</Text>
                    <Text style={styles.subtitle}>Vestify AI tarafından tarzınıza ve seyahatinize özel hazırlandı.</Text>
                </View>

                {/* 1. Kısım: ANA BAVUL (Core Capsule) */}
                {capsuleData.coreCapsuleItemIds && (
                    <View style={styles.coreSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionMainTitle}>Hazırlanan Bavul</Text>
                            <Text style={styles.itemCountText}>{capsuleData.coreCapsuleItemIds.length} Parça</Text>
                        </View>
                        <Text style={styles.coreDesc}>Bu seyahat için dolabından seçtiğimiz anahtar parçalar. (Düzenlemek için kapsülü kaydetmelisin)</Text>
                        
                        <FlatList
                            data={capsuleData.coreCapsuleItemIds}
                            renderItem={renderCoreItem}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                        />
                    </View>
                )}

                {/* 2. Kısım: GÜNLÜK KOMBİNLER (Carousel) */}
                <View style={styles.carouselSection}>
                    <Text style={[styles.sectionMainTitle, { marginLeft: 20, marginBottom: 15 }]}>Günlük Kombin Planı</Text>
                    
                    <FlatList
                        data={capsuleData.outfits}
                        renderItem={renderOutfitCard}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal // Yatay kaydırma!
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + 20} // Yumuşak kart geçişleri (Snapping)
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
                    />
                </View>

                {/* Alt Kısım: Kaydetme Aksiyonu */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveCapsule}>
                        <Feather name="bookmark" size={20} color="#FFF" />
                        <Text style={styles.saveButtonText}>Kapsülü Dolabıma Kaydet</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// 🎨 GOFRİK RENK PALETİ UYGULAMASI
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
    iconButton: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12, ...SHADOWS.light },
    
    titleSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 30 },
    mainTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, lineHeight: 34, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20 },

    // Ana Bavul Stilleri
    coreSection: { marginBottom: 35 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 5 },
    sectionMainTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    itemCountText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
    coreDesc: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 20, marginBottom: 15, lineHeight: 18 },
    coreItemBubble: { width: 80, height: 80, backgroundColor: COLORS.surface, borderRadius: 40, justifyContent: 'center', alignItems: 'center', ...SHADOWS.light, borderWidth: 1, borderColor: COLORS.border },
    coreItemText: { fontSize: 10, fontWeight: '600', color: COLORS.text, marginTop: 5 },

    // Carousel (Kombin Kartı) Stilleri
    carouselSection: { marginBottom: 20 },
    outfitCard: { width: CARD_WIDTH, backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, ...SHADOWS.medium },
    outfitHeader: { marginBottom: 20 },
    dayLabel: { fontSize: 12, fontWeight: '800', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    outfitName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
    
    userItemsSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase' },
    userItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    userItemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
    userItemText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },

    // Partner Upsell Stilleri
    partnerSection: { backgroundColor: '#F0F5F2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#D0E3D9' },
    partnerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, gap: 4, marginBottom: 12 },
    partnerBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF', textTransform: 'uppercase' },
    partnerItemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    stylistPitch: { fontSize: 14, fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
    
    buyButton: { flexDirection: 'row', backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
    buyButtonText: { fontSize: 14, fontWeight: '800', color: COLORS.text },

    footer: { paddingHorizontal: 20, marginTop: 20 },
    saveButton: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', gap: 10, ...SHADOWS.medium },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    errorText: { fontSize: 16, color: COLORS.text, marginTop: 10, fontWeight: '600' },
    backBtn: { marginTop: 20, padding: 12, backgroundColor: COLORS.surface, borderRadius: 8 },
    backBtnText: { color: COLORS.primary, fontWeight: '700' }
});