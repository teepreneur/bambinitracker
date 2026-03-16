import { supabase } from '@/lib/supabase';
import { BambiniButton } from '@/components/design-system/BambiniButton';
import { BambiniCard } from '@/components/design-system/BambiniCard';
import { BambiniInput } from '@/components/design-system/BambiniInput';
import { BambiniText } from '@/components/design-system/BambiniText';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useShopItems, useCreateOrder } from '@/hooks/useShop';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, CreditCard, MapPin, ShoppingCart, Sparkles, Package } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaystackProvider, usePaystack } from 'react-native-paystack-webview';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default function CategoryDetailScreen() {
    const { id, name } = useLocalSearchParams<{ id: string, name: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: items, isLoading } = useShopItems(id);
    const createOrder = useCreateOrder();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showCheckout, setShowCheckout] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [userEmail, setUserEmail] = useState('user@example.com');

    // Pre-select all items once they load
    React.useEffect(() => {
        if (items) {
            setSelectedIds(new Set(items.map(i => i.id)));
        }

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) setUserEmail(user.email);
        };
        fetchUser();
    }, [items]);

    const toggleItem = (itemId: string) => {
        const next = new Set(selectedIds);
        if (next.has(itemId)) {
            next.delete(itemId);
        } else {
            next.add(itemId);
        }
        setSelectedIds(next);
    };

    const totalPrice = useMemo(() => {
        if (!items) return 0;
        return items
            .filter(i => selectedIds.has(i.id))
            .reduce((sum, item) => sum + Number(item.price), 0);
    }, [items, selectedIds]);

    const handleCheckout = () => {
        if (!address || !phone) {
            alert('Please provide your shipping details');
            return;
        }
        setShowCheckout(true);
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <PaystackProvider 
            publicKey="pk_test_placeholder" // USER should replace with real key
            onGlobalSuccess={(res) => {
                console.log('Global Success', res);
            }}
            onGlobalCancel={() => {
                console.log('Global Cancel');
            }}
        >
            <View style={[styles.container, { backgroundColor: '#f9f5ea' }]}>
                {/* Curved Header */}
                <View style={[styles.headerContainer, { backgroundColor: '#f9f5ea' }]}>
                    <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.backBtn}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <View style={styles.backBtnInner}>
                                <ChevronLeft size={24} color="#1A1A1A" />
                            </View>
                        </TouchableOpacity>
                        <BambiniText variant="h3" style={styles.headerTitle}>
                            {name || 'Material Kit'}
                        </BambiniText>
                        <View style={{ width: 40 }} /> 
                    </View>
                    <View style={styles.headerCurve} />
                </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <BambiniCard style={styles.specialistCard}>
                            <View style={styles.specialistRow}>
                                <View style={styles.specialistIcon}>
                                    <Sparkles size={20} color="#8B735B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <BambiniText variant="h3" style={{ fontSize: 14, color: '#1A1A1A' }}>Specialist Curation</BambiniText>
                                    <BambiniText variant="caption" style={{ color: '#8B735B', lineHeight: 18 }}>
                                        These items are hand-selected to help your child master key developmental milestones for the {name}.
                                    </BambiniText>
                                </View>
                            </View>
                        </BambiniCard>
                    </Animated.View>

                    {items?.map((item, index) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <Animated.View 
                                key={item.id} 
                                entering={FadeInDown.delay(200 + (index * 100)).springify()}
                            >
                                <TouchableOpacity 
                                    onPress={() => toggleItem(item.id)}
                                    activeOpacity={0.7}
                                    style={{ marginBottom: 16 }}
                                >
                                    <BambiniCard style={[styles.itemCard, !isSelected && styles.itemCardDeselected, isSelected && { borderColor: theme.tint, borderWidth: 1 }]}>
                                        <View style={styles.itemRow}>
                                            <View style={[styles.checkbox, isSelected && { backgroundColor: theme.tint, borderColor: theme.tint }]}>
                                                {isSelected && <Check size={14} color="#FFF" />}
                                            </View>
                                            
                                            <View style={styles.imageContainer}>
                                                <ImageItem url={item.image_url} />
                                                {!isSelected && <View style={styles.imageOverlay} />}
                                            </View>
                                            
                                            <View style={styles.itemInfo}>
                                                <BambiniText variant="h3" style={[styles.itemName, !isSelected && { color: '#999' }]}>
                                                    {item.name}
                                                </BambiniText>
                                                <BambiniText variant="caption" numberOfLines={2} style={{ color: isSelected ? '#666' : '#999', fontSize: 12 }}>
                                                    {item.description}
                                                </BambiniText>
                                            </View>

                                            <BambiniText variant="h3" style={[styles.itemPrice, !isSelected && { color: '#CCC' }]}>
                                                ₵{item.price}
                                            </BambiniText>
                                        </View>
                                    </BambiniCard>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Price & Action Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 10, borderTopColor: theme.tabIconDefault + '20' }]}>
                <View style={styles.priceRow}>
                    <View>
                        <BambiniText variant="caption" style={{ color: theme.tabIconDefault }}>Total Amount</BambiniText>
                        <BambiniText variant="h1">₵{totalPrice.toFixed(2)}</BambiniText>
                    </View>
                    <BambiniButton 
                        title="Checkout" 
                        onPress={() => setShowCheckout(true)}
                        disabled={selectedIds.size === 0}
                        style={{ paddingHorizontal: 30 }}
                    />
                </View>
            </View>

            {/* Address & Payment Modal */}
            <Modal visible={showCheckout} animationType="slide" transparent={false}>
                <View style={[styles.modalContainer, { backgroundColor: '#f9f5ea', paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            onPress={() => setShowCheckout(false)} 
                            style={styles.backBtn}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <View style={styles.backBtnInner}>
                                <ChevronLeft size={24} color="#1A1A1A" />
                            </View>
                        </TouchableOpacity>
                        <BambiniText variant="h2" style={styles.headerTitle}>Checkout</BambiniText>
                    </View>

                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            <Animated.View entering={FadeInUp.delay(100).springify()}>
                                <View style={styles.section}>
                                    <View style={styles.sectionTitleRow}>
                                        <MapPin size={20} color={theme.tint} />
                                        <BambiniText variant="h3">Shipping Address</BambiniText>
                                    </View>
                                    <BambiniInput 
                                        placeholder="Town, House Number, Landmark" 
                                        value={address} 
                                        onChangeText={setAddress}
                                        multiline
                                        style={{ height: 100, paddingTop: 12 }}
                                    />
                                    <BambiniInput 
                                        placeholder="Phone number (for delivery)" 
                                        value={phone} 
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(200).springify()}>
                                <View style={styles.section}>
                                    <View style={styles.sectionTitleRow}>
                                        <ShoppingCart size={20} color={theme.tint} />
                                        <BambiniText variant="h3">Order Summary</BambiniText>
                                    </View>
                                    <BambiniCard style={styles.summaryCard}>
                                        <View style={styles.summaryRow}>
                                            <View>
                                                <BambiniText variant="h3" style={{ fontSize: 16 }}>{selectedIds.size} Items</BambiniText>
                                                <BambiniText variant="caption">Developmental Kit Selection</BambiniText>
                                            </View>
                                            <BambiniText variant="h2" style={{ color: theme.tint }}>₵{totalPrice.toFixed(2)}</BambiniText>
                                        </View>
                                    </BambiniCard>
                                </View>
                            </Animated.View>

                            <View style={{ marginTop: 24, paddingBottom: 40 }}>
                                <PaystackCheckoutButton 
                                    amount={totalPrice}
                                    email={userEmail}
                                    phone={phone}
                                    address={address}
                                    items={items}
                                    selectedIds={selectedIds}
                                    onCreateOrder={(params) => createOrder.mutate(params, {
                                        onSuccess: () => {
                                            alert('Order placed successfully! Check your email for confirmation.');
                                            setShowCheckout(false);
                                            router.replace('/(tabs)/shop');
                                        }
                                    })}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            </View>
        </PaystackProvider>
    );
}

