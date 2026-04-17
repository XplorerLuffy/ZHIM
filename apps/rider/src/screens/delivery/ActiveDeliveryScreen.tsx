import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { ZhimText, ZhimButton, colors, spacing, radii, shadows } from '@zhim/ui';
import type { Order, OrderStatus } from '@zhim/types';
import { riderApi, WS_URL } from '../../api/client';

type DeliveryPhase = 'to_restaurant' | 'at_restaurant' | 'to_customer' | 'done';

export default function ActiveDeliveryScreen() {
  const { t, i18n } = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<Socket | null>(null);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const isDz = i18n.language === 'dz';

  const [phase, setPhase] = useState<DeliveryPhase>('to_restaurant');
  const [landmarkPhoto, setLandmarkPhoto] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: order } = useQuery({
    queryKey: ['rider-order', orderId],
    queryFn: () => riderApi.get(`/rider/orders/${orderId}`).then((r) => r.data.data as Order),
  });

  // Connect socket & start location streaming
  useEffect(() => {
    const socket = io(`${WS_URL}/delivery`, {
      auth: { userId: 'TODO_FROM_STORE' },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // Start location watcher
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 4000, distanceInterval: 10 },
        (loc) => {
          const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setRiderLocation(coords);

          socket.emit('rider:location_update', {
            order_id: orderId,
            location: coords,
            bearing: loc.coords.heading ?? undefined,
            speed_kmh: loc.coords.speed ? loc.coords.speed * 3.6 : undefined,
          });

          mapRef.current?.animateCamera({
            center: { latitude: coords.lat, longitude: coords.lng },
            zoom: 16,
          });
        },
      );
    })();

    return () => {
      socket.disconnect();
      locationWatcher.current?.remove();
    };
  }, [orderId]);

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      riderApi.patch(`/rider/orders/${orderId}/status`, { status }),
  });

  async function handleCaptureLandmarkPhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setLandmarkPhoto(uri);
      // Upload photo to R2
      const formData = new FormData();
      formData.append('photo', { uri, type: 'image/jpeg', name: 'landmark.jpg' } as any);
      formData.append('order_id', orderId);
      await riderApi.post('/rider/landmark-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
  }

  function handleSos() {
    Alert.alert(
      t('rider.sos'),
      t('rider.sos_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            await riderApi.post('/rider/sos', {
              order_id: orderId,
              location: riderLocation,
            });
            Alert.alert(t('rider.sos_sent'));
          },
        },
      ],
    );
  }

  function handleAtRestaurant() {
    setPhase('at_restaurant');
    updateStatus.mutate('ready');  // triggers customer notification
  }

  function handlePickedUp() {
    setPhase('to_customer');
    updateStatus.mutate('picked_up');
  }

  function handleDelivered() {
    Alert.alert(
      t('rider.delivered'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rider.delivered'),
          onPress: () => {
            setPhase('done');
            updateStatus.mutate('delivered');
          },
        },
      ],
    );
  }

  if (!order) return null;

  const restaurantCoords = { latitude: 27.469, longitude: 89.641 };  // from order snapshot
  const customerCoords   = { latitude: 27.465, longitude: 89.638 };  // from address

  return (
    <View style={styles.root}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 27.469,
          longitude: 89.641,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {/* Restaurant */}
        <Marker coordinate={restaurantCoords}>
          <View style={styles.mapMarker}>
            <ZhimText style={{ fontSize: 22 }}>🏪</ZhimText>
          </View>
        </Marker>

        {/* Rider */}
        {riderLocation && (
          <Marker coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }}>
            <View style={styles.mapMarker}>
              <ZhimText style={{ fontSize: 22 }}>🛵</ZhimText>
            </View>
          </Marker>
        )}

        {/* Customer */}
        {phase !== 'to_restaurant' && (
          <Marker coordinate={customerCoords}>
            <View style={styles.mapMarker}>
              <ZhimText style={{ fontSize: 22 }}>📍</ZhimText>
            </View>
          </Marker>
        )}
      </MapView>

      {/* SOS button — always visible */}
      <TouchableOpacity style={[styles.sosBtn, { top: insets.top + spacing[3] }]} onPress={handleSos}>
        <ZhimText variant="label" color={colors.white}>🆘 SOS</ZhimText>
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing[2] }]}>

        {/* Customer address — landmark-based */}
        <View style={styles.addressCard}>
          <ZhimText variant="label" muted dzongkha={isDz}>{t('address.nearest_landmark')}</ZhimText>
          <ZhimText variant="h3" numberOfLines={2}>
            📍 {order.delivery_address_id}
            {/* Resolved from address: "Near Clock Tower Roundabout" */}
          </ZhimText>
          <ZhimText variant="bodySmall" muted>Yellow building, 2nd floor</ZhimText>

          {/* Landmark entrance photo (from customer upload) */}
          {landmarkPhoto && (
            <Image source={{ uri: landmarkPhoto }} style={styles.entrancePhoto} resizeMode="cover" />
          )}
        </View>

        {/* Contact customer */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`tel:+97517123456`)}
          >
            <ZhimText>📞</ZhimText>
            <ZhimText variant="caption" dzongkha={isDz}>{t('rider.call_customer')}</ZhimText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('https://wa.me/97517123456')}
          >
            <ZhimText>💬</ZhimText>
            <ZhimText variant="caption" dzongkha={isDz}>{t('rider.whatsapp_customer')}</ZhimText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={handleCaptureLandmarkPhoto}
          >
            <ZhimText>📸</ZhimText>
            <ZhimText variant="caption" dzongkha={isDz}>{t('rider.capture_landmark')}</ZhimText>
          </TouchableOpacity>
        </View>

        {/* Primary action */}
        {phase === 'to_restaurant' && (
          <ZhimButton
            label={t('rider.arrived_restaurant')}
            onPress={handleAtRestaurant}
            variant="secondary"
            size="lg"
            fullWidth
          />
        )}
        {phase === 'at_restaurant' && (
          <ZhimButton
            label={t('rider.picked_up')}
            onPress={handlePickedUp}
            variant="primary"
            size="lg"
            fullWidth
          />
        )}
        {phase === 'to_customer' && (
          <ZhimButton
            label={t('rider.delivered')}
            onPress={handleDelivered}
            variant="primary"
            size="lg"
            fullWidth
          />
        )}
        {phase === 'done' && (
          <View style={styles.doneState}>
            <ZhimText variant="h2" color={colors.secondary[500]}>✓ {t('rider.delivered')}</ZhimText>
          </View>
        )}

        {/* Earnings strip */}
        <View style={styles.earningsStrip}>
          <ZhimText variant="caption" muted dzongkha={isDz}>{t('rider.earnings_today')}</ZhimText>
          <ZhimText variant="label" color={colors.secondary[500]}>Nu. 340</ZhimText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },

  mapMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  sosBtn: {
    position: 'absolute',
    right: spacing[4],
    zIndex: 20,
    backgroundColor: colors.error,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    ...shadows.lg,
  },

  panel: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
    ...shadows.lg,
  },

  addressCard: {
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    padding: spacing[3],
    gap: spacing[1],
  },

  entrancePhoto: {
    width: '100%',
    height: 120,
    borderRadius: radii.sm,
    marginTop: spacing[2],
  },

  contactRow: { flexDirection: 'row', gap: spacing[2] },
  contactBtn: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    gap: spacing[1],
  },

  doneState: { alignItems: 'center', paddingVertical: spacing[3] },

  earningsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
});
