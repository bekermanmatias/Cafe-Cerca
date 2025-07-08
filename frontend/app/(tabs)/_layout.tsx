import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import DiaryIcon from '../../assets/icons/diary.svg';
import ExploreIcon from '../../assets/icons/explore.svg';
import FriendsIcon from '../../assets/icons/friends.svg';
import MapIcon from '../../assets/icons/map.svg';

//Agrego librerias para poder presionar y manajer la navegación.
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function TabLayout() {

  //Obtenemos las funcionalidades de hook.
  const router=useRouter();

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
          marginTop: 5, // Ajustamos la posición vertical de los iconos
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#8B4513',
        
        // Soy lucio, aca agrego el icono de perfil.
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/profile')}
            style={{marginRight: 15}}
          >
            <Ionicons name="person-circle-outline" size={28} color="#8B4513"/>
          </Pressable>
        )

      }}
      >
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
