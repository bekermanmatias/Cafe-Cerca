import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import DiaryIcon from '../../assets/icons/diary.svg';
import ExploreIcon from '../../assets/icons/explore.svg';
import FriendsIcon from '../../assets/icons/friends.svg';
import MapIcon from '../../assets/icons/map.svg';

//Agrego librerias para poder presionar y manajer la navegación.
import { useRouter } from 'expo-router';

function HeaderRight() {
  const router = useRouter();
  return (
    <TouchableOpacity 
      style={{ marginRight: 16 }}
      onPress={() => router.push('/(tabs)/profile' as any)}
    >
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
          title: 'Café Cerca',
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
