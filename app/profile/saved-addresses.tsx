import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  StatusBar as RNStatusBar,
} from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { MAP_LOADING_ENABLED, MAP_TILE_URL_TEMPLATE } from '@/lib/mapTiles';
import { useThemeColor } from '@/hooks/use-theme-color';

type AddressLabel = 'Home' | 'Work' | 'Other';

type SavedAddress = {
  _id: string;
  label: AddressLabel;
  title: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  note: string;
  isDefault: boolean;
  showOnRidePage: boolean;
};

const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

const initialForm = {
  title: '',
  note: '',
  label: 'Other' as AddressLabel,
  isDefault: false,
};

const labelIconMap: Record<AddressLabel, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Work: 'briefcase-outline',
  Other: 'location-outline',
};

export default function SavedAddressesScreen() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [selectedAddressLine, setSelectedAddressLine] = useState('Move the map to choose an address');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const colors = {
    background: useThemeColor({}, 'background'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    input: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    overlay: 'rgba(7, 21, 19, 0.45)',
    success: '#157A62',
    warning: '#D88B21',
    warningSoft: '#FFF5E4',
    danger: '#C13B3B',
  };

  const loadSavedAddresses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load saved addresses');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSavedAddresses();
  }, [loadSavedAddresses]);

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setResolvingAddress(true);
        const response = await fetch(
          `https://photon.komoot.io/reverse?lon=${selectedLocation.longitude}&lat=${selectedLocation.latitude}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Unable to resolve location');
        }

        const data = await response.json();
        let composedName = 'Selected map location';

        if (data?.features?.length > 0) {
          const p = data.features[0].properties || {};
          const detail = p.street || p.name || p.district || p.locality;
          const region = p.city || p.county || p.state;
          const country = p.country;

          const parts = [detail, region, country].filter(Boolean);
          if (parts.length > 0) {
            composedName = parts.join(', ');
          }
        }

        setSelectedAddressLine(composedName);
      } catch {
        setSelectedAddressLine('Selected map location');
      } finally {
        setResolvingAddress(false);
      }
    }, 700);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [isModalVisible, selectedLocation]);

  const openAddModal = () => {
    setForm({
      ...initialForm,
      isDefault: addresses.length === 0,
    });
    setSelectedLocation({
      latitude: DEFAULT_REGION.latitude,
      longitude: DEFAULT_REGION.longitude,
    });
    setSelectedAddressLine('Move the map to choose an address');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) {
      return;
    }

    setIsModalVisible(false);
    setForm(initialForm);
  };

  const handleChange = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return 'Address title is required.';
    }

    if (!selectedAddressLine || selectedAddressLine === 'Move the map to choose an address') {
      return 'Choose the address from the map before saving.';
    }

    return null;
  };

  const saveAddress = async () => {
    if (!token) {
      setErrorMessage('You need to be logged in to save an address.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage(null);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: form.label,
          title: form.title.trim(),
          addressLine: selectedAddressLine,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          note: form.note.trim(),
          isDefault: form.isDefault,
        }),
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Saved address added successfully.');
      setIsModalVisible(false);
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save address');
    } finally {
      setSaving(false);
    }
  };

  const markAsDefault = async (addressId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to update a saved address.');
      return;
    }

    setUpdatingDefaultId(addressId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Default pickup address updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update default address');
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to delete a saved address.');
      return;
    }

    setDeletingId(addressId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Saved address removed.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete saved address');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleVisibility = async (addressId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to update a saved address.');
      return;
    }

    setTogglingVisibilityId(addressId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses/${addressId}/visibility`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage(data.savedAddresses.find((a) => a._id === addressId)?.showOnRidePage
        ? 'Address is now shown on ride page.'
        : 'Address hidden from ride page.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update address visibility');
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const mapRegion = useMemo(
    () => ({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: DEFAULT_REGION.latitudeDelta,
      longitudeDelta: DEFAULT_REGION.longitudeDelta,
    }),
    [selectedLocation]
  );

  const defaultAddress = addresses.find((address) => address.isDefault);
  const homeCount = addresses.filter((address) => address.label === 'Home').length;
  const workCount = addresses.filter((address) => address.label === 'Work').length;
  const showCount = addresses.filter((a) => a.showOnRidePage).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={loadSavedAddresses}>
        <View style={styles.topBar}>
          <Pressable style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Saved Addresses</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={26} color={colors.accent} />
            </View>

            <View style={styles.heroIdentity}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Saved Places</Text>
              <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                Home, work, and favorite pickup points.
              </Text>
            </View>
          </View>

          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="navigate-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Faster pickups</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Keep your most-used places ready for one-tap ride booking and smoother pickups.
          </Text>
        </View>

        {errorMessage ? <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <View style={styles.metricGrid}>
          <AddressMetricCard
            icon="location-outline"
            label="Saved"
            value={`${addresses.length}`}
            color={colors.accent}
            backgroundColor={colors.accentSoft}
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
          <AddressMetricCard
            icon="home-outline"
            label="Home"
            value={`${homeCount}`}
            color={colors.success}
            backgroundColor="#E9F8EF"
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
          <AddressMetricCard
            icon="briefcase-outline"
            label="Work"
            value={`${workCount}`}
            color={colors.warning}
            backgroundColor={colors.warningSoft}
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: colors.textSecondary }]}>SAVED PLACES</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              {defaultAddress ? `Default: ${defaultAddress.title}` : 'No default address'}
            </Text>
          </View>
          <View style={styles.sectionHeaderActions}>
            <View
              style={[
                styles.shownBadge,
                {
                  backgroundColor: showCount >= 4 ? colors.warningSoft : colors.accentSoft,
                  borderColor: showCount >= 4 ? colors.warning : colors.accent,
                },
              ]}>
              <Ionicons name="eye-outline" size={12} color={showCount >= 4 ? colors.warning : colors.accent} />
              <Text style={[styles.shownBadgeText, { color: showCount >= 4 ? colors.warning : colors.accent }]}>
                {showCount} / 4
              </Text>
            </View>
            <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={openAddModal}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.groupCard, styles.addressSectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardAccent, { backgroundColor: colors.accent }]} />
          {loading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading saved addresses...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="location-outline" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No saved places yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Add your home, work, or favorite pickup points for faster ride requests.
              </Text>
            </View>
          ) : (
            addresses.map((address, index) => {
              const isUpdatingDefault = updatingDefaultId === address._id;
              const isDeleting = deletingId === address._id;

              return (
                <View key={address._id}>
                  {/* ── address card ── */}
                  <View style={styles.addressCard}>
                    {/* Top row: icon | info text | delete */}
                    <View style={styles.addressCardTop}>
                      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                        <Ionicons name={labelIconMap[address.label]} size={16} color={colors.accent} />
                      </View>

                      <View style={styles.addressTextWrap}>
                        <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{address.title}</Text>
                        <Text style={[styles.addressMeta, { color: colors.textSecondary }]}>{address.label}</Text>
                        <Text style={[styles.addressLine, { color: colors.textPrimary }]} numberOfLines={2}>{address.addressLine}</Text>
                        {address.note ? (
                          <Text style={[styles.addressNote, { color: colors.textSecondary }]}>{address.note}</Text>
                        ) : null}
                      </View>

                      <Pressable
                        style={[styles.deleteIconButton, { backgroundColor: colors.accentSoft }]}
                        onPress={() => { void deleteAddress(address._id); }}
                        disabled={isUpdatingDefault || isDeleting}>
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        )}
                      </Pressable>
                    </View>

                    {/* Footer action bar: default badge/button | show toggle */}
                    <View style={[styles.addressCardFooter, { borderTopColor: colors.divider }]}>
                      {/* Left side: Default badge or Set-as-default button */}
                      <View style={styles.footerLeft}>
                        {address.isDefault ? (
                          <View style={[styles.defaultPill, { backgroundColor: colors.accentSoft }]}>
                            <Ionicons name="star" size={10} color={colors.accent} />
                            <Text style={[styles.defaultPillText, { color: colors.accent }]}>Default pickup</Text>
                          </View>
                        ) : (
                          <Pressable
                            style={[styles.setDefaultButton, { borderColor: colors.border }]}
                            onPress={() => { void markAsDefault(address._id); }}
                            disabled={isUpdatingDefault || isDeleting || togglingVisibilityId !== null}>
                            {isUpdatingDefault ? (
                              <ActivityIndicator size="small" color={colors.accent} />
                            ) : (
                              <>
                                <Ionicons name="star-outline" size={11} color={colors.textSecondary} />
                                <Text style={[styles.setDefaultText, { color: colors.textSecondary }]}>Set as default</Text>
                              </>
                            )}
                          </Pressable>
                        )}
                      </View>

                      {/* Right side: Show on ride page toggle */}
                      <View style={styles.footerRight}>
                        <Text style={[styles.visibilityLabel, { color: colors.textSecondary }]}>Show on ride page</Text>
                        {togglingVisibilityId === address._id ? (
                          <ActivityIndicator size="small" color={colors.accent} style={styles.toggleLoader} />
                        ) : (
                          <Switch
                            value={Boolean(address.showOnRidePage)}
                            onValueChange={() => { void toggleVisibility(address._id); }}
                            trackColor={{ false: '#C7D4D2', true: colors.accent }}
                            thumbColor="#FFFFFF"
                            disabled={
                              isUpdatingDefault ||
                              isDeleting ||
                              togglingVisibilityId !== null ||
                              (!address.showOnRidePage && addresses.filter((a) => a.showOnRidePage).length >= 4)
                            }
                            style={styles.visibilitySwitch}
                          />
                        )}
                      </View>
                    </View>
                  </View>

                  {index < addresses.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </RefreshableScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalSheet}>
                <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Saved Address</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Move the map and save the centered location.
                      </Text>
                    </View>

                    <Pressable style={styles.closeButton} onPress={closeAddModal} disabled={saving}>
                      <Ionicons name="close" size={20} color={colors.textPrimary} />
                    </Pressable>
                  </View>

                  <View style={styles.labelRow}>
                    {(['Home', 'Work', 'Other'] as AddressLabel[]).map((label) => {
                      const isActive = form.label === label;

                      return (
                        <Pressable
                          key={label}
                          style={[
                            styles.labelChip,
                            {
                              backgroundColor: isActive ? colors.accentSoft : colors.input,
                              borderColor: isActive ? colors.accent : colors.border,
                            },
                          ]}
                          onPress={() => handleChange('label', label)}>
                          <Ionicons
                            name={labelIconMap[label]}
                            size={14}
                            color={isActive ? colors.accent : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.labelChipText,
                              { color: isActive ? colors.accent : colors.textPrimary },
                            ]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={[styles.mapCard, { borderColor: colors.border }]}>
                    <MapView
                      style={StyleSheet.absoluteFillObject}
                      mapType="none"
                      loadingEnabled={MAP_LOADING_ENABLED}
                      loadingBackgroundColor="#EAE6DF"
                      loadingIndicatorColor="#169F95"
                      showsUserLocation={false}
                      showsMyLocationButton={false}
                      toolbarEnabled={false}
                      initialRegion={DEFAULT_REGION}
                      region={mapRegion}
                      onRegionChangeComplete={(region) => {
                        setSelectedLocation({
                          latitude: region.latitude,
                          longitude: region.longitude,
                        });
                      }}
                    >
                      <UrlTile urlTemplate={MAP_TILE_URL_TEMPLATE} maximumZ={19} flipY={false} />
                    </MapView>

                    <View pointerEvents="none" style={styles.fixedMarkerContainer}>
                      <Ionicons name="location-sharp" size={40} color={colors.accent} style={styles.fixedMarkerIcon} />
                    </View>
                  </View>

                  <View style={[styles.selectedLocationCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <View style={styles.selectedLocationHeader}>
                      <Text style={[styles.selectedLocationLabel, { color: colors.textSecondary }]}>Selected from map</Text>
                      {resolvingAddress ? <ActivityIndicator size="small" color={colors.accent} /> : null}
                    </View>
                    <Text style={[styles.selectedLocationText, { color: colors.textPrimary }]}>{selectedAddressLine}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address title</Text>
                    <TextInput
                      value={form.title}
                      onChangeText={(value) => handleChange('title', value)}
                      placeholder="Home, Office, Gym"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.input,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pickup note</Text>
                    <TextInput
                      value={form.note}
                      onChangeText={(value) => handleChange('note', value)}
                      placeholder="Gate number, building entrance, security desk"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.input,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.switchRow, { borderColor: colors.border }]}>
                    <View style={styles.switchTextWrap}>
                      <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>Set as default</Text>
                      <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                        Use this place first when selecting pickups.
                      </Text>
                    </View>

                    <Switch
                      value={form.isDefault}
                      onValueChange={(value) => handleChange('isDefault', value)}
                      trackColor={{ false: '#C7D4D2', true: colors.accent }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={closeAddModal}
                      disabled={saving}>
                      <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.submitButton,
                        { backgroundColor: colors.accent },
                        saving ? styles.submitButtonDisabled : null,
                      ]}
                      onPress={() => {
                        void saveAddress();
                      }}
                      disabled={saving}>
                      <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Save Address'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AddressMetricCard({
  icon,
  label,
  value,
  color,
  backgroundColor,
  borderColor,
  textColor,
  secondaryColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor, borderColor }]}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: secondaryColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIdentity: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubline: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  pageFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sectionTitleInline: {
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  addressSectionCard: {
    position: 'relative',
    paddingLeft: 4,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  stateRow: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  addressCard: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
  },
  addressCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  addressCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  setDefaultText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  shownBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextWrap: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addressMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  addressNote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 4,
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  visibilitySwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  toggleLoader: {
    width: 32,
    height: 20,
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 10,
  },
  modalKeyboardWrap: {
    width: '100%',
    flex: 1,
  },
  modalScroll: {
    width: '100%',
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  modalSheet: {
    minHeight: '100%',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    maxWidth: 220,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  labelChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mapCard: {
    height: 156,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
  },
  fixedMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedMarkerIcon: {
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  selectedLocationCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  selectedLocationLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedLocationText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchHint: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 200,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
