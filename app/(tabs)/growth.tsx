import { StyleSheet, View } from 'react-native';
import { BambiniText } from '@/components/design-system/BambiniText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function GrowthScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <BambiniText variant="h1" weight="bold">Development Growth</BambiniText>
            <BambiniText variant="body" style={{ marginTop: 20 }}>
                Tracking progress across Cognitive, Physical, Language, Social, and Creative domains.
            </BambiniText>
            {/* Radar Chart placeholder would go here */}
            <View style={styles.chartPlaceholder}>
                <BambiniText variant="caption">Radar Chart Visualization Coming Soon</BambiniText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartPlaceholder: {
        width: '100%',
        height: 300,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D4DFE6',
        borderStyle: 'dashed',
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
