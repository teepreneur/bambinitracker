import { View, StyleSheet } from 'react-native';
import { BambiniText } from '@/components/design-system/BambiniText';

export default function ExploreScreen() {
    return (
        <View style={styles.container}>
            <BambiniText variant="h1" weight="bold">Explore Activities</BambiniText>
            <BambiniText variant="body" style={{ marginTop: 20 }}>Browse all age-appropriate activities by domain.</BambiniText>
        </View>
    );
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' } });
