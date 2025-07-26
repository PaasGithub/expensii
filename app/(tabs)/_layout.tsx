import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { IconSymbol } from '../components/ui/IconSymbol';
import HapticTab  from '../components/HapticTab';



export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Table',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="table.badge.more" color={color} />,
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: 'Audio',
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="mic.badge.plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.badge.ellipsis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
    </Tabs>
  );
}
