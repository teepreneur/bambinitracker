import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniSkeleton } from '@/components/design-system/BambiniSkeleton';
import { BambiniText } from '@/components/design-system/BambiniText';
import { ChildAvatar } from '@/components/design-system/ChildAvatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useChildActivities, useChildren, useNewbornTips, useProfile, useUserObservations } from '@/hooks/useData';
import { isNewborn as checkIsNewborn, getAgeBreakdown, getChildAgeLabel, getStageLabel } from '@/utils/childAge';
import { getActivityEmoji, getDomainColor, getDynamicGreeting } from '@/utils/ui';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, Palette, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  // --- State ---
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showCompletedList, setShowCompletedList] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // --- Hooks ---
  const { data: profile } = useProfile();
  const { data: allChildren, isLoading: loadingChildren } = useChildren();
  const { data: userObservations } = useUserObservations();

  // Derived Values
  const children = allChildren || [];
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0] || null;

  console.log('--- Home Screen Render ---');
  console.log('Children count:', children.length);
  console.log('Selected Child ID:', selectedChildId);
  console.log('Selected Child Name:', selectedChild?.name);

  const userName = profile?.name || profile?.authUser?.user_metadata?.full_name || 'Parent';

  // --- Effects ---
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children]);

  // Reset completion toggle when child changes
  useEffect(() => {
    setShowCompletedList(false);
  }, [selectedChildId]);

  // Listen for date changes (when app comes to foreground or midnight passes)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const today = new Date().toISOString().split('T')[0];
        if (today !== currentDate) {
          console.log(`[HomeScreen] Date changed from ${currentDate} to ${today}. Rolling over.`);
          setCurrentDate(today);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Also check periodically in case they keep the app open actively through midnight
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (today !== currentDate) {
        console.log(`[HomeScreen] Midnight passed while app active! Rolling over.`);
        setCurrentDate(today);
      }
    }, 60000); // check every minute

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [currentDate]);

  const { days: ageDays, months: ageMonths } = useMemo(
    () => getAgeBreakdown(selectedChild?.dob),
    [selectedChild]
  );

  const { data: todayActivities = [], isLoading: loadingActivities } = useChildActivities(
    selectedChild?.id,
    ageDays,
    currentDate
  );

  const allActivitiesDone = useMemo(() => {
    return todayActivities.length > 0 && todayActivities.every((a: any) => a.isCompleted);
  }, [todayActivities]);

  // --- Progress Calculation ---
  const completedCount = todayActivities.filter((a: any) => a.isCompleted).length;
  const totalCount = todayActivities.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // --- Newborn Logic ---
  const isNewborn = checkIsNewborn(selectedChild?.dob);

  // --- Tips from DB (with fallback) ---
  const { data: tips = [] } = useNewbornTips(ageDays);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f9f5ea' }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <BambiniText variant="body" color={theme.textSecondary}>
              {isNewborn ? "Congratulations," : getDynamicGreeting()}
            </BambiniText>
            <BambiniText variant="h1" weight="bold">{userName.split(' ')[0]} 👋</BambiniText>
          </View>
        </View>

        {/* If no children exist, show a clean, welcoming Empty State */}
        {children.length === 0 && !loadingChildren ? (
          <View style={styles.emptyStateContainer}>
            {/* Playful Floating Background Elements */}
            <View style={[styles.floatingShape, { top: -20, left: -20, backgroundColor: '#FFD166' }]} />
            <View style={[styles.floatingShape, { bottom: 40, right: -10, backgroundColor: '#EF476F', width: 40, height: 40, borderRadius: 20 }]} />

            <View style={styles.emptyStateIconContainer}>
              <Plus color="#FFFFFF" size={48} />
            </View>
            <BambiniText variant="h1" weight="bold" style={styles.emptyStateTitle}>Welcome to Bambini!</BambiniText>
            <BambiniText variant="body" color={theme.textSecondary} style={styles.emptyStateBody}>
              Let's start this beautiful journey. Add your child to instantly unlock personalized daily activities, milestone tracking, and expert developmental guidance!
            </BambiniText>

            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: '#2CC5BD' }]}
              onPress={() => router.push('/(tabs)/add-child')}
            >
              <BambiniText variant="h2" color="#FFFFFF" weight="bold">Add Your Child</BambiniText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Children Selector */}
            {loadingChildren ? (
              <View style={styles.childScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childScroll}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.childItemContainer}>
                      <BambiniSkeleton width={68} height={68} borderRadius={34} style={{ marginBottom: 8 }} />
                      <BambiniSkeleton width={50} height={12} borderRadius={6} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.childScrollContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.childScroll}
                >
                  {children.map((child) => (
                    <View key={child.id} style={styles.childItemContainer}>
                      <TouchableOpacity
                        style={[
                          styles.childAvatarBorder,
                          { borderColor: selectedChildId === child.id ? '#26B8B8' : 'transparent', borderWidth: 3 }
                        ]}
                        onPress={() => setSelectedChildId(child.id)}
                      >
                        <ChildAvatar photoUrl={child.photo_url} size={64} />
                      </TouchableOpacity>
                      <BambiniText
                        variant="caption"
                        weight={selectedChildId === child.id ? "bold" : "medium"}
                        color={selectedChildId === child.id ? theme.text : theme.textSecondary}
                        style={styles.childNameText}
                      >
                        {child.name}
                      </BambiniText>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.childItemContainer}
                    onPress={() => router.push('/(tabs)/add-child')}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '15' }]}>
                      <Plus color={theme.primary} size={28} />
                    </View>
                    <BambiniText variant="caption" color={theme.textSecondary} style={styles.childNameText}>Add Child</BambiniText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Stage Card */}
            {selectedChild && (
              <BambiniCard style={[styles.stageCard, { backgroundColor: isNewborn ? '#EC4899' : '#26B8B8', borderRadius: 24, padding: 24 }]} variant="elevated">
                <View style={styles.stageContent}>
                  <View style={{ flex: 1 }}>
                    <BambiniText variant="body" color="rgba(255,255,255,0.9)" weight="medium" style={{ marginBottom: 4 }}>
                      {selectedChild.name} —
                    </BambiniText>
                    <BambiniText variant="h1" color="#FFFFFF" weight="bold" style={{ fontSize: 28, marginBottom: 2 }}>
                      {getStageLabel(selectedChild?.dob)}
                    </BambiniText>
                    <BambiniText variant="caption" color="rgba(255,255,255,0.8)">
                      ({getChildAgeLabel(selectedChild?.dob)})
                    </BambiniText>
                  </View>

                  {/* Circular Progress */}
                  {(() => {
                    const size = 70;
                    const strokeWidth = 5;
                    const radius = (size - strokeWidth) / 2;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (circumference * completionPercent) / 100;
                    return (
                      <View style={{ marginLeft: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                          />
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#F5A623"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </Svg>
                        <View style={{ position: 'absolute', alignItems: 'center' }}>
                          <BambiniText variant="caption" color="#FFFFFF" weight="bold" style={{ fontSize: 15 }}>
                            {completionPercent}%
                          </BambiniText>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Progress summary text */}
                <BambiniText variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 12 }}>
                  {completedCount}/{totalCount} activities done today
                </BambiniText>
              </BambiniCard>
            )}

            {/* Newborn Tips Section */}
            {isNewborn && (
              <View style={styles.tipsSection}>
                <View style={styles.sectionHeader}>
                  <BambiniText variant="h2" weight="bold">Expert Tips for You ✨</BambiniText>
                  <BambiniText variant="body" color={theme.textSecondary}>Postpartum support & care</BambiniText>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tipsScroll}
                >
                  {tips.map((tip: any) => (
                    <BambiniCard
                      key={tip.id}
                      style={[
                        styles.tipCard,
                        {
                          backgroundColor: '#FFFFFF',
                          borderColor: tip.color + '40',
                          borderWidth: 1.5,
                          shadowColor: tip.color,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 4,
                        }
                      ]}
                      variant="elevated"
                    >
                      <View style={[styles.tipIconContainer, { backgroundColor: tip.bg_color || tip.bgColor || '#F4EBf7' }]}>
                        <BambiniText style={{ fontSize: 24 }}>{tip.icon}</BambiniText>
                      </View>
                      <BambiniText variant="h2" weight="bold" color={tip.color} style={{ marginTop: 16 }}>{tip.title}</BambiniText>
                      <BambiniText variant="body" color="#4A4A4A" style={{ marginTop: 6, lineHeight: 22 }}>
                        {tip.content}
                      </BambiniText>
                    </BambiniCard>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Today's Section */}
            <View style={styles.sectionHeader}>
              <BambiniText variant="h2" weight="bold">Today's Activities</BambiniText>
              <BambiniText variant="body" color={theme.textSecondary}>Handpicked for {selectedChild?.name}</BambiniText>
            </View>

            {loadingActivities ? (
              <View style={{ paddingHorizontal: 0 }}>
                <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
                <BambiniSkeleton width="100%" height={100} borderRadius={20} style={{ marginBottom: 12 }} />
              </View>
            ) : (
              <View>
                {todayActivities.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Palette color={theme.tabIconDefault} size={64} style={{ opacity: 0.3 }} />
                    <BambiniText variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginTop: 16 }}>
                      No activities generated yet.
                    </BambiniText>
                  </View>
                ) : allActivitiesDone && !showCompletedList ? (
                  <View style={[styles.allDoneCard, { borderColor: '#8DC63F' }]}>
                    <View style={styles.allDoneIconContainer}>
                      <Text style={{ fontSize: 54, includeFontPadding: false }}>🎉</Text>
                    </View>
                    <BambiniText variant="h2" weight="bold" color="#2E7D32" style={{ textAlign: 'center', marginTop: 16 }}>
                      All caught up for today!
                    </BambiniText>
                    <BambiniText variant="body" color="#4CAF50" style={{ textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 12, lineHeight: 22 }}>
                      You've completed all activities for {selectedChild?.name}. Thank you for intentionally nurturing their growth today!
                    </BambiniText>
                    <TouchableOpacity
                      style={styles.viewCompletedButton}
                      onPress={() => setShowCompletedList(true)}
                      activeOpacity={0.8}
                    >
                      <BambiniText variant="body" weight="bold" color="#FFFFFF">Review Activities</BambiniText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {allActivitiesDone && showCompletedList && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                        <BambiniText variant="body" weight="bold" color="#4CAF50">✨ All activities completed!</BambiniText>
                        <TouchableOpacity onPress={() => setShowCompletedList(false)}>
                          <BambiniText variant="caption" weight="bold" color={theme.textSecondary}>Hide</BambiniText>
                        </TouchableOpacity>
                      </View>
                    )}
                    {todayActivities.map((activity: any, index: number) => {
                      const dColor = getDomainColor(activity.domain);
                      const bgColor = dColor + '12';
                      const isComplete = activity.isCompleted;

                      return (
                        <TouchableOpacity
                          key={activity.id}
                          activeOpacity={0.85}
                          style={[
                            styles.activityCard,
                            {
                              backgroundColor: isComplete ? '#F0F0F0' : bgColor,
                              borderColor: isComplete ? '#E0E0E0' : dColor + '30',
                              borderLeftWidth: 4,
                              borderLeftColor: isComplete ? '#8DC63F' : dColor,
                            }
                          ]}
                          onPress={() => router.push({
                            pathname: '/activity/[id]',
                            params: { id: activity.id, childId: selectedChild?.id }
                          })}
                        >
                          {/* Top Row: Emoji + Title + Duration */}
                          <View style={styles.activityRow}>
                            {/* Large Emoji Bubble */}
                            <View style={[
                              styles.emojiCircle,
                              { backgroundColor: isComplete ? '#E8F5E9' : dColor + '20' }
                            ]}>
                              {isComplete ? (
                                <CheckCircle2 color="#4CAF50" size={22} />
                              ) : (
                                <Text style={{ fontSize: 24, includeFontPadding: false }}>
                                  {getActivityEmoji(activity.title)}
                                </Text>
                              )}
                            </View>

                            {/* Title + Description */}
                            <View style={styles.activityInfo}>
                              <BambiniText
                                variant="body"
                                weight="bold"
                                color={isComplete ? '#9E9E9E' : '#1A1A1A'}
                                style={[
                                  { fontSize: 16, lineHeight: 22 },
                                  isComplete && { textDecorationLine: 'line-through' }
                                ]}
                                numberOfLines={2}
                              >
                                {activity.title}
                              </BambiniText>

                              {/* Domain + Time Pills */}
                              <View style={styles.cardPillRow}>
                                <View style={[styles.domainPill, { backgroundColor: isComplete ? '#E0E0E0' : dColor + '18' }]}>
                                  <View style={[styles.tinyDot, { backgroundColor: isComplete ? '#9E9E9E' : dColor }]} />
                                  <BambiniText
                                    variant="caption"
                                    weight="bold"
                                    color={isComplete ? '#9E9E9E' : dColor}
                                    style={{ fontSize: 11 }}
                                  >
                                    {activity.domain}
                                  </BambiniText>
                                </View>
                                <View style={[styles.timePill, { backgroundColor: isComplete ? '#E0E0E0' : '#FFF8E1' }]}>
                                  <BambiniText style={{ fontSize: 10 }}>⏱</BambiniText>
                                  <BambiniText
                                    variant="caption"
                                    weight="medium"
                                    color={isComplete ? '#9E9E9E' : '#F5A623'}
                                    style={{ fontSize: 11, marginLeft: 3 }}
                                  >
                                    {activity.estimated_duration_minutes || 10} min
                                  </BambiniText>
                                </View>
                              </View>
                            </View>

                            {/* Right Arrow / Completed State */}
                            {!isComplete && (
                              <View style={[styles.goButton, { backgroundColor: dColor }]}>
                                <ChevronRight color="#FFFFFF" size={20} />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

    </GestureHandlerRootView>
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
    marginTop: 60,
    marginBottom: 24,
  },
  streakIndicator: {
    alignItems: 'flex-end',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#26B8B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#26B8B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyStateTitle: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateBody: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  emptyStateButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#2CC5BD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  floatingShape: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
  },
  stageCard: {
    backgroundColor: '#2CC5BD',
    marginBottom: 32,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  tipsSection: {
    marginTop: 10,
    marginBottom: 8,
  },
  tipsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
  tipCard: {
    width: 280,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childScrollContainer: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  childScroll: {
    paddingHorizontal: 20,
  },
  childItemContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  childAvatarBorder: {
    borderRadius: 40,
    padding: 3,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childNameText: {
    textAlign: 'center',
    fontSize: 14,
  },
  activityCard: {
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tinyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  allDoneCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#8DC63F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  allDoneIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  viewCompletedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBubbleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    display: 'flex',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  }
});

