import React from 'react';
import { Image } from 'react-native';

export default function VestifyNoWrite({ size = 40, color = "#1A1A1A" }) {
  return (
    <Image 
      source={require('../../assets/AppLogoNowrite.png')} 
      style={{ 
        width: size, 
        height: size, 
        transform: [{ scale: 1.8 }], // 🚀 SİHİRLİ DOKUNUŞ: Logoyu kutunun içinde 1.8 kat büyütür!
        tintColor: color === "#FFFFFF" ? "#FFFFFF" : undefined 
      }} 
      resizeMode="contain"
    />
  );
}