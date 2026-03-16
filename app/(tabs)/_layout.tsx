import { Tabs } from 'expo-router';
import { Activity, BarChart2, Compass, Home, ShoppingBag, User } from 'lucide-react-native';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[(colorScheme === 'dark' ? 'dark' : 'light')];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: '#D4DFE6',
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          fontFamily: 'Nunito-Bold',
          color: theme.text,
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <Compass size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: 'Growth',
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-child"
        options={{
          href: null, // Hide from tab bar
          headerTitle: 'Add Child',
        }}
      />
    </Tabs>
  );
}