function ImageItem({ url }: { url: string | null }) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    if (!url || error) {
        return (
            <View style={styles.fallbackIcon}>
                <Package size={24} color="#D4DFE6" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Image 
                source={{ uri: url }} 
                style={styles.itemImage} 
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => setError(true)}
            />
            {loading && (
                <View style={[styles.fallbackIcon, { backgroundColor: '#F5F7F8' }]}>
                    <ActivityIndicator size="small" color="#2CC5BD" />
                </View>
            )}
        </View>
    );
}

function PaystackCheckoutButton({ 
    amount, 
    email, 
    phone, 
    address, 
    items, 
    selectedIds,
    onCreateOrder 
}: { 
    amount: number, 
    email: string, 
    phone: string, 
    address: string,
    items: any[] | undefined,
    selectedIds: Set<string>,
    onCreateOrder: (params: any) => void
}) {
    const paystack = usePaystack();

    const handlePay = () => {
        paystack.popup.checkout({
            email,
            amount: amount * 100, // Paystack expects amount in kobo/cents
            onSuccess: (res: any) => {
                console.log('Payment Success', res);
                onCreateOrder({
                    total_amount: amount,
                    shipping_address: address,
                    contact_phone: phone,
                    items: items?.filter(i => (i && selectedIds.has(i.id))).map(i => ({ id: i.id, name: i.name, price: i.price })),
                    paystack_reference: res.reference
                });
            },
            onCancel: () => {
                console.log('Payment Cancelled');
            }
        });
    };

    return (
        <BambiniButton 
            title="Pay with Paystack" 
            onPress={handlePay}
            disabled={!address || !phone}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        marginBottom: 10,
    },
    backBtn: {
        marginRight: 12,
    },
    backBtnInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        color: '#1A1A1A',
        textAlign: 'center',
        fontWeight: '600',
    },
    headerContainer: {
        position: 'relative',
        paddingBottom: 20,
        zIndex: 10,
    },
    headerCurve: {
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#f9f5ea',
        borderBottomLeftRadius: 100,
        borderBottomRightRadius: 100,
        transform: [{ scaleX: 1.5 }],
    },
    specialistCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E6E6E6',
        padding: 16,
        marginBottom: 24,
        borderRadius: 20,
    },
    specialistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    specialistIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    introText: {
        marginBottom: 24,
        lineHeight: 22,
    },
    itemCard: {
        marginBottom: 12,
        padding: 12,
    },
    itemCardDeselected: {
        opacity: 0.5,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
    },
    imageContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
    },
    fallbackIcon: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(249,245,234,0.4)',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f9f5ea',
        borderTopWidth: 1,
        padding: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
        gap: 16,
    },
    modalContent: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    summaryCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E6E6E6',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});
