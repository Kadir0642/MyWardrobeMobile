import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import WardrobeScreen from './src/screens/WardrobeScreen';
import StylistScreen from './src/screens/StylistScreen';
import SocialScreen from './src/screens/SocialScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

// npx expo start -c  -> İle çalıştırıyoruz.

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Vitrin') iconName = focused ? 'albums' : 'albums-outline';
            else if (route.name === 'Kombin') iconName = focused ? 'color-wand' : 'color-wand-outline';
            else if (route.name === 'Sosyal') iconName = focused ? 'people' : 'people-outline';
            else if (route.name === 'Analiz') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2C3E50',
          tabBarInactiveTintColor: '#BDC3C7',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
            height: 60, paddingBottom: 10,
          },
          headerShown: false,
        })}
      > 
        <Tab.Screen name="Vitrin" component={WardrobeScreen} /> 
        <Tab.Screen name="Kombin" component={StylistScreen} />
        <Tab.Screen name="Sosyal" component={SocialScreen} />
        <Tab.Screen name="Analiz" component={AnalyticsScreen} />
      </Tab.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}