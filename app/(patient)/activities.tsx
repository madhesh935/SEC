import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Puzzle, Users, Clock, BookOpen, CheckCircle } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriCard } from '../../src/components/common/GeriCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { useRecommendedActivities } from '../../src/hooks/usePatient';
import { ActivityItem } from '../../src/types/activity';

export default function ActivitiesScreen() {
  const router = useRouter();
  const { data: activities, isLoading, error, refetch } = useRecommendedActivities();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'family_recognition':
        return <Users size={24} color="#2E7D7A" />;
      case 'life_memory_recall':
        return <BookOpen size={24} color="#0288D1" />;
      case 'daily_routine_sequencing':
      default:
        return <Clock size={24} color="#7C3AED" />;
    }
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'family_recognition':
        return 'Family Recognition';
      case 'life_memory_recall':
        return 'Life Memory Recall';
      case 'daily_routine_sequencing':
        return 'Daily Routine Sequencing';
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading activities..." subMessage="Gentle memory & routine exercises" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load activities"
        message="Could not reach recommended activities right now. Please try again."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Daily Activities"
        subtitle="Gentle cognitive and routine recall"
        onBackPress={() => router.back()}
      />

      <FlatList
        data={activities || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Puzzle size={40} color="#2E7D7A" />}
            title="Daily Activities"
            message="No activities are available right now."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${getActivityTypeLabel(item.type)}`}
            activeOpacity={0.8}
            className="mb-4"
          >
            <GeriCard className="flex-row items-center p-5">
              <View className="w-14 h-14 rounded-2xl bg-teal-50 items-center justify-center border border-teal-100 mr-4">
                {getActivityIcon(item.type)}
              </View>

              <View className="flex-1">
                <Text className="text-xl font-bold text-navy" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text className="text-sm text-navy-600 mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View className="flex-row items-center mt-2">
                  <Text className="text-xs font-semibold text-teal-700 uppercase">
                    {getActivityTypeLabel(item.type)}
                  </Text>
                  {item.estimatedMinutes && (
                    <Text className="text-xs text-navy-400 ml-3">
                      • {item.estimatedMinutes} min
                    </Text>
                  )}
                </View>
              </View>

              {item.completed && (
                <View className="ml-2">
                  <CheckCircle size={22} color="#059669" />
                </View>
              )}
            </GeriCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
