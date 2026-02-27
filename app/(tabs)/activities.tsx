import { StyleSheet, View, ScrollView } from 'react-native';
import { BambiniText } from '@/components/design-system/BambiniText';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { PlayCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ActivitiesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <BambiniText variant="h1" weight="bold" style={styles.title}>Activity Library</BambiniText>
            <BambiniText variant="body" color={theme.textSecondary} style={styles.subtitle}>
                Discover age-appropriate developmental activities.
            </BambiniText>

            <View style={styles.list}>
                {/* Placeholder Activity */}
                <BambiniCard padding="small" style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                            <PlayCircle color={theme.primary} size={28} />
                        </View>
                        <View style={styles.activityInfo}>
                            <BambiniText variant="h3" weight="semibold">Color Sorting Game</BambiniText>
                            <BambiniText variant="caption" color={theme.textSecondary}>Cognitive • 10m</BambiniText>
                        </View>
                    </View>
                </BambiniCard>

                {/* Additional Placeholder */}
                <BambiniCard padding="small" style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.secondary + '20' }]}>
                            <PlayCircle color={theme.secondary} size={28} />
                        </View>
                        <View style={styles.activityInfo}>
                            <BambiniText variant="h3" weight="semibold">Tummy Time Reach</BambiniText>
                            <BambiniText variant="caption" color={theme.textSecondary}>Physical • 5m</BambiniText>
                        </View>
                    </View>
                </BambiniCard>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        marginTop: 10,
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 24,
    },
    list: {
        gap: 16,
    },
    activityCard: {
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
    }
});
