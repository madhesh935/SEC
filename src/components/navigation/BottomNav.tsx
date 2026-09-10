import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Sparkles, Heart, Image as ImageIcon, Music, LifeBuoy } from 'lucide-react-native';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  route: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      route: ROUTES.PATIENT.HOME,
      label: 'Home',
      icon: (active) => <Home size={22} color={active ? '#2E7D7A' : '#64748B'} />,
    },
    {
      route: ROUTES.PATIENT.COMPANION,
      label: 'Companion',
      icon: (active) => <Sparkles size={22} color={active ? '#2E7D7A' : '#64748B'} />,
    },
    {
      route: ROUTES.PATIENT.FAMILY,
      label: 'Family',
      icon: (active) => <Heart size={22} color={active ? '#2E7D7A' : '#64748B'} />,
    },
    {
      route: ROUTES.PATIENT.MEMORIES,
      label: 'Memories',
      icon: (active) => <ImageIcon size={22} color={active ? '#2E7D7A' : '#64748B'} />,
    },
    {
      route: ROUTES.PATIENT.COMFORT,
      label: 'Comfort',
      icon: (active) => <Music size={22} color={active ? '#2E7D7A' : '#64748B'} />,
    },
    {
      route: ROUTES.PATIENT.HELP,
      label: 'Help',
      icon: (active) => <LifeBuoy size={22} color={active ? '#C62828' : '#64748B'} />,
    },
  ];

  return (
    <View
      accessible={true}
      accessibilityRole="tablist"
      className="flex-row items-stretch bg-white border-t border-navy-200 px-1 py-2 min-h-[64px]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.route);
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.replace(item.route as any)}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${item.label} tab`}
            className={`flex-1 items-center justify-center py-1 px-0.5 rounded-xl min-h-[50px] ${
              isActive ? 'bg-teal-50' : 'bg-transparent'
            }`}
          >
            {item.icon(isActive)}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              className={`text-2xs font-semibold mt-1 ${
                isActive ? 'text-teal-700' : 'text-navy-500'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
