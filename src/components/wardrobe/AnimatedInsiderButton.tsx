import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPress: () => void;
}

export default function AnimatedInsiderButton({ onPress }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    animation.start();
    return () => animation.stop(); 
  }, []);
  
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.insiderWrapper} onPress={onPress}>
      <Animated.View style={[styles.rotatingGradient, { transform: [{ rotate: spin }] }]}>
        <LinearGradient colors={['#FF007F', '#7F00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF007F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <View style={styles.insiderInner}>
        <Text style={styles.insiderText}>Insider</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  insiderWrapper: { width: 100, height: 36, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#DDD' },
  rotatingGradient: { position: 'absolute', width: 150, height: 150 },
  insiderInner: { width: 94, height: 30, backgroundColor: '#F5F2EB', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  insiderText: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#1A1A1A' },
});