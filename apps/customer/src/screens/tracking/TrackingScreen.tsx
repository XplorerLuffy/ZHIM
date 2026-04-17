import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { ZhimText, ZhimButton, colors, spacing, radii, shadows } from '@zhim/ui';
import type { Order, RiderLocation } from '@zhim/types';
import { api, WS_URL } from '../../api/client';
import { OrderStatusStepper } from '../../components/OrderStatusStepper';
import { RatingSheet } from '../../components/RatingSheet';

const STATUS_COLORS: Record<string, string> = {
  pending:        colors.warning,
  confirmed:      colors.info,
  preparing:      colors.secondary[400],
  ready:          colors.secondary[500],
  rider_assigned: colors.primary[400],
  picked_up:      colors.primary[500],
  delivered:      colors.secondary[500],
  cancelled:      colors.error,
};

export default function TrackingScreen() {
  const { t, i18n } = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<Socket | null>(null);
  const isDz = i18n.language === 'dz';

  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number; bearing?: number } | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);

  const { data: order, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then((r) => r.data.data as Order),
    refetchInterval: order?.status && !['delivered', 'cancelled'].includes(order.status) ? 30_000 : false,
  });

  // Socket.io for real-time rider location
  useEffect(() => {
    if (!orderId) return;

    const socket = io(`${WS_URL}/delivery`, {
      auth: { userId: 'TODO_FROM_STORE' },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('order:subscribe', { order_id: orderId });

    socket.on('rider:location', (data: RiderLocation) => {
      if (data.order_id !== orderId) return;
      setRiderLocation({ lat: data.location.lat, lng: data.location.lng, bearing: data.bearing });

      // Animate map to rider
      mapRef.current?.animateCamera({
        center: { latitude: data.location.lat, longitude: data.location.lng },
        zoom: 16,
      });
    });

    socket.on('order:status_changed', (data: { order_id: string; status: string }) => {
      if (data.order_id !== orderId) return;
      refetch();
      if (data.status === 'delivered') {
        setTimeout(() => setShowRating(true), 2000);
      }
    });

    socket.on('order:eta_updated', (data: { order_id: string; eta_min: number }) => {
      if (data.order_id !== orderId) return;
      setEtaMin(data.eta_min);
    });

    return () => { socket.disconnect(); };
  }, [orderId]);

  if (!order) return null;

  const isTerminal = ['delivered', 'cancelled', 'refunded'].includes(order.status);
  const statusColor = STATUS_COLORS[order.status] ?? colors.primary[500];

  const dropoff = order.delivery_address_id
    ? { latitude: 0, longitude: 0 }  // resolved from address store
    : null;
  const pickup = order.restaurant
    ? { latitude: 27.469, longitude: 89.641 }  // from restaurant.location
    : null;

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
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Restaurant marker */}
        {pickup && (
          <Marker coordinate={pickup} title={order.restaurant?.name ?? ''}>
            <View style={styles.markerRestaurant}>
              <ZhimText style={{ fontSize: 20 }}>🏪</ZhimText>
            </View>
          </Marker>
        )}

        {/* Rider marker */}
        {riderLocation && (
          <Marker
            coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.markerRider, { transform: [{ rotate: `${riderLocation.bearing ?? 0}deg` }] }]}>
              <ZhimText style={{ fontSize: 24 }}>🛵</ZhimText>
            </View>
          </Marker>
        )}

        {/* Drop-off marker */}
        {dropoff && (
          <Marker coordinate={dropoff} title="Your location">
            <View style={styles.markerHome}>
              <ZhimText style={{ fontSize: 20 }}>🏠</ZhimText>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status card — slides up from bottom */}
      <View style={[styles.statusCard, { paddingBottom: insets.bottom + spacing[2] }]}>
        {/* ETA / status headline */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
          <ZhimText variant="label" color={statusColor} dzongkha={isDz}>
            {etaMin && order.status === 'picked_up'
              ? t('tracking.eta', { min: etaMin })
              : isDz
                ? (order.surge_message_dz ?? '')
                : (t(`tracking.${order.status}`, {
                    name: order.rider?.name ?? '',
                  }))}
          </ZhimText>
        </View>

        {/* Order status stepper */}
        <OrderStatusStepper status={order.status} isDz={isDz} />

        {/* Restaurant + order info */}
        <View style={styles.infoRow}>
          <ZhimText variant="body" bold numberOfLines={1}>
            {isDz && order.restaurant?.name_dz ? order.restaurant.name_dz : order.restaurant?.name}
          </ZhimText>
          <ZhimText variant="caption" muted>#{order.order_number}</ZhimText>
        </View>

        {/* Rider actions — only when rider assigned */}
        {order.rider && !isTerminal && (
          <View style={styles.riderActions}>
            <ZhimText variant="bodySmall" muted dzongkha={isDz}>
              {t('tracking.rider_assigned', { name: order.rider.name })}
            </ZhimText>
            <View style={styles.riderBtns}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${order.rider!.phone}`)}
              >
                <ZhimText>📞</ZhimText>
                <ZhimText variant="caption" dzongkha={isDz}>{t('tracking.call_rider')}</ZhimText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`https://wa.me/${order.rider!.phone?.replace('+', '')}`)}
              >
                <ZhimText>💬</ZhimText>
                <ZhimText variant="caption" dzongkha={isDz}>{t('tracking.message_rider')}</ZhimText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Weather / surge message */}
        {order.surge_message_en && order.status !== 'delivered' && (
          <View style={styles.weatherBanner}>
            <ZhimText variant="caption" color={colors.warning} dzongkha={isDz}>
              ⚠️ {isDz ? order.surge_message_dz : order.surge_message_en}
            </ZhimText>
          </View>
        )}
      </View>

      {/* Rating sheet */}
      <RatingSheet
        visible={showRating}
        orderId={orderId}
        onClose={() => setShowRating(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },

  markerRestaurant: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  markerRider: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHome: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
    ...shadows.lg,
  },

  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  riderActions: { gap: spacing[2] },
  riderBtns: { flexDirection: 'row', gap: spacing[3] },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    gap: spacing[1],
  },

  weatherBanner: {
    backgroundColor: colors.warning + '15',
    borderRadius: radii.md,
    padding: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
});
