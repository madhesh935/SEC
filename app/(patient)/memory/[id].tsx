import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Users, Calendar, Volume2, Square } from 'lucide-react-native';
import { GeriHeader } from '../../../src/components/common/GeriHeader';
import { GeriButton } from '../../../src/components/common/GeriButton';
import { GeriCard } from '../../../src/components/common/GeriCard';
import { LoadingState } from '../../../src/components/common/LoadingState';
import { ErrorState } from '../../../src/components/states/ErrorState';
import { useMemory } from '../../../src/hooks/usePatient';
import { useAudioPlayback } from '../../../src/hooks/useAudioPlayback';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: memory, isLoading, error, refetch } = useMemory(id);
  const { isPlaying, currentUrl, toggleAudio } = useAudioPlayback();

  if (isLoading) {
    return <LoadingState message="Opening memory..." />;
  }

  if (error || !memory) {
    return (
      <ErrorState
        title="Could not find memory"
        message="This memory could not be loaded right now."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  const isAudioPlaying = isPlaying && currentUrl === memory.audioUrl;

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title={memory.title}
        subtitle={memory.displayDate || 'Cherished Memory'}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
      >
        {/* Large Visual Image */}
        {memory.imageUrl && (
          <View className="rounded-3xl overflow-hidden mb-6 shadow-sm border border-navy-100">
            <Image
              source={{ uri: memory.imageUrl }}
              style={{ width: '100%', height: 260 }}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}

        {/* Title and Date */}
        <Text className="text-3xl font-extrabold text-navy tracking-tight mb-2">
          {memory.title}
        </Text>

        {memory.displayDate && (
          <View className="flex-row items-center mb-5">
            <Calendar size={18} color="#2E7D7A" />
            <Text className="text-sm font-semibold text-teal-700 ml-2">
              {memory.displayDate}
            </Text>
          </View>
        )}

        {/* Short Story */}
        {memory.description && (
          <GeriCard className="p-6 mb-6">
            <Text className="text-xl text-navy-800 leading-relaxed font-normal">
              {memory.description}
            </Text>
          </GeriCard>
        )}

        {/* Associated People */}
        {memory.associatedPeople && memory.associatedPeople.length > 0 && (
          <GeriCard variant="mint" className="p-5 mb-6 flex-row items-center">
            <Users size={24} color="#2E7D7A" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-teal-900">
                People in this memory:
              </Text>
              <Text className="text-base text-teal-800 font-medium mt-0.5">
                {memory.associatedPeople.join(', ')}
              </Text>
            </View>
          </GeriCard>
        )}

        {/* Optional Audio Narration or Family Recording */}
        {memory.audioUrl && (
          <View className="mb-6">
            <GeriButton
              title={isAudioPlaying ? 'Stop Audio Story' : 'Listen to this Story'}
              variant="secondary"
              size="large"
              onPress={() => toggleAudio(memory.audioUrl!)}
              icon={isAudioPlaying ? <Square size={22} color="#2E7D7A" /> : <Volume2 size={22} color="#2E7D7A" />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
