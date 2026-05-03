import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  status: 'Pending' | 'Open' | 'In Review' | 'Resolved' | 'Closed';
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

const STATUS_COLORS = {
  Pending: { text: '#A16207', bg: '#FFF6E3', icon: 'time-outline' },
  Open: { text: '#14988F', bg: '#E7F5F3', icon: 'radio-button-on-outline' },
  'In Review': { text: '#A16207', bg: '#FFF6E3', icon: 'hourglass-outline' },
  Resolved: { text: '#157A62', bg: '#E9F8EF', icon: 'checkmark-done-outline' },
  Closed: { text: '#667085', bg: '#F2F4F7', icon: 'lock-closed-outline' },
} as const;

export default function MySupportTicketsScreen() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState(false);
  const [savingTicket, setSavingTicket] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editRideReference, setEditRideReference] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<SupportTicket['priority']>('Normal');
  const [ticketPendingDelete, setTicketPendingDelete] = useState<SupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

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

  const openTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditingTicket(false);
    setEditSubject(ticket.subject);
    setEditRideReference(ticket.rideReference || '');
    setEditDescription(ticket.description);
    setEditPriority(ticket.priority);
  };

  const canModifyTicket = (ticket: SupportTicket) => !['Resolved', 'Closed'].includes(ticket.status);

  const saveTicketUpdate = async () => {
    if (!selectedTicket || !token || savingTicket) return;

    const trimmedSubject = editSubject.trim();
    const trimmedDescription = editDescription.trim();

    if (trimmedSubject.length < 3) {
      Alert.alert('Add a subject', 'Subject must be at least 3 characters.');
      return;
    }

    if (trimmedDescription.length < 12) {
      Alert.alert('Add more detail', 'Description must be at least 12 characters.');
      return;
    }

    setSavingTicket(true);
    try {
      const response = await fetch(`${API_BASE_URL}/support-tickets/my-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: trimmedSubject,
          rideReference: editRideReference.trim(),
          description: trimmedDescription,
          priority: editPriority,
        }),
      });
      const data = await parseApiResponse<{ ticket: SupportTicket }>(response);

      setTickets((current) => current.map((ticket) => (ticket.id === data.ticket.id ? data.ticket : ticket)));
      setSelectedTicket(data.ticket);
      setEditingTicket(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Ticket update failed', message);
    } finally {
      setSavingTicket(false);
    }
  };

  const deleteTicket = async (ticket: SupportTicket) => {
    if (!token) return;
    setTicketPendingDelete(ticket);
  };

  const confirmDeleteTicket = async () => {
    if (!token || !ticketPendingDelete) return;

    setDeletingTicket(true);
          try {
            const response = await fetch(`${API_BASE_URL}/support-tickets/my-tickets/${ticketPendingDelete.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            await parseApiResponse<{ id: string; message?: string }>(response);
            setTickets((current) => current.filter((item) => item.id !== ticketPendingDelete.id));
            setSelectedTicket(null);
      setTicketPendingDelete(null);
          } catch (error) {
            Alert.alert('Could not delete ticket', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDeletingTicket(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={() => loadTickets(true)}>
        <View style={styles.topBar}>
          <Pressable style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>My Support Tickets</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Ionicons name="file-tray-full-outline" size={26} color={colors.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Ticket Center</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Complaint status, support replies, and updates.
              </Text>
            </View>
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

                <Pressable style={[styles.viewDetailsButton, { backgroundColor: colors.accentSoft }]} onPress={() => openTicketDetails(ticket)}>
                  <Ionicons name="eye-outline" size={16} color={colors.accent} />
                  <Text style={[styles.viewDetailsText, { color: colors.accent }]}>View Details</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </RefreshableScrollView>

      <Modal
        visible={Boolean(selectedTicket)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTicket(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selectedTicket ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleWrap}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedTicket.subject}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      {selectedTicket.topic} | {selectedTicket.status}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.modalCloseButton, { backgroundColor: colors.elevatedCard }]}
                    onPress={() => setSelectedTicket(null)}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {editingTicket ? (
                  <View style={styles.editForm}>
                    <TextInput
                      value={editSubject}
                      onChangeText={setEditSubject}
                      placeholder="Subject"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.elevatedCard, borderColor: colors.border, color: colors.textPrimary },
                      ]}
                    />
                    <TextInput
                      value={editRideReference}
                      onChangeText={setEditRideReference}
                      placeholder="Ride reference (optional)"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.elevatedCard, borderColor: colors.border, color: colors.textPrimary },
                      ]}
                    />
                    <TextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Description"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      textAlignVertical="top"
                      style={[
                        styles.modalInput,
                        styles.modalDescriptionInput,
                        { backgroundColor: colors.elevatedCard, borderColor: colors.border, color: colors.textPrimary },
                      ]}
                    />
                    <View style={styles.editPriorityRow}>
                      {(['Normal', 'Urgent'] as const).map((option) => {
                        const isSelected = editPriority === option;
                        const isUrgentOption = option === 'Urgent';

                        return (
                          <Pressable
                            key={option}
                            onPress={() => setEditPriority(option)}
                            style={[
                              styles.editPriorityOption,
                              {
                                backgroundColor: isSelected
                                  ? isUrgentOption
                                    ? colors.dangerSoft
                                    : colors.accentSoft
                                  : colors.elevatedCard,
                                borderColor: isSelected
                                  ? isUrgentOption
                                    ? colors.danger
                                    : colors.accent
                                  : colors.border,
                              },
                            ]}>
                            <Ionicons
                              name={isUrgentOption ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                              size={16}
                              color={isSelected ? (isUrgentOption ? colors.danger : colors.accent) : colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.editPriorityText,
                                { color: isSelected ? (isUrgentOption ? colors.danger : colors.accent) : colors.textSecondary },
                              ]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>Details</Text>
                    <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                      {selectedTicket.description}
                    </Text>
                    {!!selectedTicket.rideReference && (
                      <>
                        <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>Ride Reference</Text>
                        <Text style={[styles.modalInfoText, { color: colors.textSecondary }]} selectable>
                          {selectedTicket.rideReference}
                        </Text>
                      </>
                    )}
                    {!!selectedTicket.adminNote && (
                      <View style={[styles.modalNoteBox, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                        <Text style={[styles.modalSectionLabel, { color: colors.textPrimary }]}>Support Reply</Text>
                        <Text style={[styles.modalInfoText, { color: colors.textSecondary }]}>{selectedTicket.adminNote}</Text>
                      </View>
                    )}
                  </>
                )}

                {canModifyTicket(selectedTicket) ? (
                  <View style={styles.modalActions}>
                    {editingTicket ? (
                      <>
                        <Pressable style={[styles.modalSecondaryButton, { borderColor: colors.border }]} onPress={() => setEditingTicket(false)}>
                          <Text style={[styles.modalSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          disabled={savingTicket}
                          style={[styles.modalPrimaryButton, { backgroundColor: colors.accent }]}
                          onPress={() => {
                            void saveTicketUpdate();
                          }}>
                          {savingTicket ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={17} color="#FFFFFF" />}
                          <Text style={styles.modalPrimaryText}>{savingTicket ? 'Saving...' : 'Save'}</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable style={[styles.modalUpdateButton, { backgroundColor: colors.accentSoft }]} onPress={() => setEditingTicket(true)}>
                          <Ionicons name="create-outline" size={17} color={colors.accent} />
                          <Text style={[styles.modalUpdateText, { color: colors.accent }]}>Update</Text>
                        </Pressable>
                        <Pressable
                          style={styles.modalDeleteButton}
                          onPress={() => {
                            void deleteTicket(selectedTicket);
                          }}>
                          <Ionicons name="trash-outline" size={17} color={colors.danger} />
                          <Text style={[styles.modalDeleteText, { color: colors.danger }]}>Delete</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={[styles.resolvedNotice, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.resolvedNoticeText, { color: colors.textSecondary }]}>
                      This ticket is resolved, so updates and deletion are disabled.
                    </Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <ConfirmDialog
        visible={Boolean(ticketPendingDelete)}
        title="Delete support ticket"
        message="This will permanently remove this support ticket."
        confirmLabel="Delete"
        destructive
        loading={deletingTicket}
        icon="trash-outline"
        onCancel={() => {
          if (!deletingTicket) setTicketPendingDelete(null);
        }}
        onConfirm={confirmDeleteTicket}
      />
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
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  topBarSpacer: {
    width: 38,
    height: 38,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
  viewDetailsButton: {
    minHeight: 42,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 53, 50, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  modalInfoText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  modalNoteBox: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 11,
    marginTop: 10,
  },
  editForm: {
    gap: 10,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  modalDescriptionInput: {
    minHeight: 128,
    lineHeight: 19,
  },
  editPriorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editPriorityOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  editPriorityText: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  modalUpdateButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalUpdateText: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalDeleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F1D6D6',
    backgroundColor: '#FFF1F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: '900',
  },
  resolvedNotice: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 11,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resolvedNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
});
