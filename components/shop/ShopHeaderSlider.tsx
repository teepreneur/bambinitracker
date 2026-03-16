import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolate,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { BambiniText } from '../design-system/BambiniText';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width;
const AUTO_PLAY_INTERVAL = 5000;

interface Slide {
  id: string;
  image: string;
  placeholder: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    image: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/slider_newborn_0_6m.png',
    placeholder: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800',
    title: 'Newborn Bliss',
    subtitle: 'Nurture their first milestones with gentle sensory play.'
  },
  {
    id: '2',
    image: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/slider_discoverer_6_12m.png',
    placeholder: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800',
    title: 'Curious Discoverers',
    subtitle: 'Foster curiosity with natural textures and shapes.'
  },
  {
    id: '3',
    image: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/slider_toddler_1_3y.png',
    placeholder: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800',
    title: 'Toddler Exploration',
    subtitle: 'Building confidence through active play.'
  },
  {
    id: '4',
    image: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/shop_slider_preschooler_3_6y_1773620309268.png',
    placeholder: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800',
    title: 'Creative Learners',
    subtitle: 'Spark imagination and problem-solving skills.'
  },
  {
    id: '5',
    image: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/slider_family_kit.png',
    placeholder: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800',
    title: 'The Bambini Family',
    subtitle: 'Developmental tools delivered to your doorstep.'
  }
];

export const ShopHeaderSlider = () => {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % SLIDES.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />
      
      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const width = interpolate(
              scrollX.value / SLIDE_WIDTH,
              [index - 1, index, index + 1],
              [8, 20, 8],
              'clamp'
            );
            const opacity = interpolate(
              scrollX.value / SLIDE_WIDTH,
              [index - 1, index, index + 1],
              [0.4, 1, 0.4],
              'clamp'
            );
            return {
              width,
              opacity,
            };
          });

          return (
            <Animated.View 
              key={index} 
              style={[styles.dot, animatedDotStyle]} 
            />
          );
        })}
      </View>
    </View>
  );
};

const SlideItem = ({ item, index, scrollX }: { item: any, index: number, scrollX: Animated.SharedValue<number> }) => {
  const [imgSource, setImgSource] = React.useState({ uri: item.image });

  const animatedTextStyle = useAnimatedStyle(() => {
    // ... same as before
    const opacity = interpolate(
      scrollX.value / SLIDE_WIDTH,
      [index - 0.5, index, index + 0.5],
      [0, 1, 0],
      'clamp'
    );
    const translateY = interpolate(
      scrollX.value / SLIDE_WIDTH,
      [index - 0.5, index, index + 0.5],
      [20, 0, 20],
      'clamp'
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.slide}>
      <Image 
        source={imgSource} 
        style={styles.image} 
        resizeMode="cover" 
        onError={() => setImgSource({ uri: item.placeholder })}
      />
      <View style={styles.overlay} />
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <BambiniText variant="h1" style={styles.title}>{item.title}</BambiniText>
        <BambiniText variant="body" style={styles.subtitle}>{item.subtitle}</BambiniText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 420,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  slide: {
    width: SLIDE_WIDTH,
    height: 420,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)', // Subtle darkening for readability
  },
  textContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
});
