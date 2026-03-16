import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type ShopCategory = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  display_order: number;
};

export type ShopItem = {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_selectable: boolean;
};

export type Order = {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  contact_phone: string;
  contact_email?: string;
  items: any;
  paystack_reference?: string;
  created_at: string;
};

export function useShopCategories() {
  return useQuery({
    queryKey: ['shop_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as ShopCategory[];
    },
  });
}

export function useShopItems(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['shop_items', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');
      if (error) throw error;
      return data as ShopItem[];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'created_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          user_id: user.id,
          status: order.status || 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, status, paystackRef }: { orderId: string, status: Order['status'], paystackRef?: string }) => {
            const { data, error } = await supabase
                .from('orders')
                .update({ status, paystack_reference: paystackRef })
                .eq('id', orderId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
    });
}
