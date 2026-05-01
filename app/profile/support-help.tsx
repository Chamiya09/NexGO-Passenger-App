import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
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

type SupportTile = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  meta: string;
};

type TicketPriority = 'Normal' | 'Urgent';
type TicketStatus = 'Open';

type SupportTicket = {
  id: string;
  topic: string;
  subject: string;
  description: string;
  rideReference?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  passengerName?: string;
  passengerEmail?: string;
};

const SUPPORT_TICKETS_STORAGE_KEY = 'nexgo-passenger-support-tickets';

const SUPPORT_TILES: SupportTile[] = [
  {
    title: 'Ride issue',
    subtitle: 'Report route, pickup, driver, or trip experience concerns.',
    icon: 'car-outline',
    meta: 'Trips',
  },
  {
    title: 'Payment help',
    subtitle: 'Resolve failed payments, refunds, card, and wallet questions.',
    icon: 'card-outline',
    meta: 'Billing',
  },
  {
    title: 'Safety center',
    subtitle: 'Get help for urgent safety concerns and trusted ride guidance.',
    icon: 'shield-checkmark-outline',
    meta: 'Priority',
  },
  {
    title: 'Account support',
    subtitle: 'Fix login, profile, saved address, and membership problems.',
    icon: 'person-circle-outline',
    meta: 'Account',
  },
];

const PRIORITY_OPTIONS: TicketPriority[] = ['Normal', 'Urgent'];

const FAQ_ROWS = [
  {
    title: 'Where can I see my ride history?',
    subtitle: 'Open Activities to review completed, cancelled, and upcoming ride details.',
    icon: 'time-outline' as const,
  },
  {
    title: 'How do I update my saved places?',
    subtitle: 'Use Saved Addresses to manage home, work, and frequent destinations.',
    icon: 'location-outline' as const,
  },
  {
    title: 'How do I keep my account secure?',
    subtitle: 'Use Account Security to change your password and review privacy controls.',
    icon: 'lock-closed-outline' as const,
  },
];

