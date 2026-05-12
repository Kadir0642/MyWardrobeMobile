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
import ShopScreen from '../screens/ShopScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createMaterialTopTabNavigator();

// 🚀 ÖZEL ALT MENÜ TASARIMIMIZ
function CustomTabBar({ state, descriptors, navigation, insets }: any) {
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

        // DİĞER STANDART İKONLAR (Planner Silindi, Shop Eklendi)
        const renderIcon = () => {
          if (route.name === 'Network') return <Feather name="globe" size={24} color={color} />;
          
          // 🚀 YENİ SHOP (BEYOND) İKONU
          if (route.name === 'Shop') return <Feather name="shopping-bag" size={24} color={color} />;
          
          if (route.name === 'Wardrobe') return <MaterialCommunityIcons name="hanger" size={28} color={color} />;
          if (route.name === 'Profile') return <Feather name="user" size={24} color={color} />;
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
      tabBarPosition="bottom" 
      tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
      screenOptions={{ 
        swipeEnabled: true, 
        animationEnabled: true,
      }}
    >
      {/* 🚀 EKRAN SIRALAMASI VE ETİKETLER [ Ekranların Takma Adları ] */}
      <Tab.Screen name="Network" component={SocialScreen} options={{ tabBarLabel: 'Network' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarLabel: 'Shop' }} />
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
  
  fabContainer: {
    top: -25, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: 70, 
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