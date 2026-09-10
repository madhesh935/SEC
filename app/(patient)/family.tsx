import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Heart, Phone, Mic, User } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriCard } from '../../src/components/common/GeriCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { useFamilyMembers } from '../../src/hooks/usePatient';
import { FamilyMember } from '../../src/types/family';
import { ROUTES } from '../../src/constants/routes';

export default function FamilyScreen() {
  const router = useRouter();
  const { data: family, isLoading, error, refetch } = useFamilyMembers();

  const handleCall = (member: FamilyMember) => {
    if (member.phoneNumber) {
      Linking.openURL(`tel:${member.phoneNumber}`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading family connections..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load family"
        message="Could not reach your family list right now. Please try again."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Family"
        subtitle="People who love you"
        onBackPress={() => router.back()}
      />

      <FlatList
        data={family || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Heart size={40} color="#2E7D7A" />}
            title="Your Family"
            message="Your family connections will appear here once they are added."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.FAMILY_DETAIL(item.id) as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.relationship || 'Family member'}`}
            activeOpacity={0.8}
            className="mb-4"
          >
            <GeriCard className="flex-row items-center p-5">
              {/* Photo or Avatar */}
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  style={{ width: 80, height: 80, borderRadius: 24 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className="w-20 h-20 rounded-3xl bg-teal-100 items-center justify-center border border-teal-200">
                  <User size={38} color="#2E7D7A" />
                </View>
              )}

              {/* Information */}
              <View className="flex-1 ml-5">
                <Text className="text-2xl font-bold text-navy tracking-tight" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.relationship && (
                  <Text className="text-base text-teal-700 font-semibold mt-0.5" numberOfLines={1}>
                    {item.relationship}
                  </Text>
                )}
                {item.description && (
                  <Text className="text-sm text-navy-500 mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>

              {/* Action Icons */}
              <View className="flex-row space-x-2 ml-2">
                {item.phoneAvailable && item.phoneNumber && (
                  <TouchableOpacity
                    onPress={() => handleCall(item)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${item.name}`}
                    className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center border border-emerald-200 mr-2 active:bg-emerald-200"
                  >
                    <Phone size={22} color="#059669" />
                  </TouchableOpacity>
                )}

                {item.voiceMessageAvailable && (
                  <View className="w-12 h-12 rounded-2xl bg-lavender-100 items-center justify-center border border-lavender-200">
                    <Mic size={22} color="#7C3AED" />
                  </View>
                )}
              </View>
            </GeriCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
