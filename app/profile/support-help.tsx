import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';

type SupportTile = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  meta: string;
};

type TicketPriority = 'Normal' | 'Urgent';
const SUPPORT_TILES: SupportTile[] = [
  {
    title: 'Ride issue',
    subtitle: 'Report route, pickup, driver, or trip experience concerns.',
    icon: 'car-outline',
    meta: 'Trips',
  },
  {
    title: 'Pickup or drop-off',
    subtitle: 'Wrong pickup pin, missed pickup, or drop-off location problems.',
    icon: 'location-outline',
    meta: 'Location',
  },
  {
    title: 'Driver behavior',
    subtitle: 'Report rude behavior, unsafe driving, or driver communication issues.',
    icon: 'person-outline',
    meta: 'Driver',
  },
  {
    title: 'Fare or refund',
    subtitle: 'Dispute fare changes, cancellation fees, refunds, or overcharges.',
    icon: 'cash-outline',
    meta: 'Fare',
  },
  {
    title: 'Payment help',
    subtitle: 'Resolve failed payments, refunds, card, and wallet questions.',
    icon: 'card-outline',
    meta: 'Billing',
  },
  {
    title: 'Promo code issue',
    subtitle: 'Get help with discounts, promotions, and membership offers.',
    icon: 'ticket-outline',
    meta: 'Promos',
  },
  {
    title: 'Safety center',
    subtitle: 'Get help for urgent safety concerns and trusted ride guidance.',
    icon: 'shield-checkmark-outline',
    meta: 'Priority',
  },
  {
    title: 'Lost item',
    subtitle: 'Report an item left in a vehicle after a completed trip.',
    icon: 'briefcase-outline',
    meta: 'Items',
  },
  {
    title: 'Account support',
    subtitle: 'Fix login, profile, saved address, and membership problems.',
    icon: 'person-circle-outline',
    meta: 'Account',
  },
  {
    title: 'App or booking issue',
    subtitle: 'Report app crashes, booking errors, map issues, or notifications.',
    icon: 'phone-portrait-outline',
    meta: 'App',
  },
  {
    title: 'Saved addresses',
    subtitle: 'Get help with home, work, and frequent destination records.',
    icon: 'home-outline',
    meta: 'Places',
  },
  {
    title: 'Accessibility help',
    subtitle: 'Request support for accessibility needs during passenger trips.',
    icon: 'accessibility-outline',
    meta: 'Access',
  },
];

const PRIORITY_OPTIONS: TicketPriority[] = ['Normal', 'Urgent'];

