import React, { useState } from 'react';
import { View, Text, ScrollView, Linking, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LifeBuoy, Phone, Bell, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriButton } from '../../src/components/common/GeriButton';
import { GeriCard } from '../../src/components/common/GeriCard';
import { LoadingState } from '../../src/components/common/LoadingState';
import { useHelpContacts, useRequestHelp } from '../../src/hooks/usePatient';

export default function HelpScreen() {
  const router = useRouter();
  const { data: contacts, isLoading, error } = useHelpContacts();
  const requestHelpMutation = useRequestHelp();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequestHelpConfirm = async () => {
    setRequestError(null);
    try {
      const res = await requestHelpMutation.mutateAsync('Patient pressed Request Help button');
      setConfirmModalVisible(false);
      // ONLY show after receiving successful backend confirmation
      setSuccessMessage(res.message || 'Your caregiver has been notified.');
    } catch {
      setConfirmModalVisible(false);
      setRequestError('Unable to notify caregiver right now. Please try calling directly.');
    }
  };

  const handleCallCaregiver = () => {
    if (contacts?.caregiverPhone) {
      Linking.openURL(`tel:${contacts.caregiverPhone}`);
    }
  };

  const handleCallFamily = () => {
    if (contacts?.familyContactPhone) {
      Linking.openURL(`tel:${contacts.familyContactPhone}`);
    }
  };

  const handleEmergencyCall = () => {
    const phone = contacts?.emergencyPhone || '911';
    Linking.openURL(`tel:${phone}`);
  };

  if (isLoading) {
    return <LoadingState message="Connecting to help..." />;
  }

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Help & Support"
        subtitle="We are here to help you anytime"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="justify-between"
        className="p-6"
      >
        <View>
          {/* Notification Alert Banners */}
          {successMessage && (
            <View className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl mb-6 flex-row items-center">
              <CheckCircle2 size={28} color="#059669" />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-emerald-900">
                  {successMessage}
                </Text>
                <Text className="text-sm text-emerald-700 mt-0.5">
                  A care assistant will check in with you shortly.
                </Text>
              </View>
            </View>
          )}

          {requestError && (
            <View className="p-5 bg-amber-50 border border-amber-300 rounded-2xl mb-6 flex-row items-center">
              <AlertCircle size={28} color="#D97706" />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-amber-900">
                  {requestError}
                </Text>
              </View>
            </View>
          )}

          {/* Large Action 1: Request Caregiver Help (Triggers API) */}
          <GeriCard className="p-6 mb-5 border-2 border-teal-600 bg-teal-50">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-2xl bg-teal-600 items-center justify-center mr-3">
                <Bell size={26} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-extrabold text-navy">
                  Request Help
                </Text>
                <Text className="text-sm text-teal-800 font-medium">
                  Send a notification to your caregiver
                </Text>
              </View>
            </View>

            <View className="mt-2">
              <GeriButton
                title="Notify Caregiver"
                variant="primary"
                size="large"
                onPress={() => setConfirmModalVisible(true)}
                loading={requestHelpMutation.isPending}
              />
            </View>
          </GeriCard>

          {/* Large Action 2: Call Caregiver */}
          {contacts?.caregiverPhone && (
            <GeriCard className="p-5 mb-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-12 h-12 rounded-2xl bg-teal-100 items-center justify-center mr-3">
                    <Phone size={24} color="#2E7D7A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-navy">
                      Call {contacts.caregiverName || 'Caregiver'}
                    </Text>
                    <Text className="text-sm text-navy-500">
                      Direct voice telephone call
                    </Text>
                  </View>
                </View>

                <GeriButton
                  title="Call"
                  size="medium"
                  variant="secondary"
                  onPress={handleCallCaregiver}
                  style={{ minWidth: 90 }}
                />
              </View>
            </GeriCard>
          )}

          {/* Large Action 3: Call Family Contact */}
          {contacts?.familyContactPhone && (
            <GeriCard className="p-5 mb-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-12 h-12 rounded-2xl bg-softblue-100 items-center justify-center mr-3">
                    <Phone size={24} color="#0288D1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-navy">
                      Call {contacts.familyContactName || 'Family'}
                    </Text>
                    <Text className="text-sm text-navy-500">
                      Primary family emergency contact
                    </Text>
                  </View>
                </View>

                <GeriButton
                  title="Call"
                  size="medium"
                  variant="secondary"
                  onPress={handleCallFamily}
                  style={{ minWidth: 90 }}
                />
              </View>
            </GeriCard>
          )}

          {/* Action 4: Emergency Assistance */}
          <GeriCard variant="comfort" className="p-5 mb-5 bg-red-50 border-red-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-12 h-12 rounded-2xl bg-red-600 items-center justify-center mr-3">
                  <ShieldAlert size={26} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-red-950">
                    Emergency Help
                  </Text>
                  <Text className="text-sm text-red-800">
                    Dial emergency care services
                  </Text>
                </View>
              </View>

              <GeriButton
                title="Dial"
                size="medium"
                variant="danger"
                onPress={handleEmergencyCall}
                style={{ minWidth: 90 }}
              />
            </View>
          </GeriCard>
        </View>
      </ScrollView>

      {/* Confirmation Modal for Requesting Help */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full max-w-sm bg-white rounded-3xl p-6 border border-navy-200 shadow-xl">
            <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mx-auto mb-4">
              <LifeBuoy size={36} color="#2E7D7A" />
            </View>

            <Text className="text-2xl font-bold text-navy text-center mb-2">
              Notify Caregiver?
            </Text>
            <Text className="text-base text-navy-600 text-center mb-6 leading-relaxed">
              We will immediately alert your designated caregiver that you need assistance.
            </Text>

            <View className="space-y-3">
              <GeriButton
                title="Yes, Notify Now"
                variant="primary"
                size="large"
                onPress={handleRequestHelpConfirm}
                loading={requestHelpMutation.isPending}
              />
              <View className="mt-3">
                <GeriButton
                  title="Cancel"
                  variant="outline"
                  size="large"
                  onPress={() => setConfirmModalVisible(false)}
                  disabled={requestHelpMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
