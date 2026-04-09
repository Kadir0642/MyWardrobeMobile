import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bileşen ve Ekran İçe Aktarımları
import VestifyNoWrite from '../components/VestifyNoWrite';
import WardrobeScreen from '../screens/WardrobeScreen';
import StylistScreen from '../screens/StylistScreen';
import SocialScreen from '../screens/SocialScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ProfileScreen from '../screens/ProfileScreen';

// 🚀 ARTIK BOTTOM DEĞİL, TOP TAB KULLANIYORUZ (Ama aşağıya sabitleyeceğiz!)
const Tab = createMaterialTopTabNavigator();

const getTodayDate = () => new Date().getDate().toString();

// 🚀 ÖZEL ALT MENÜ TASARIMIMIZ (Material Top Tab'ı Bottom Tab gibi gösteren sihir)
function CustomTabBar({ state, descriptors, navigation, insets }: any) {
  const todayDate = getTodayDate();

  return (
    <View style={[styles.tabBar, { height: 90 + insets.bottom, paddingBottom: 25 + insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? '#1A1A1A' : '#B0B0B0';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // 🦋 ORTADAKİ DEVASA BUTON (STYLE)
        if (route.name === 'Style') {
          return (
            <TouchableOpacity key={index} style={styles.fabContainer} onPress={onPress} activeOpacity={0.9}>
              <View style={styles.fabButton}>
                <VestifyNoWrite size={42} color="#1A1A1A" />
              </View>
              <Text style={styles.fabLabel}>Style</Text>
            </TouchableOpacity>
          );
        }

        // DİĞER STANDART İKONLAR
        const renderIcon = () => {
          if (route.name === 'Network') return <Feather name="globe" size={24} color={color} />;
          if (route.name === 'Wardrobe') return <MaterialCommunityIcons name="hanger" size={28} color={color} />;
          if (route.name === 'Profile') return <Feather name="user" size={24} color={color} />;
          if (route.name === 'Planner') return (
            <View style={[styles.calendarIconBox, isFocused && styles.calendarIconBoxFocused]}>
              <View style={[styles.calendarTopBar, isFocused && { backgroundColor: '#1A1A1A' }]} />
              <Text style={[styles.dateText, { color }]}>{todayDate}</Text>
            </View>
          );
        };

        return (
          <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem}>
            {renderIcon()}
            <Text style={[styles.tabBarLabel, { color }]}>{options.tabBarLabel}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Wardrobe"
      tabBarPosition="bottom" // 🚀 MİMARİ HİLE: Üst menüyü ekranın en altına çiviler!
      tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
      screenOptions={{ 
        swipeEnabled: true, // 🚀 VE İŞTE İSTEDİĞİN O AKICI KAYDIRMA ÖZELLİĞİ!
        animationEnabled: true,
      }}
    >
      <Tab.Screen name="Network" component={SocialScreen} options={{ tabBarLabel: 'Ağ' }} />
      <Tab.Screen name="Planner" component={PlannerScreen} options={{ tabBarLabel: 'Planner' }} />
      <Tab.Screen name="Style" component={StylistScreen} options={{ tabBarLabel: 'Style' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ tabBarLabel: 'Wardrobe' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F0F0F0'
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    marginTop: 5 
  },
  
  // Takvim (Planner) İkonu Tasarımı
  calendarIconBox: {
    width: 26, height: 26, borderRadius: 6, 
    borderWidth: 2, borderColor: '#B0B0B0',
    justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden',
    paddingBottom: 2
  },
  calendarIconBoxFocused: {
    borderColor: '#1A1A1A', 
  },
  calendarTopBar: {
    position: 'absolute', top: 0, width: '100%', height: 6,
    backgroundColor: '#B0B0B0'
  },
  dateText: { fontSize: 11, fontWeight: '900' },

  // Devasa Kelebek Butonu Tasarımı
  fabContainer: {
    top: -25, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: 70, // Etrafındaki butonların dokunma alanını ezmemesi için sabit genişlik
  },
  fabButton: {
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', alignItems: 'center', 
    shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  fabLabel: {
    fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginTop: 5
  }
});