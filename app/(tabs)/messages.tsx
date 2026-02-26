import { View, StyleSheet } from 'react-native';
import { BambiniText } from '@/components/design-system/BambiniText';

export default function MessagesScreen() {
    return (
        <View style={styles.container}>
            <BambiniText variant="h1" weight="bold">Messages</BambiniText>
            <BambiniText variant="body" style={{ marginTop: 20 }}>Connect with your child's teachers.</BambiniText>
        </View>
    );
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' } });
