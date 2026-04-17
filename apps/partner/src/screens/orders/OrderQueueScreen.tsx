import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { ZhimText, ZhimButton, NuBadge, colors, spacing, radii, shadows } from '@zhim/ui';
import type { Order, OrderStatus } from '@zhim/types';
import { partnerApi } from '../../api/client';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
const REJECT_REASONS = [
  { key: 'out_of_stock', labelKey: 'partner.orders.reject_out_of_stock' },
  { key: 'closed',       labelKey: 'partner.orders.reject_closed' },
  { key: 'too_busy',     labelKey: 'partner.orders.reject_too_busy' },
];

export default function OrderQueueScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const soundRef = useRef<Audio.Sound | null>(null);
  const isDz = i18n.language === 'dz';

  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const { data: orders = [], refetch } = useQuery({
    queryKey: ['partner-orders', activeTab],
    queryFn: () =>
      partnerApi
        .get('/partner/orders', { params: { status: activeTab === 'active' ? ACTIVE_STATUSES.join(',') : 'delivered,cancelled' } })
        .then((r) => r.data.data as Order[]),
    refetchInterval: activeTab === 'active' ? 10_000 : false,
  });

  const prevOrderCount = useRef(0);

  // Alert on new orders
  useEffect(() => {
    const newCount = orders.filter((o) => o.status === 'pending').length;
    if (newCount > prevOrderCount.current) {
      playNewOrderAlert();
      Vibration.vibrate([0, 500, 200, 500]);
    }
    prevOrderCount.current = newCount;
  }, [orders]);

  async function playNewOrderAlert() {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/new_order.mp3'),
        );
        soundRef.current = sound;
      }
      await soundRef.current.replayAsync();
    } catch (err) {
      console.error('Sound error:', err);
    }
  }

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status, reason }: { orderId: string; status: OrderStatus; reason?: string }) =>
      partnerApi.patch(`/partner/orders/${orderId}/status`, { status, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partner-orders'] }),
  });

  function handleAccept(order: Order) {
    Alert.alert(
      t('partner.orders.accept'),
      `${t('common.nu')} ${order.total_nu} — ${order.items?.length ?? 0} ${t('orders.items_count', { count: order.items?.length ?? 0 })}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('partner.orders.accept'),
          onPress: () => updateStatus.mutate({ orderId: order.id, status: 'confirmed' }),
        },
      ],
    );
  }

  function handleReject(order: Order) {
    Alert.alert(
      t('partner.orders.reject'),
      t('partner.orders.reject_reason'),
      [
        ...REJECT_REASONS.map((r) => ({
          text: t(r.labelKey),
          onPress: () => updateStatus.mutate({ orderId: order.id, status: 'cancelled', reason: r.key }),
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  }

  function getNextAction(order: Order): { label: string; status: OrderStatus } | null {
    const map: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
      confirmed:  { label: t('partner.orders.mark_preparing'), status: 'preparing' },
      preparing:  { label: t('partner.orders.mark_ready'),     status: 'ready' },
    };
    return map[order.status] ?? null;
  }

  function renderOrderCard({ item: order }: { item: Order }) {
    const isPending = order.status === 'pending';
    const nextAction = getNextAction(order);

    return (
      <View style={[styles.orderCard, isPending && styles.orderCardNew]}>
        {/* Header */}
        <View style={styles.orderHeader}>
          <View>
            <ZhimText variant="h3">#{order.order_number}</ZhimText>
            <ZhimText variant="caption" muted>
              {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {order.estimated_prep_min} {t('common.min')} {t('restaurant.avg_prep_time', { min: '' })}
            </ZhimText>
          </View>
          <View style={styles.statusPill}>
            <ZhimText variant="caption" color={colors.primary[600]} dzongkha={isDz}>
              {order.status.replace('_', ' ').toUpperCase()}
            </ZhimText>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <ZhimText variant="body">
                {item.quantity}× {isDz && item.name_dz ? item.name_dz : item.name}
              </ZhimText>
              {item.special_note && (
                <ZhimText variant="caption" color={colors.warning}>
                  ⚠ {item.special_note}
                </ZhimText>
              )}
            </View>
          ))}
        </View>

        {/* Customer note */}
        {order.customer_note && (
          <View style={styles.noteBlock}>
            <ZhimText variant="caption" muted>💬 {order.customer_note}</ZhimText>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <ZhimText variant="bodySmall" muted>
            {order.payment_method === 'cod' ? '💵 COD' : `📱 ${order.payment_method.toUpperCase()}`}
            {order.change_required_nu ? ` · Change: Nu. ${order.change_required_nu}` : ''}
          </ZhimText>
          <NuBadge amount={order.total_nu} size="lg" />
        </View>

        {/* Actions */}
        {isPending && (
          <View style={styles.pendingActions}>
            <ZhimButton
              label={t('partner.orders.accept')}
              onPress={() => handleAccept(order)}
              variant="primary"
              size="md"
              style={{ flex: 1 }}
            />
            <ZhimButton
              label={t('partner.orders.reject')}
              onPress={() => handleReject(order)}
              variant="outline"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        )}

        {nextAction && !isPending && (
          <ZhimButton
            label={nextAction.label}
            onPress={() => updateStatus.mutate({ orderId: order.id, status: nextAction.status })}
            variant="secondary"
            size="md"
            fullWidth
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ZhimText variant="h2" dzongkha={isDz}>{t('partner.orders.title')}</ZhimText>
        <TouchableOpacity
          style={[styles.pauseBtn, isPaused && styles.pauseBtnActive]}
          onPress={() => setIsPaused(!isPaused)}
        >
          <ZhimText variant="caption" color={isPaused ? colors.error : colors.text}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </ZhimText>
        </TouchableOpacity>
      </View>

      {isPaused && (
        <View style={styles.pausedBanner}>
          <ZhimText variant="label" color={colors.error} dzongkha={isDz}>
            {t('partner.orders.auto_pause_title')}
          </ZhimText>
          <ZhimText variant="caption" color={colors.error} dzongkha={isDz}>
            {t('partner.orders.auto_pause_body')}
          </ZhimText>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['active', 'past'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <ZhimText
              variant="label"
              color={activeTab === tab ? colors.primary[500] : colors.textMuted}
            >
              {tab === 'active' ? t('orders.active') : t('orders.past')}
            </ZhimText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderOrderCard}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ZhimText variant="h3">🍽️</ZhimText>
            <ZhimText variant="body" muted dzongkha={isDz}>
              {t('partner.orders.empty_queue')}
            </ZhimText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  pauseBtn: {
    backgroundColor: colors.bgMuted,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pauseBtnActive: { borderColor: colors.error, backgroundColor: colors.error + '15' },

  pausedBanner: {
    backgroundColor: colors.error + '10',
    borderBottomWidth: 2,
    borderBottomColor: colors.error,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  tab: { flex: 1, paddingVertical: spacing[3], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary[500] },

  orderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: spacing[3],
    ...shadows.md,
  },
  orderCardNew: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusPill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },

  itemsList: { gap: spacing[1] },
  itemRow: { gap: 2 },

  noteBlock: {
    backgroundColor: colors.bgMuted,
    borderRadius: radii.sm,
    padding: spacing[2],
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  pendingActions: { flexDirection: 'row', gap: spacing[3] },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
});