export default function SupportHelpScreen() {
  const { token } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState(SUPPORT_TILES[0].title);
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [subject, setSubject] = useState('');
  const [rideReference, setRideReference] = useState('');
  const [description, setDescription] = useState('');
  const [savingTicket, setSavingTicket] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);

  const colors = {
    background: useThemeColor({ light: '#F4F8F7', dark: '#151718' }, 'background'),
    textPrimary: useThemeColor({ light: '#123532', dark: '#ECEDEE' }, 'text'),
    textSecondary: useThemeColor({ light: '#617C79', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    elevatedCard: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    border: useThemeColor({ light: '#D9E9E6', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    warning: '#A16207',
    warningSoft: '#FFF6E3',
    danger: '#B42318',
    dangerSoft: '#FEECEC',
    success: '#177245',
    successSoft: '#EAF7EF',
  };

  const selectedTopicInfo = useMemo(
    () => SUPPORT_TILES.find((tile) => tile.title === selectedTopic) ?? SUPPORT_TILES[0],
    [selectedTopic]
  );

  const resetTicketForm = () => {
    setSubject('');
    setRideReference('');
    setDescription('');
    setPriority('Normal');
    setTopicMenuOpen(false);
  };

  const submitTicket = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    const trimmedRideReference = rideReference.trim();

    if (!token) {
      Alert.alert('Login required', 'Please log in before opening a support ticket.');
      return;
    }

    if (!trimmedSubject) {
      Alert.alert('Add a subject', 'Please add a short subject for your support ticket.');
      return;
    }

    if (trimmedDescription.length < 12) {
      Alert.alert('Add more detail', 'Please describe the complaint with at least a few details.');
      return;
    }

    setSavingTicket(true);
    try {
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: trimmedSubject,
          description: trimmedDescription,
          rideReference: trimmedRideReference,
          priority,
        }),
      });
      const data = await parseApiResponse<{ ticket: { id: string } }>(response);

      resetTicketForm();
      Alert.alert('Ticket opened', `Your complaint ticket ${data.ticket.id} is now open.`);
    } catch (error) {
      Alert.alert('Could not open ticket', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingTicket(false);
    }
  };

  const openEmailSupport = async () => {
    const subject = encodeURIComponent('NexGO passenger support request');
    const body = encodeURIComponent('Hi NexGO Support,\n\nI need help with:\n\n');
    const emailUrl = `mailto:support@nexgo.app?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL('mailto:support@nexgo.app');

      if (canOpen) {
        await Linking.openURL(emailUrl);
        return;
      }
    } catch {
      // Some Expo targets report mailto support but still reject when no mail app is configured.
    }

    Alert.alert('Email support', 'Please email support@nexgo.app for passenger support.');
  };

  const showChatMessage = () => {
    Alert.alert('NexGO Support', 'Live chat will be available here soon. For now, email support@nexgo.app.');
  };

  const contactRows = [
    {
      title: 'Start live chat',
      subtitle: 'Message the NexGO support team from the passenger app',
      icon: 'chatbubble-ellipses-outline' as const,
      badge: 'Soon',
      badgeTone: 'warning' as const,
      onPress: showChatMessage,
    },
    {
      title: 'Email support',
      subtitle: 'Send trip, payment, account, or safety questions',
      icon: 'mail-outline' as const,
      badge: '24/7',
      badgeTone: 'accent' as const,
      onPress: () => {
        void openEmailSupport();
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="headset-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Passenger support</Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>How can we help?</Text>
          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Get support for rides, payment, safety, and account questions without leaving your NexGO profile.
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="flash-outline" size={17} color={colors.accent} />
              <Text style={[styles.statusValue, { color: colors.textPrimary }]}>Fast</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Replies</Text>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="shield-outline" size={17} color={colors.accent} />
              <Text style={[styles.statusValue, { color: colors.textPrimary }]}>Safe</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Trips</Text>
            </View>

            <View style={[styles.statusCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="receipt-outline" size={17} color={colors.accent} />
              <Text style={[styles.statusValue, { color: colors.textPrimary }]}>Clear</Text>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Billing</Text>
            </View>
          </View>
        </View>

        <View style={[styles.ticketComposerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ticketComposerHeader}>
            <View>
              <Text style={[styles.composerEyebrow, { color: colors.accent }]}>{selectedTopicInfo.meta} complaint</Text>
              <Text style={[styles.composerTitle, { color: colors.textPrimary }]}>Open Support Ticket</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="radio-button-on-outline" size={14} color={colors.success} />
              <Text style={[styles.openBadgeText, { color: colors.success }]}>Open</Text>
            </View>
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Support Topic</Text>
            <Pressable
              onPress={() => setTopicMenuOpen((isOpen) => !isOpen)}
              style={[
                styles.topicSelectButton,
                {
                  backgroundColor: colors.elevatedCard,
                  borderColor: topicMenuOpen ? colors.accent : colors.border,
                },
              ]}>
              <View style={[styles.topicSelectIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={selectedTopicInfo.icon} size={18} color={colors.accent} />
              </View>
              <View style={styles.topicSelectTextWrap}>
                <Text style={[styles.topicSelectTitle, { color: colors.textPrimary }]}>{selectedTopicInfo.title}</Text>
                <Text style={[styles.topicSelectSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedTopicInfo.subtitle}
                </Text>
              </View>
              <Ionicons name={topicMenuOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={19} color={colors.textSecondary} />
            </Pressable>

            {topicMenuOpen && (
              <View style={[styles.topicDropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {SUPPORT_TILES.map((tile, index) => {
                  const isSelected = selectedTopic === tile.title;

                  return (
                    <Pressable
                      key={tile.title}
                      onPress={() => {
                        setSelectedTopic(tile.title);
                        setTopicMenuOpen(false);
                      }}
                      style={[
                        styles.topicDropdownOption,
                        index > 0 && { borderTopColor: colors.divider, borderTopWidth: 1 },
                        isSelected && { backgroundColor: colors.accentSoft },
                      ]}>
                      <View style={[styles.dropdownOptionIcon, { backgroundColor: colors.elevatedCard }]}>
                        <Ionicons name={tile.icon} size={17} color={isSelected ? colors.accent : colors.textSecondary} />
                      </View>
                      <View style={styles.dropdownOptionTextWrap}>
                        <Text style={[styles.dropdownOptionTitle, { color: colors.textPrimary }]}>{tile.title}</Text>
                        <Text style={[styles.dropdownOptionSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                          {tile.subtitle}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.elevatedCard,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
          />

          <TextInput
            value={rideReference}
            onChangeText={setRideReference}
            placeholder="Ride ID or booking reference (optional)"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={[
              styles.input,
              {
                backgroundColor: colors.elevatedCard,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,
              {
                backgroundColor: colors.elevatedCard,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
          />

          <View style={styles.prioritySelector}>
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = priority === option;
              const isUrgent = option === 'Urgent';

              return (
                <Pressable
                  key={option}
                  onPress={() => setPriority(option)}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: isSelected
                        ? isUrgent
                          ? colors.dangerSoft
                          : colors.accentSoft
                        : colors.elevatedCard,
                      borderColor: isSelected ? (isUrgent ? colors.danger : colors.accent) : colors.border,
                    },
                  ]}>
                  <Ionicons
                    name={isUrgent ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                    size={16}
                    color={isSelected ? (isUrgent ? colors.danger : colors.accent) : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.priorityOptionText,
                      { color: isSelected ? (isUrgent ? colors.danger : colors.accent) : colors.textSecondary },
                    ]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={savingTicket}
            onPress={() => {
              void submitTicket();
            }}
            style={[styles.submitTicketButton, { backgroundColor: savingTicket ? colors.textSecondary : colors.accent }]}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.submitTicketText}>{savingTicket ? 'Opening ticket...' : 'Open Complaint Ticket'}</Text>
          </Pressable>
        </View>

        <ProfileDetailsGroup title="CONTACT SUPPORT" actionRows={contactRows} />

        <View style={[styles.priorityCard, { backgroundColor: colors.warningSoft, borderColor: '#F3D99B' }]}>
          <View style={styles.priorityHeader}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.warning} />
            <Text style={[styles.priorityTitle, { color: colors.warning }]}>Urgent safety issue?</Text>
          </View>
          <Text style={[styles.priorityText, { color: colors.warning }]}>
            If you are in immediate danger, contact local emergency services first. NexGO support can help review the trip afterward.
          </Text>
        </View>

        <View style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>Before You Contact Us</Text>
          <View style={[styles.guideDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.guideStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.stepNumberText, { color: colors.accent }]}>1</Text>
            </View>
            <Text style={[styles.guideStepText, { color: colors.textSecondary }]}>
              Keep your ride ID, payment method, or account email ready.
            </Text>
          </View>

          <View style={styles.guideStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.stepNumberText, { color: colors.accent }]}>2</Text>
            </View>
            <Text style={[styles.guideStepText, { color: colors.textSecondary }]}>
              Add a short description so the support team can route your request quickly.
            </Text>
          </View>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statusCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
    marginBottom: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketComposerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  ticketComposerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  composerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  composerTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  openBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  topicSelectButton: {
    minHeight: 62,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topicSelectIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicSelectTextWrap: {
    flex: 1,
    gap: 2,
  },
  topicSelectTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  topicSelectSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicDropdownMenu: {
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  topicDropdownOption: {
    minHeight: 66,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  dropdownOptionTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  dropdownOptionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionInput: {
    minHeight: 112,
    lineHeight: 20,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '900',
  },
  submitTicketButton: {
    minHeight: 50,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitTicketText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  priorityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  priorityText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  guideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  guideDivider: {
    height: 1,
    marginVertical: 12,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  guideStepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
