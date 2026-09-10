import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Music, Mic, Image as ImageIcon, Sparkles, Volume2, Square } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriCard } from '../../src/components/common/GeriCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { useComfortContent } from '../../src/hooks/usePatient';
import { useAudioPlayback } from '../../src/hooks/useAudioPlayback';
import { ComfortContent } from '../../src/types/comfort';

export default function ComfortScreen() {
  const router = useRouter();
  const { data: comfortItems, isLoading, error, refetch } = useComfortContent();
  const { isPlaying, currentUrl, toggleAudio } = useAudioPlayback();

  const getItemIcon = (type: ComfortContent['type']) => {
    switch (type) {
      case 'voice':
        return <Mic size={24} color="#7C3AED" />;
      case 'photo':
        return <ImageIcon size={24} color="#0288D1" />;
      case 'memory':
        return <Sparkles size={24} color="#D97706" />;
      case 'music':
      case 'audio':
      default:
        return <Music size={24} color="#2E7D7A" />;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading comfort items..." subMessage="Familiar sounds and music" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load comfort content"
        message="Could not reach your comfort playlist right now. Please try again."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Comfort"
        subtitle="Music, voices and soothing sounds"
        onBackPress={() => router.back()}
      />

      <FlatList
        data={comfortItems || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Music size={40} color="#2E7D7A" />}
            title="Comfort & Music"
            message="Your caregiver can add familiar music, voices and memories for you."
          />
        }
        renderItem={({ item }) => {
          const isItemPlaying = isPlaying && currentUrl === item.mediaUrl;

          return (
            <TouchableOpacity
              onPress={() => {
                if (item.mediaUrl) {
                  toggleAudio(item.mediaUrl);
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.type}`}
              activeOpacity={0.8}
              className="mb-4"
            >
              <GeriCard variant="comfort" className="flex-row items-center p-5">
                {/* Visual Thumbnail */}
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 68, height: 68, borderRadius: 20 }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="w-16 h-16 rounded-2xl bg-amber-100 items-center justify-center border border-amber-200">
                    {getItemIcon(item.type)}
                  </View>
                )}

                {/* Content text */}
                <View className="flex-1 ml-4 mr-2">
                  <Text className="text-xl font-bold text-navy" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text className="text-sm text-navy-600 mt-1" numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <Text className="text-xs font-semibold text-amber-800 uppercase mt-1">
                    {item.type}
                  </Text>
                </View>

                {/* Play / Pause Action Button */}
                {item.mediaUrl && (
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center border ${
                      isItemPlaying
                        ? 'bg-amber-600 border-amber-700'
                        : 'bg-white border-amber-300'
                    }`}
                  >
                    {isItemPlaying ? (
                      <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Volume2 size={22} color="#D97706" />
                    )}
                  </View>
                )}
              </GeriCard>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
