import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Image as ImageIcon, Music, LifeBuoy, Puzzle, Settings } from 'lucide-react-native';
import { CompanionOrb } from '../../src/components/companion/CompanionOrb';
import { GeriButton } from '../../src/components/common/GeriButton';
import { LoadingState } from '../../src/components/common/LoadingState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { OfflineState } from '../../src/components/states/OfflineState';
import { usePatientProfile } from '../../src/hooks/usePatient';
import { useCompanionStore } from '../../src/store/companion.store';
import { useNetwork } from '../../src/hooks/useNetwork';
import { getTimeOfDayGreeting } from '../../src/utils/formatters';
import { ROUTES } from '../../src/constants/routes';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { isOffline } = useNetwork();
  const { data: patient, isLoading, error, refetch } = usePatientProfile();
  const { state: companionState, uiMode } = useCompanionStore();

  const greeting = getTimeOfDayGreeting();

  // If loading initial patient profile from backend
  if (isLoading) {
    return <LoadingState message="Welcome..." subMessage="Setting up your companion" />;
  }

  // If backend error loading patient profile
  if (error && !patient) {
    return (
      <ErrorState
        title="Unable to load profile"
        message="We couldn't connect to your care profile. Please check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  const displayName = patient?.preferredName || patient?.firstName;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-background-warm px-6 pt-8 pb-6"
    >
      {/* Top Dynamic Device-Time Greeting */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1">
          <Text className="text-xl font-medium text-navy-500">
            {greeting}
          </Text>
          {/* Only render name if returned by backend */}
          {displayName ? (
            <Text className="text-3xl font-bold text-navy tracking-tight mt-0.5">
              {displayName}
            </Text>
          ) : (
            <Text className="text-3xl font-bold text-navy tracking-tight mt-0.5">
              Welcome back
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push(ROUTES.PATIENT.SETTINGS as any)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          className="w-12 h-12 rounded-2xl bg-white border border-navy-200 items-center justify-center active:bg-navy-50"
        >
          <Settings size={22} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Center Companion Section */}
      <View className="items-center my-4">
        <CompanionOrb state={companionState} uiMode={uiMode} size={200} />

        <View className="w-full max-w-xs mt-6">
          <GeriButton
            title="Talk to me"
            size="large"
            variant={uiMode === 'comfort' ? 'comfort' : 'primary'}
            onPress={() => router.push(ROUTES.PATIENT.COMPANION as any)}
            accessibilityLabel="Talk to your companion"
            accessibilityHint="Opens voice companion screen"
          />
        </View>
      </View>

      {/* Quick Action Cards */}
      <View className="mt-8 mb-4">
        <Text className="text-lg font-bold text-navy-800 mb-4 px-1">
          Quick Actions
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {/* Family */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.FAMILY as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Family connections"
            className="w-[48%] bg-white border border-navy-100 rounded-3xl p-5 mb-4 shadow-xs active:bg-teal-50"
          >
            <View className="w-12 h-12 rounded-2xl bg-teal-50 items-center justify-center mb-3">
              <Heart size={26} color="#2E7D7A" />
            </View>
            <Text className="text-lg font-bold text-navy">Family</Text>
            <Text className="text-xs text-navy-500 mt-1">Photos & voices</Text>
          </TouchableOpacity>

          {/* Memories */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.MEMORIES as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View memories"
            className="w-[48%] bg-white border border-navy-100 rounded-3xl p-5 mb-4 shadow-xs active:bg-softblue-50"
          >
            <View className="w-12 h-12 rounded-2xl bg-softblue-50 items-center justify-center mb-3">
              <ImageIcon size={26} color="#4A90E2" />
            </View>
            <Text className="text-lg font-bold text-navy">Memories</Text>
            <Text className="text-xs text-navy-500 mt-1">Stories & places</Text>
          </TouchableOpacity>

          {/* Comfort */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.COMFORT as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Comfort audio"
            className="w-[48%] bg-white border border-navy-100 rounded-3xl p-5 mb-4 shadow-xs active:bg-lavender-50"
          >
            <View className="w-12 h-12 rounded-2xl bg-lavender-50 items-center justify-center mb-3">
              <Music size={26} color="#7C3AED" />
            </View>
            <Text className="text-lg font-bold text-navy">Comfort</Text>
            <Text className="text-xs text-navy-500 mt-1">Music & calm</Text>
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.PATIENT.HELP as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Get help"
            className="w-[48%] bg-white border border-navy-100 rounded-3xl p-5 mb-4 shadow-xs active:bg-red-50"
          >
            <View className="w-12 h-12 rounded-2xl bg-red-50 items-center justify-center mb-3">
              <LifeBuoy size={26} color="#C62828" />
            </View>
            <Text className="text-lg font-bold text-navy">Help</Text>
            <Text className="text-xs text-navy-500 mt-1">Caregiver support</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary: Activities */}
        <TouchableOpacity
          onPress={() => router.push(ROUTES.PATIENT.ACTIVITIES as any)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Recall activities"
          className="flex-row items-center justify-between bg-mint-50 border border-mint-200 rounded-2xl p-4 mt-1 active:bg-mint-100"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-xl bg-teal-100 items-center justify-center mr-3">
              <Puzzle size={22} color="#2E7D7A" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-navy">Daily Activities</Text>
              <Text className="text-xs text-navy-600">Gentle memory & routine exercises</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