export default function SupportHelpScreen() {
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState(SUPPORT_TILES[0].title);
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [subject, setSubject] = useState('');
  const [rideReference, setRideReference] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [savingTicket, setSavingTicket] = useState(false);

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

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const rawTickets = await AsyncStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);

        if (!rawTickets) {
          return;
        }

        const parsedTickets = JSON.parse(rawTickets) as SupportTicket[];
        setTickets(Array.isArray(parsedTickets) ? parsedTickets : []);
      } catch {
        setTickets([]);
      }
    };

    void loadTickets();
  }, []);

  const selectedTopicMeta = useMemo(
    () => SUPPORT_TILES.find((tile) => tile.title === selectedTopic)?.meta ?? 'Support',
    [selectedTopic]
  );

  const saveTickets = async (nextTickets: SupportTicket[]) => {
    setTickets(nextTickets);
    await AsyncStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(nextTickets));
  };

  const resetTicketForm = () => {
    setSubject('');
    setRideReference('');
    setDescription('');
    setPriority('Normal');
  };

  const createTicketId = () => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `NGP-${Date.now().toString().slice(-5)}-${suffix}`;
  };

  const submitTicket = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    const trimmedRideReference = rideReference.trim();

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
      const nextTicket: SupportTicket = {
        id: createTicketId(),
        topic: selectedTopic,
        subject: trimmedSubject,
        description: trimmedDescription,
        rideReference: trimmedRideReference || undefined,
        priority,
        status: 'Open',
        createdAt: new Date().toISOString(),
        passengerName: user?.fullName,
        passengerEmail: user?.email,
      };
      const nextTickets = [nextTicket, ...tickets];

      await saveTickets(nextTickets);
      resetTicketForm();
      Alert.alert('Ticket opened', `Your complaint ticket ${nextTicket.id} is now open.`);
    } catch (error) {
      Alert.alert('Could not open ticket', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingTicket(false);
    }
  };

  const formatTicketDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

        <View style={styles.sectionHeadingWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Support Topics</Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>Choose the area that best matches your issue</Text>
        </View>

        <View style={styles.topicGrid}>
          {SUPPORT_TILES.map((tile) => (
            <Pressable
              key={tile.title}
              style={[styles.topicTile, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={showChatMessage}>
              <View style={styles.topicTileHeader}>
                <View style={[styles.topicIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name={tile.icon} size={19} color={colors.accent} />
                </View>
                <View style={[styles.topicMetaPill, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                  <Text style={[styles.topicMetaText, { color: colors.textSecondary }]}>{tile.meta}</Text>
                </View>
              </View>

              <Text style={[styles.topicTitle, { color: colors.textPrimary }]}>{tile.title}</Text>
              <Text style={[styles.topicSubtitle, { color: colors.textSecondary }]}>{tile.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.ticketComposerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ticketComposerHeader}>
            <View>
              <Text style={[styles.composerEyebrow, { color: colors.accent }]}>{selectedTopicMeta} complaint</Text>
              <Text style={[styles.composerTitle, { color: colors.textPrimary }]}>Open Support Ticket</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="radio-button-on-outline" size={14} color={colors.success} />
              <Text style={[styles.openBadgeText, { color: colors.success }]}>Open</Text>
            </View>
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Support Topic</Text>
            <View style={styles.formTopicGrid}>
              {SUPPORT_TILES.map((tile) => {
                const isSelected = selectedTopic === tile.title;

                return (
                  <Pressable
                    key={tile.title}
                    onPress={() => setSelectedTopic(tile.title)}
                    style={[
                      styles.formTopicOption,
                      {
                        backgroundColor: isSelected ? colors.accentSoft : colors.elevatedCard,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}>
                    <Ionicons name={tile.icon} size={16} color={isSelected ? colors.accent : colors.textSecondary} />
                    <Text
                      style={[
                        styles.formTopicOptionText,
                        { color: isSelected ? colors.accent : colors.textSecondary },
                      ]}>
                      {tile.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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

        <View style={[styles.openTicketsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.openTicketsHeader}>
            <Text style={[styles.openTicketsTitle, { color: colors.textPrimary }]}>Open Complaints</Text>
            <Text style={[styles.openTicketsCount, { color: colors.textSecondary }]}>{tickets.length}</Text>
          </View>

          {tickets.length === 0 ? (
            <View style={[styles.emptyTicketState, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="file-tray-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.emptyTicketText, { color: colors.textSecondary }]}>
                New support tickets you open will appear here.
              </Text>
            </View>
          ) : (
            tickets.map((ticket) => (
              <View key={ticket.id} style={[styles.ticketRow, { borderColor: colors.divider }]}>
                <View style={styles.ticketRowTop}>
                  <Text style={[styles.ticketId, { color: colors.accent }]} selectable>
                    {ticket.id}
                  </Text>
                  <View
                    style={[
                      styles.ticketPriorityBadge,
                      { backgroundColor: ticket.priority === 'Urgent' ? colors.dangerSoft : colors.accentSoft },
                    ]}>
                    <Text
                      style={[
                        styles.ticketPriorityText,
                        { color: ticket.priority === 'Urgent' ? colors.danger : colors.accent },
                      ]}>
                      {ticket.priority}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ticketSubject, { color: colors.textPrimary }]}>{ticket.subject}</Text>
                <Text style={[styles.ticketMeta, { color: colors.textSecondary }]}>
                  {ticket.topic} | {ticket.status} | {formatTicketDate(ticket.createdAt)}
                </Text>
                {!!ticket.rideReference && (
                  <Text style={[styles.ticketReference, { color: colors.textSecondary }]} selectable>
                    Ride: {ticket.rideReference}
                  </Text>
                )}
              </View>
            ))
          )}
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

        <ProfileDetailsGroup title="QUICK ANSWERS" actionRows={FAQ_ROWS} />
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
  sectionHeadingWrap: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  topicTile: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '48.5%',
    minHeight: 164,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  topicTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  topicIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicMetaPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topicMetaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  topicSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
  formTopicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formTopicOption: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  formTopicOptionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
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
  openTicketsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  openTicketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  openTicketsTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  openTicketsCount: {
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  emptyTicketState: {
    minHeight: 94,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 7,
  },
  emptyTicketText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  ticketRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 11,
    gap: 4,
  },
  ticketRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '900',
  },
  ticketPriorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ticketPriorityText: {
    fontSize: 10,
    fontWeight: '900',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '900',
  },
  ticketMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketReference: {
    fontSize: 12,
    fontWeight: '700',
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
