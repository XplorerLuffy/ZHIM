import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZhimText, ZhimButton, NuBadge, colors, spacing, radii, shadows } from '@zhim/ui';
import type { PaymentMethod, DeliveryType } from '@zhim/types';
import { useCartStore } from '../../store/cart.store';
import { useAddressStore } from '../../store/address.store';
import { api } from '../../api/client';
import { PaymentMethodSheet } from '../../components/PaymentMethodSheet';
import { SurgeBanner } from '../../components/SurgeBanner';

const PAYMENT_METHODS: { method: PaymentMethod; label: string; labelDz: string; icon: string }[] = [
  { method: 'cod',     label: 'Cash on Delivery',  labelDz: 'སྒོར་མོ་ལག་ལེན།', icon: '💵' },
  { method: 'mbob',    label: 'mBoB',               labelDz: 'མི་བོབ།',           icon: '📱' },
  { method: 'mypay',   label: 'MyPay',              labelDz: 'མའི་པེ།',           icon: '📲' },
  { method: 'bob_qr',  label: 'BoB QR',             labelDz: 'BoB QR',            icon: '🔲' },
  { method: 'bnb_pay', label: 'BNB Pay',            labelDz: 'BNB པེ།',           icon: '🏦' },
];

export default function CheckoutScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const cart = useCartStore();
  const defaultAddress = useAddressStore((s) => s.defaultAddress);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('asap');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [codChangeAmount, setCodChangeAmount] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [useKarma, setUseKarma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const isDz = i18n.language === 'dz';

  async function handlePlaceOrder() {
    if (!defaultAddress) {
      Alert.alert(t('errors.generic'), t('checkout.delivery_address'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/orders', {
        restaurant_id: cart.restaurant_id,
        delivery_address_id: defaultAddress.id,
        delivery_type: deliveryType,
        scheduled_for: scheduledTime?.toISOString(),
        items: cart.items.map((item) => ({
          menu_item_id: item.menu_item_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          spice_level: item.spice_level,
          addons: item.addons.map((a) => ({ addon_id: a.addon_id, quantity: a.quantity })),
          special_note: item.special_note,
        })),
        payment_method: paymentMethod,
        karma_points_used: useKarma ? cart.karma_points_used : 0,
        customer_note: customerNote || undefined,
        change_required_nu: paymentMethod === 'cod' && codChangeAmount
          ? parseInt(codChangeAmount)
          : undefined,
      });

      const order = response.data.data;

      if (paymentMethod !== 'cod') {
        // Navigate to payment screen with intent
        const intentRes = await api.post(`/payments/initiate`, {
          order_id: order.id,
          method: paymentMethod,
        });
        router.replace({
          pathname: '/payment',
          params: { orderId: order.id, paymentId: intentRes.data.data.payment_id },
        });
      } else {
        // COD — go straight to tracking
        cart.clear();
        router.replace({ pathname: '/tracking', params: { orderId: order.id } });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? t('errors.generic');
      Alert.alert(t('errors.generic'), msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedPayment = PAYMENT_METHODS.find((p) => p.method === paymentMethod)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <ZhimText variant="h2">←</ZhimText>
        </TouchableOpacity>
        <ZhimText variant="h2" dzongkha={isDz}>{t('checkout.title')}</ZhimText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Surge banner if active */}
        {cart.surge_fee_nu > 0 && (
          <SurgeBanner
            message={cart.surge_message_en ?? ''}
            extraFee={cart.surge_fee_nu}
          />
        )}

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ZhimText variant="h3" dzongkha={isDz}>{t('checkout.delivery_address')}</ZhimText>
            <TouchableOpacity onPress={() => router.push('/address/select')}>
              <ZhimText variant="label" color={colors.primary[500]}>{t('checkout.change')}</ZhimText>
            </TouchableOpacity>
          </View>
          {defaultAddress ? (
            <View style={styles.addressBlock}>
              <ZhimText variant="body" bold>
                📍 {isDz && defaultAddress.landmark_dz
                  ? defaultAddress.landmark_dz
                  : defaultAddress.nearest_landmark}
              </ZhimText>
              {defaultAddress.building_desc && (
                <ZhimText variant="bodySmall" muted>{defaultAddress.building_desc}</ZhimText>
              )}
            </View>
          ) : (
            <ZhimButton
              label={t('checkout.add_address')}
              onPress={() => router.push('/address/add')}
              variant="outline"
              size="sm"
            />
          )}
        </View>

        {/* Delivery time */}
        <View style={styles.card}>
          <ZhimText variant="h3" dzongkha={isDz} style={{ marginBottom: spacing[3] }}>
            {t('checkout.delivery_time')}
          </ZhimText>
          <View style={styles.deliveryTypeRow}>
            {(['asap', 'scheduled'] as DeliveryType[]).map((dt) => (
              <TouchableOpacity
                key={dt}
                style={[styles.deliveryTypeBtn, deliveryType === dt && styles.deliveryTypeBtnActive]}
                onPress={() => setDeliveryType(dt)}
              >
                <ZhimText
                  variant="bodySmall"
                  color={deliveryType === dt ? colors.white : colors.text}
                  dzongkha={isDz}
                >
                  {dt === 'asap' ? t('checkout.asap') : t('checkout.scheduled')}
                </ZhimText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <ZhimText variant="h3" dzongkha={isDz} style={{ marginBottom: spacing[3] }}>
            {t('checkout.payment_method')}
          </ZhimText>

          <TouchableOpacity
            style={styles.paymentSelector}
            onPress={() => setShowPaymentSheet(true)}
          >
            <ZhimText variant="body">
              {selectedPayment.icon}{' '}
              {isDz ? selectedPayment.labelDz : selectedPayment.label}
            </ZhimText>
            <ZhimText variant="body">›</ZhimText>
          </TouchableOpacity>

          {paymentMethod === 'cod' && (
            <View style={styles.codSection}>
              <ZhimText variant="bodySmall" muted dzongkha={isDz}>
                {t('checkout.cod_hint')}
              </ZhimText>
              <View style={styles.codChangeRow}>
                <ZhimText variant="label" dzongkha={isDz}>
                  {t('checkout.cod_change')}
                </ZhimText>
                <TextInput
                  style={styles.codInput}
                  keyboardType="numeric"
                  value={codChangeAmount}
                  onChangeText={setCodChangeAmount}
                  placeholder={t('checkout.cod_change_hint')}
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>
          )}
        </View>

        {/* Delivery note */}
        <View style={styles.card}>
          <ZhimText variant="h3" dzongkha={isDz} style={{ marginBottom: spacing[2] }}>
            {t('checkout.order_note')}
          </ZhimText>
          <TextInput
            style={styles.noteInput}
            multiline
            value={customerNote}
            onChangeText={setCustomerNote}
            placeholder={t('checkout.order_note_placeholder')}
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Bill summary */}
        <View style={styles.card}>
          <BillRow label={t('cart.subtotal')} amount={cart.subtotal_nu} />
          <BillRow label={t('cart.delivery_fee')} amount={cart.delivery_fee_nu} />
          {cart.surge_fee_nu > 0 && (
            <BillRow label={t('cart.surge_fee')} amount={cart.surge_fee_nu} color={colors.warning} />
          )}
          {cart.discount_nu > 0 && (
            <BillRow label={t('cart.discount')} amount={-cart.discount_nu} color={colors.secondary[500]} />
          )}
          <View style={styles.divider} />
          <BillRow label={t('cart.total')} amount={cart.total_nu} bold />
        </View>

        <ZhimText variant="caption" muted style={styles.termsNote} dzongkha={isDz}>
          {t('checkout.terms_note')}
        </ZhimText>

        <View style={{ height: spacing[6] }} />
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[2] }]}>
        <ZhimButton
          label={t('checkout.place_order', { total: cart.total_nu })}
          onPress={handlePlaceOrder}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        />
      </View>

      <PaymentMethodSheet
        visible={showPaymentSheet}
        selected={paymentMethod}
        methods={PAYMENT_METHODS}
        isDz={isDz}
        onSelect={(m) => { setPaymentMethod(m); setShowPaymentSheet(false); }}
        onClose={() => setShowPaymentSheet(false)}
      />
    </View>
  );
}

function BillRow({ label, amount, color, bold }: { label: string; amount: number; color?: string; bold?: boolean }) {
  return (
    <View style={styles.billRow}>
      <ZhimText variant={bold ? 'h3' : 'body'} color={color}>{label}</ZhimText>
      <NuBadge amount={Math.abs(amount)} color={color} size={bold ? 'lg' : 'md'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },

  card: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderRadius: radii.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  addressBlock: { gap: spacing[1] },

  deliveryTypeRow: { flexDirection: 'row', gap: spacing[2] },
  deliveryTypeBtn: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingVertical: spacing[2] + 2,
    alignItems: 'center',
  },
  deliveryTypeBtnActive: { backgroundColor: colors.primary[500] },

  paymentSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  codSection: { marginTop: spacing[3], gap: spacing[2] },
  codChangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codInput: {
    backgroundColor: colors.bgMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    width: 130,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },

  noteInput: {
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 72,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing[2],
  },

  termsNote: { textAlign: 'center', marginTop: spacing[3], paddingHorizontal: spacing[6] },

  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    ...shadows.lg,
  },
});
