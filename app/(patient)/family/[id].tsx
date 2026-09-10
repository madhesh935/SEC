import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Phone, Mic, User, Volume2, Square } from 'lucide-react-native';
import { GeriHeader } from '../../../src/components/common/GeriHeader';
import { GeriButton } from '../../../src/components/common/GeriButton';
import { GeriCard } from '../../../src/components/common/GeriCard';
import { LoadingState } from '../../../src/components/common/LoadingState';
import { ErrorState } from '../../../src/components/states/ErrorState';
import { useFamilyMember } from '../../../src/hooks/usePatient';
import { useAudioPlayback } from '../../../src/hooks/useAudioPlayback';

export default function FamilyMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: member, isLoading, error, refetch } = useFamilyMember(id);
  const { isPlaying, currentUrl, toggleAudio } = useAudioPlayback();

  if (isLoading) {
    return <LoadingState message="Loading details..." />;
  }

  if (error || !member) {
    return (
      <ErrorState
        title="Could not find family member"
        message="This profile could not be loaded right now."
        onRetry={() => refetch()}
        onGoBack={() => router.back()}
      />
    );
  }

  const handleCall = () => {
    if (member.phoneNumber) {
      Linking.openURL(`tel:${member.phoneNumber}`);
    }
  };

  const isVoicePlaying = isPlaying && currentUrl === member.voiceMessageUrl;

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title={member.name}
        subtitle={member.relationship || 'Family Member'}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
      >
        {/* Large Accessible Photo */}
        <View className="items-center mb-6">
          {member.photoUrl ? (
            <Image
              source={{ uri: member.photoUrl }}
              style={{ width: 180, height: 180, borderRadius: 36 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="w-44 h-44 rounded-3xl bg-teal-100 items-center justify-center border border-teal-200">
              <User size={72} color="#2E7D7A" />
            </View>
          )}

          <Text className="text-3xl font-extrabold text-navy tracking-tight mt-4 text-center">
            {member.name}
          </Text>

          {member.relationship && (
            <Text className="text-xl font-semibold text-teal-700 mt-1 text-center">
              {member.relationship}
            </Text>
          )}
        </View>

        {/* Patient-Safe Description */}
        {member.description && (
          <GeriCard className="p-6 mb-6">
            <Text className="text-lg text-navy-700 leading-relaxed">
              {member.description}
            </Text>
          </GeriCard>
        )}

        {/* Voice Recording Note if available */}
        {member.voiceMessageAvailable && member.voiceMessageUrl && (
          <GeriCard variant="lavender" className="p-6 mb-6">
            <View className="flex-row items-center mb-3">
              <Mic size={24} color="#7C3AED" />
              <Text className="text-lg font-bold text-navy ml-2">
                Voice Note from {member.name}
              </Text>
            </View>
            <Text className="text-sm text-navy-600 mb-4">
              Tap below to listen to a recorded message from your family.
            </Text>
            <GeriButton
              title={isVoicePlaying ? 'Stop Voice Message' : 'Play Voice Message'}
              variant="secondary"
              onPress={() => toggleAudio(member.voiceMessageUrl!)}
              icon={isVoicePlaying ? <Square size={20} color="#2E7D7A" /> : <Volume2 size={20} color="#2E7D7A" />}
            />
          </GeriCard>
        )}

        {/* Call Action if phone available */}
        {member.phoneAvailable && member.phoneNumber && (
          <View className="mb-6">
            <GeriButton
              title={`Call ${member.name}`}
              variant="primary"
              size="large"
              onPress={handleCall}
              icon={<Phone size={24} color="#FFFFFF" />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
