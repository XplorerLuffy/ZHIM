import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ZhimText, NuBadge, colors, spacing, radii, shadows } from '@zhim/ui';
import type { Restaurant, CuisineType } from '@zhim/types';
import { useAddressStore } from '../../store/address.store';
import { useAuthStore } from '../../store/auth.store';
import { RestaurantCard } from '../../components/RestaurantCard';
import { SurgeBanner } from '../../components/SurgeBanner';
import { api } from '../../api/client';

const CUISINE_FILTERS: { key: CuisineType | 'all'; labelKey: string; emoji: string }[] = [
  { key: 'all',        labelKey: 'home.all_cuisines', emoji: '🍽️' },
  { key: 'bhutanese',  labelKey: 'home.bhutanese',   emoji: '🫕' },
  { key: 'fast_food',  labelKey: 'home.fast_food',    emoji: '🍔' },
  { key: 'indian_north',labelKey: 'home.indian',      emoji: '🍛' },
  { key: 'tibetan',    labelKey: 'restaurant.menu',   emoji: '🥟' },
  { key: 'bakery',     labelKey: 'home.all_cuisines', emoji: '🥐' },
];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const defaultAddress = useAddressStore((s) => s.defaultAddress);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCuisine, setActiveCuisine] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['restaurants', defaultAddress?.zone_id, activeCuisine, vegOnly],
    queryFn: () =>
      api.get('/restaurants', {
        params: {
          zone_id: defaultAddress?.zone_id,
          cuisine: activeCuisine === 'all' ? undefined : activeCuisine,
          veg_only: vegOnly || undefined,
          lat: defaultAddress?.location.lat,
          lng: defaultAddress?.location.lng,
        },
      }).then((r) => r.data.data as Restaurant[]),
    enabled: !!defaultAddress,
  });

  const { data: activeSurge } = useQuery({
    queryKey: ['surge', defaultAddress?.zone_id],
    queryFn: () =>
      api.get(`/zones/${defaultAddress?.zone_id}/surge`).then((r) => r.data.data),
    enabled: !!defaultAddress?.zone_id,
    refetchInterval: 60_000,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.good_morning');
    if (hour < 17) return t('home.good_afternoon');
    return t('home.good_evening');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const featuredRestaurants = data?.filter((r) => r.avg_rating >= 4.5).slice(0, 5) ?? [];
  const allRestaurants = data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ZhimText variant="bodySmall" muted dzongkha={i18n.language === 'dz'}>
            {greeting()}, {user?.name?.split(' ')[0] ?? ''}
          </ZhimText>
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => router.push('/address/select')}
          >
            <ZhimText variant="h3" numberOfLines={1} style={styles.addressText}>
              {defaultAddress
                ? defaultAddress.nearest_landmark
                : t('address.title')}
            </ZhimText>
            <ZhimText variant="caption" color={colors.primary[500]}>
              {' '}▼
            </ZhimText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.karmaChip}
          onPress={() => router.push('/profile/karma')}
        >
          <ZhimText variant="caption" color={colors.primary[600]}>
            🌸 {user?.karma_points ?? 0}
          </ZhimText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.9}
        >
          <ZhimText variant="bodySmall" color={colors.textLight}>
            🔍  {t('home.search_placeholder')}
          </ZhimText>
        </TouchableOpacity>

        {/* Surge banner */}
        {activeSurge?.is_active && (
          <SurgeBanner
            message={i18n.language === 'dz' ? activeSurge.message_dz : activeSurge.message_en}
            extraFee={activeSurge.extra_fee_nu}
          />
        )}

        {/* Cuisine filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[2] }}
        >
          {CUISINE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                activeCuisine === f.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveCuisine(f.key)}
            >
              <ZhimText
                variant="bodySmall"
                color={activeCuisine === f.key ? colors.white : colors.text}
              >
                {f.emoji} {t(f.labelKey)}
              </ZhimText>
            </TouchableOpacity>
          ))}

          {/* Veg toggle */}
          <TouchableOpacity
            style={[styles.filterChip, vegOnly && styles.filterChipVeg]}
            onPress={() => setVegOnly(!vegOnly)}
          >
            <ZhimText
              variant="bodySmall"
              color={vegOnly ? colors.white : colors.veg}
            >
              🥦 {t('home.veg_only')}
            </ZhimText>
          </TouchableOpacity>
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={colors.primary[500]} style={{ marginTop: spacing[10] }} />
        ) : (
          <>
            {/* Featured section */}
            {featuredRestaurants.length > 0 && (
              <View style={styles.section}>
                <ZhimText variant="h2" style={styles.sectionTitle}>
                  {t('home.featured')} ⭐
                </ZhimText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
                >
                  {featuredRestaurants.map((r) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      variant="horizontal"
                      onPress={() => router.push(`/restaurant/${r.slug}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* All restaurants */}
            <View style={styles.section}>
              <ZhimText variant="h2" style={styles.sectionTitle}>
                {t('home.popular_near_you')}
              </ZhimText>
              {allRestaurants.length === 0 ? (
                <View style={styles.emptyState}>
                  <ZhimText variant="h3">🏔️</ZhimText>
                  <ZhimText variant="body" muted style={{ textAlign: 'center' }}>
                    {t('home.no_restaurants')}
                  </ZhimText>
                </View>
              ) : (
                allRestaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    variant="vertical"
                    onPress={() => router.push(`/restaurant/${r.slug}`)}
                  />
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 260,
  },
  addressText: { flexShrink: 1 },

  karmaChip: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },

  searchBar: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...shadows.sm,
  },

  filterRow: { marginVertical: spacing[2] },
  filterChip: {
    backgroundColor: colors.bgMuted,
    borderRadius: radii.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  filterChipActive: { backgroundColor: colors.primary[500] },
  filterChipVeg:   { backgroundColor: colors.veg },

  section: { marginTop: spacing[4] },
  sectionTitle: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
});
