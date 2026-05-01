import React, { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';

type SupportTicket = {
  id: string;
  topic: string;
  subject: string;
  description: string;
  rideReference: string;
  priority: 'Normal' | 'Urgent';
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

const STATUS_COLORS = {
  Open: { text: '#14988F', bg: '#E7F5F3', icon: 'radio-button-on-outline' },
  'In Review': { text: '#A16207', bg: '#FFF6E3', icon: 'hourglass-outline' },
  Resolved: { text: '#157A62', bg: '#E9F8EF', icon: 'checkmark-done-outline' },
  Closed: { text: '#667085', bg: '#F2F4F7', icon: 'lock-closed-outline' },
} as const;

export default function MySupportTicketsScreen() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    background: useThemeColor({ light: '#F4F8F7', dark: '#151718' }, 'background'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    elevatedCard: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    border: useThemeColor({ light: '#D9E9E6', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    textPrimary: useThemeColor({ light: '#123532', dark: '#ECEDEE' }, 'text'),
    textSecondary: useThemeColor({ light: '#617C79', dark: '#A3B1AE' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    danger: '#B42318',
    dangerSoft: '#FEECEC',
  };

  const loadTickets = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setTickets([]);
        setLoading(false);
        return;
      }

      if (!isRefresh) {
        setLoading(true);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/support-tickets/my-tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await parseApiResponse<{ tickets: SupportTicket[] }>(response);
        setTickets(data.tickets ?? []);
      } catch (error) {
        Alert.alert('Could not load tickets', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      void loadTickets();
    }, [loadTickets])
  );

  const formatDate = (value?: string | null) => {
    if (!value) {
      return 'Not updated';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openSupportForm = () => {
    router.push('/profile/support-help');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={() => loadTickets(true)}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="file-tray-full-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>My Support Tickets</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Review your passenger complaints, support status, and admin replies.
            </Text>
          </View>
          <Pressable style={[styles.newTicketButton, { backgroundColor: colors.accent }]} onPress={openSupportForm}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newTicketText}>New Ticket</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Loading tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chatbox-ellipses-outline" size={30} color={colors.accent} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No support tickets yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Open a complaint from Support & Help and it will appear here after it is saved.
            </Text>
            <Pressable style={[styles.emptyAction, { backgroundColor: colors.accentSoft }]} onPress={openSupportForm}>
              <Text style={[styles.emptyActionText, { color: colors.accent }]}>Open Support Form</Text>
            </Pressable>
          </View>
        ) : (
          tickets.map((ticket) => {
            const statusTone = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.Open;
            const isUrgent = ticket.priority === 'Urgent';

            return (
              <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.ticketAccent, { backgroundColor: isUrgent ? colors.danger : colors.accent }]} />

                <View style={styles.ticketTopRow}>
                  <View style={styles.ticketHeadingRow}>
                    <View style={[styles.ticketIconWrap, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
                    </View>
                    <View style={styles.ticketIdWrap}>
                      <Text style={[styles.ticketSubject, { color: colors.textPrimary }]}>{ticket.subject}</Text>
                      <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
                        Created {formatDate(ticket.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusTone.bg }]}>
                    <Ionicons name={statusTone.icon} size={13} color={statusTone.text} />
                    <Text style={[styles.statusBadgeText, { color: statusTone.text }]}>{ticket.status}</Text>
                  </View>
                </View>

                <Text style={[styles.ticketDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                  {ticket.description}
                </Text>

                <View style={styles.metaGrid}>
                  <View style={[styles.metaPill, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                    <Ionicons name="albums-outline" size={14} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{ticket.topic}</Text>
                  </View>
                  <View
                    style={[
                      styles.metaPill,
                      {
                        backgroundColor: isUrgent ? colors.dangerSoft : colors.accentSoft,
                        borderColor: isUrgent ? '#F5B5AF' : colors.border,
                      },
                    ]}>
                    <Ionicons
                      name={isUrgent ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                      size={14}
                      color={isUrgent ? colors.danger : colors.accent}
                    />
                    <Text style={[styles.metaText, { color: isUrgent ? colors.danger : colors.accent }]}>
                      {ticket.priority}
                    </Text>
                  </View>
                </View>

                <View style={[styles.ticketFooterPanel, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                  <View style={styles.footerInfoItem}>
                    <Ionicons name="calendar-outline" size={15} color={colors.accent} />
                    <Text style={[styles.footerInfoText, { color: colors.textSecondary }]}>
                      Updated {formatDate(ticket.updatedAt)}
                    </Text>
                  </View>
                  {!!ticket.rideReference && (
                    <View style={styles.footerInfoItem}>
                      <Ionicons name="receipt-outline" size={15} color={colors.accent} />
                      <Text style={[styles.footerInfoText, { color: colors.textSecondary }]} selectable>
                        Ride {ticket.rideReference}
                      </Text>
                    </View>
                  )}
                </View>

                {!!ticket.adminNote && (
                  <View style={[styles.adminNoteCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                    <View style={styles.adminNoteHeader}>
                      <Ionicons name="headset-outline" size={15} color={colors.accent} />
                      <Text style={[styles.adminNoteLabel, { color: colors.textPrimary }]}>Support reply</Text>
                    </View>
                    <Text style={[styles.adminNoteText, { color: colors.textSecondary }]}>{ticket.adminNote}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    gap: 4,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  newTicketButton: {
    minHeight: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  newTicketText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyCard: {
    minHeight: 190,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyAction: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '900',
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  ticketAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  ticketHeadingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ticketIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketIdWrap: {
    flex: 1,
    gap: 2,
  },
  ticketDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '900',
  },
  ticketDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ticketFooterPanel: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 11,
    gap: 8,
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  footerInfoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  adminNoteCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  adminNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminNoteLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  adminNoteText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
