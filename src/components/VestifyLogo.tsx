import React from 'react';
import { Image } from 'react-native';

export default function VestifyLogo({ size = 40, color = "#1A1A1A" }) {
  return (
    <Image 
      source={require('../../assets/AppLogo.png')} 
      style={{ 
        width: size, 
        height: size, 
        transform: [{ scale: 1.6 }], // Logoyu kutunun içinde 1.8 kat büyütür!
        tintColor: color === "#FFFFFF" ? "#FFFFFF" : undefined 
      }} 
      resizeMode="contain"
    />
  );
}