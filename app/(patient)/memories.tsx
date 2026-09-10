import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Image as ImageIcon, Users, Volume2 } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriCard } from '../../src/components/common/GeriCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { useMemories } from '../../src/hooks/usePatient';
import { ROUTES } from '../../src/constants/routes';

export default function MemoriesScreen() {
  const router = useRouter();
  const { data: memories, isLoading, error, refetch } = useMemories();

  if (isLoading) {
    return <LoadingState message="Loading your memories..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Memories couldn't be loaded"
        message="Unable to reach your memory album right now. Please try again."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Memories"
        subtitle="Stories, places and cherished moments"
        onBackPress={() => router.back()}
      />

      <FlatList
        data={memories || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<ImageIcon size={40} color="#2E7D7A" />}
            title="Cherished Memories"
            message="Your memories will appear here once they are added by your family or caregiver."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.MEMORY_DETAIL(item.id) as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, memory card`}
            activeOpacity={0.8}
            className="mb-5"
          >
            <GeriCard className="overflow-hidden p-0">
              {/* Large Image Header if available */}
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                  transition={250}
                />
              )}

              <View className="p-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-bold text-navy flex-1 mr-2" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.audioUrl && (
                    <View className="w-9 h-9 rounded-full bg-teal-100 items-center justify-center">
                      <Volume2 size={18} color="#2E7D7A" />
                    </View>
                  )}
                </View>

                {item.displayDate && (
                  <Text className="text-xs font-semibold text-teal-700 mt-1 uppercase tracking-wide">
                    {item.displayDate}
                  </Text>
                )}

                {item.description && (
                  <Text className="text-base text-navy-600 mt-2 leading-relaxed" numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                {item.associatedPeople && item.associatedPeople.length > 0 && (
                  <View className="flex-row items-center mt-3 pt-3 border-t border-navy-100">
                    <Users size={16} color="#64748B" />
                    <Text className="text-xs font-medium text-navy-500 ml-2" numberOfLines={1}>
                      With: {item.associatedPeople.join(', ')}
                    </Text>
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
