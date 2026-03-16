import React, { useRef } from 'react';
import { Animated, PanResponder, Image, StyleSheet } from 'react-native';
import { ClothingItem } from '../types';

interface DraggableItemProps {
  item: ClothingItem;
  initialX: number;
  initialY: number;
  zIndex?: number;
}

export default function DraggableItem({ item, initialX, initialY, zIndex = 1 }: DraggableItemProps) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        pan.getLayout(),
        styles.draggableItem,
        { zIndex: zIndex }
      ]}
      {...panResponder.panHandlers}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.draggableImage} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  draggableItem: { position: 'absolute', padding: 10 },
  draggableImage: { width: 140, height: 140 },
});