import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';
import ExploreIcon from '../../assets/icons/explore.svg';
import MapIcon from '../../assets/icons/map.svg';
import DiaryIcon from '../../assets/icons/diary.svg';
import FriendsIcon from '../../assets/icons/friends.svg';

function HeaderRight() {
  return (
    <TouchableOpacity style={{ marginRight: 16 }}>
      <Ionicons name="person-circle-outline" size={40} color="#8B4513" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: '#A0522D',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 65,
          paddingBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          height: 100,
        },
        headerTintColor: '#8B4513',
        headerTitle: 'Café Cerca',
        headerTitleStyle: {
          fontSize: 26,
          fontWeight: '600',
        },
        headerRight: HeaderRight,
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <ExploreIcon width={28} height={28} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <MapIcon width={28} height={28} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ color }) => <DiaryIcon width={28} height={28} stroke={color} fill="none" />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <FriendsIcon width={35} height={35} fill={color} />,
        }}
      />
    </Tabs>
  );
}
