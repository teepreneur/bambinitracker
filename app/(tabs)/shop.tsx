import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useShopCategories } from '@/hooks/useShop';
import { useRouter } from 'expo-router';
import { ChevronRight, ShoppingBag, Sparkles, Star } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ShopHeaderSlider } from '@/components/shop/ShopHeaderSlider';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { data: categories, isLoading } = useShopCategories();

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const items = categories || [];

  return (
    <View style={[styles.container, { backgroundColor: '#f9f5ea' }]}>
      <ScrollView 
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
      >
        <ShopHeaderSlider />

        <View style={styles.content}>
          <View style={styles.categoriesContainer}>
            {items.length > 0 ? (
              items.map((category, index) => (
                <Animated.View 
                  key={category.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <TouchableOpacity 
                      onPress={() => router.push({
                          pathname: '/shop/[id]',
                          params: { id: category.id, name: category.name }
                      })}
                      activeOpacity={0.9}
                  >
                  <BambiniCard style={[styles.categoryCard, { backgroundColor: '#FFFFFF' }]}>
                    {category.name.includes('0-6') && (
                      <View style={styles.trendingBadge}>
                        <Star size={10} color="#FFF" fill="#FFF" />
                        <BambiniText variant="caption" style={styles.trendingText}>TRENDING</BambiniText>
                      </View>
                    )}
                    <View style={styles.cardContent}>
                      <View style={styles.textContainer}>
                        <BambiniText variant="h3" style={styles.categoryName}>
                         {category.name}
                        </BambiniText>
                        <BambiniText variant="caption" style={styles.categoryDesc} numberOfLines={2}>
                          {category.description}
                        </BambiniText>
                        
                        <View style={styles.exploreBtn}>
                          <BambiniText variant="button" style={styles.exploreText}>EXPLORE</BambiniText>
                          <ChevronRight size={16} color="#000" />
                        </View>
                      </View>
                      
                      <Image 
                          source={{ uri: category.image_url || 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4' }} 
                          style={styles.categoryImage}
                          resizeMode="cover"
                          defaultSource={{ uri: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4' }} // Fallback
                      />
                    </View>
                  </BambiniCard>
                </TouchableOpacity>
              </Animated.View>
              ))
            ) : (
              <BambiniCard style={[styles.emptyCard, { backgroundColor: '#FFFFFF' }]}>
                  <BambiniText variant="body" style={{ textAlign: 'center', color: '#666' }}>
                      Shop kits will appear here once your database is seeded.
                  </BambiniText>
              </BambiniCard>
            )}
          </View>

          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
                <BambiniText variant="h2">Featured for You</BambiniText>
                <Sparkles size={20} color={theme.tint} />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingRight: 40, paddingLeft: 20 }}>
                <TouchableOpacity style={styles.miniCard}>
                    <Image 
                      source={{ uri: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/best_sellers_icon.png' }} 
                      style={styles.miniIconImage} 
                      resizeMode="contain"
                    />
                    <BambiniText variant="button">Best Sellers</BambiniText>
                </TouchableOpacity>
   
                <TouchableOpacity style={styles.miniCard}>
                    <Image 
                      source={{ uri: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/new_arrivals_icon.png' }} 
                      style={styles.miniIconImage} 
                      resizeMode="contain"
                    />
                    <BambiniText variant="button">New Arrivals</BambiniText>
                </TouchableOpacity>
   
                <TouchableOpacity style={styles.miniCard}>
                    <Image 
                     source={{ uri: 'https://xoqrvcykpygfishrkgnt.supabase.co/storage/v1/object/public/shop/wooden_toys_icon.png' }} 
                     style={styles.miniIconImage} 
                     resizeMode="contain"
                    />
                    <BambiniText variant="button">Wooden Toys</BambiniText>
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    backgroundColor: '#f9f5ea',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    paddingTop: 10,
    minHeight: 600,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  categoryCard: {
    height: 160,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 0,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  textContainer: {
    flex: 1.3,
    padding: 24,
    justifyContent: 'center',
  },
  categoryName: {
    color: '#000',
    marginBottom: 4,
  },
  categoryDesc: {
    color: '#666',
    marginBottom: 16,
  },
  categoryImage: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#F3F4F6', // Show something while loading
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f5ea',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreText: {
    fontSize: 12,
  },
  featuredSection: {
    marginTop: 40,
    paddingLeft: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  miniCard: {
    alignItems: 'center',
    marginRight: 28,
    gap: 10,
  },
  miniIconImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    gap: 4,
  },
  trendingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
