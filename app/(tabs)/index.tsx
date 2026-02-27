import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { Bell, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [loading, setLoading] = React.useState(true);
  const [children, setChildren] = React.useState<any[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<any>(null);
  const [userName, setUserName] = React.useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      fetchChildren();
    }, [])
  );

  async function fetchChildren() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      setUserName(userData.user.user_metadata?.full_name || 'Parent');

      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          parent_children!inner(parent_id)
        `)
        .eq('parent_children.parent_id', userData.user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        router.replace('/(tabs)/add-child');
      } else {
        setChildren(data);
        setSelectedChild(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching children:', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <BambiniText variant="body" color={theme.textSecondary}>Good morning,</BambiniText>
          <BambiniText variant="h2" weight="bold">{userName ? userName.split(' ')[0] : 'Parent'} 👋</BambiniText>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={theme.text} size={22} />
        </TouchableOpacity>
      </View>

      {/* Child Switcher (Simple for now) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childAvatar,
              selectedChild?.id === child.id && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedChild(child)}
          >
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
              <BambiniText color={theme.primary} weight="bold">{child.name[0]}</BambiniText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stage Banner */}
      {selectedChild && (
        <BambiniCard style={styles.stageCard} variant="elevated">
          <View style={styles.stageContent}>
            <View style={{ flex: 1 }}>
              <BambiniText variant="h3" color="#FFFFFF" weight="bold">
                {selectedChild.name} — Toddler Stage
              </BambiniText>
              <BambiniText variant="caption" color="rgba(255,255,255,0.8)">
                Born {new Date(selectedChild.dob).toLocaleDateString()}
              </BambiniText>
            </View>
            <View style={styles.progressCircle}>
              <BambiniText variant="caption" color="#FFFFFF" weight="bold">60%</BambiniText>
            </View>
          </View>
        </BambiniCard>
      )}

      {/* Today's Activities */}
      <View style={styles.sectionHeader}>
        <BambiniText variant="h3" weight="bold">Today's Activities</BambiniText>
      </View>

      <BambiniCard style={styles.activityCard} padding="small">
        <View style={styles.activityRow}>
          <View style={[styles.badgeContainer, { backgroundColor: theme.accent }]}>
            <BambiniText variant="caption" color="#FFFFFF" weight="bold">Cognitive</BambiniText>
          </View>
          <View style={styles.activityInfo}>
            <BambiniText variant="h3" weight="semibold">Color Sorting Game</BambiniText>
            <BambiniText variant="caption" color={theme.textSecondary}>⏱️ 10 min</BambiniText>
          </View>
          <ChevronRight color={theme.tabIconDefault} size={20} />
        </View>
      </BambiniCard>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DFE6',
  },
  stageCard: {
    backgroundColor: '#2CC5BD',
    marginBottom: 32,
  },
  stageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  childScroll: {
    marginBottom: 24,
  },
  childAvatar: {
    marginRight: 12,
    borderRadius: 30,
    padding: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
});
