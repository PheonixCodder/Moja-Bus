import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Sorting01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import { BottomTabInset } from '@/constants/theme';
import { NotificationBell } from '@/components/notification-bell';
import { authClient } from '@/lib/auth-client';
import {
  buildSearchReturnTo,
  usePendingCheckoutStore,
} from '@/stores/pending-checkout';
import { useTRPC } from '@/lib/trpc';
import { formatLocationLabel } from '@/lib/format-location-label';
import { SearchForm } from '../components/search-form';
import { SearchMapView } from '../components/search-map-view';
import { CitySearchField } from '../components/city-search-field';
import { DateStrip } from '../components/date-strip';
import { OfferCard, type Offer } from '../components/offer-card';
import { SearchSkeleton } from '../components/search-skeleton';
import { SearchEmptyState } from '../components/search-empty-state';
import { SortSheet } from '../components/sort-sheet';
import { FiltersSheet } from '../components/filters-sheet';
import { SeatSelectionSheet } from '../components/seat-selection-sheet';
import { PassengerFormSheet } from '../components/passenger-form-sheet';
import { useSearchTrips } from '../hooks/use-search-trips';
import { useSearchPrefetch } from '../hooks/use-search-prefetch';
import { useSearchFilters } from '../hooks/use-search-filters';
import type { CityValue, SortKey } from '../types';
import { toLocalISODate } from '../lib/format';
import { validateSearchPair } from '../lib/validate-search-pair';

const SHEET_RADIUS = 24;
const DRAG_HANDLE_HEIGHT = 32;

export function SearchView() {
  const router = useRouter();
  const trpc = useTRPC();
  const { prefetchSeatAvailability } = useSearchPrefetch();
  const { data: session } = authClient.useSession();
  const { pending, setPending, clearPending, _hasHydrated } = usePendingCheckoutStore();

  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // ── Snap points (stored in a ref so PanResponder always sees latest) ──
  const snapRef = useRef({
    top: 60,
    half: Math.round(screenHeight * 0.4),
    peek: Math.round(screenHeight - 120),
  });

  useEffect(() => {
    snapRef.current = {
      top: Math.max(insets.top + 40, 60),
      half: Math.round(screenHeight * 0.4),
      peek: Math.round(screenHeight - (BottomTabInset + insets.bottom + 120)),
    };
  }, [insets.top, insets.bottom, screenHeight]);

  // ── Search params from navigation ──
  const searchRouteParams = useLocalSearchParams<{
    from?: string;
    fromText?: string;
    fromMuni?: string;
    fromQuarter?: string;
    to?: string;
    toText?: string;
    toMuni?: string;
    toQuarter?: string;
    date?: string;
    passengers?: string;
    /** Company DB id — filters search results to this operator */
    operatorId?: string;
    /** Human-readable name (used for display only) */
    operatorName?: string;
  }>();

  // ── Search state ──
  const [origin, setOrigin] = useState<CityValue | null>(null);
  const [destination, setDestination] = useState<CityValue | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sort, setSort] = useState<SortKey>('BEST');
  const [page, setPage] = useState(1);
  const { filters, setFilters, clearFilters, activeFilterCount } = useSearchFilters();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const prevCriteriaKey = useRef('');
  const restoredCheckoutRef = useRef(false);

  // Deep-link label resolution when fromText/toText is missing or equals the id
  const needsOriginLabel =
    !!searchRouteParams.from &&
    (!searchRouteParams.fromText || searchRouteParams.fromText === searchRouteParams.from);
  const needsDestLabel =
    !!searchRouteParams.to &&
    (!searchRouteParams.toText || searchRouteParams.toText === searchRouteParams.to);
  const originHasGeo = !!(searchRouteParams.fromMuni || searchRouteParams.fromQuarter);
  const destHasGeo = !!(searchRouteParams.toMuni || searchRouteParams.toQuarter);

  const { data: originGeoLabel } = useQuery({
    ...trpc.locations.getGeoPlaceLabel.queryOptions({
      cityId: searchRouteParams.from ?? '',
      municipalityId: searchRouteParams.fromMuni || undefined,
      quarterId: searchRouteParams.fromQuarter || undefined,
    }),
    enabled: needsOriginLabel && originHasGeo,
  });
  const { data: originCityDetails } = useQuery({
    ...trpc.locations.getCityDetails.queryOptions({ id: searchRouteParams.from ?? '' }),
    enabled: needsOriginLabel && !originHasGeo,
  });
  const { data: destGeoLabel } = useQuery({
    ...trpc.locations.getGeoPlaceLabel.queryOptions({
      cityId: searchRouteParams.to ?? '',
      municipalityId: searchRouteParams.toMuni || undefined,
      quarterId: searchRouteParams.toQuarter || undefined,
    }),
    enabled: needsDestLabel && destHasGeo,
  });
  const { data: destCityDetails } = useQuery({
    ...trpc.locations.getCityDetails.queryOptions({ id: searchRouteParams.to ?? '' }),
    enabled: needsDestLabel && !destHasGeo,
  });

  // ── Modal states ──
  const [activeCityField, setActiveCityField] = useState<'origin' | 'destination' | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [sortVisible, setSortVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [passengerFormVisible, setPassengerFormVisible] = useState(false);

  const dateStr = toLocalISODate(date);

  // ── Bottom sheet animation ──
  const sheetY = useRef(new Animated.Value(Math.round(screenHeight * 0.4))).current;
  const currentY = useRef(Math.round(screenHeight * 0.4));

  useEffect(() => {
    const id = sheetY.addListener(({ value }) => {
      currentY.current = value;
    });
    return () => sheetY.removeListener(id);
  }, [sheetY]);

  const snapTo = useCallback(
    (target: 'top' | 'half' | 'peek') => {
      Animated.spring(sheetY, {
        toValue: snapRef.current[target],
        useNativeDriver: false,
        damping: 24,
        stiffness: 240,
        mass: 0.85,
      }).start();
    },
    [sheetY]
  );

  // Allow a second guest→login resume in the same SearchView mount
  useEffect(() => {
    if (!session?.user) restoredCheckoutRef.current = false;
  }, [session?.user]);

  // ── Restore pending checkout after login (wait for AsyncStorage rehydrate) ──
  useEffect(() => {
    if (!_hasHydrated || !session?.user || !pending || restoredCheckoutRef.current) return;
    restoredCheckoutRef.current = true;

    const snapshot = pending.search;
    if (snapshot?.origin && snapshot?.destination) {
      setOrigin(snapshot.origin);
      setDestination(snapshot.destination);
      if (snapshot.date) {
        const [y, m, d] = snapshot.date.split('-').map(Number);
        if (y && m && d) setDate(new Date(y, m - 1, d));
      }
      setPassengers(snapshot.passengers);
      if (snapshot.sort) setSort(snapshot.sort);
      if (snapshot.filters) setFilters(snapshot.filters);
      setIsSubmitted(true);
      setPage(1);
      snapTo('top');
    }

    setSelectedOffer(pending.offer);
    setSelectedSeatIds(pending.seatIds);
    setPassengers(pending.passengers);
    setPassengerFormVisible(true);
    clearPending();
  }, [_hasHydrated, session?.user, pending, clearPending, setFilters, snapTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
      onPanResponderGrant: () => {
        sheetY.setOffset(currentY.current);
        sheetY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: sheetY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        sheetY.flattenOffset();
        const { top, half, peek } = snapRef.current;
        const snaps = [top, half, peek];
        const velocity = gs.vy;
        let target: number;

        // If flicked strongly, follow the fling direction
        if (velocity < -0.8) {
          target = top;
        } else if (velocity > 0.8) {
          target = peek;
        } else {
          // Snap to nearest
          target = snaps.reduce((prev, curr) =>
            Math.abs(curr - currentY.current) < Math.abs(prev - currentY.current)
              ? curr
              : prev
          );
        }

        Animated.spring(sheetY, {
          toValue: target,
          useNativeDriver: false,
          damping: 24,
          stiffness: 240,
          mass: 0.85,
          velocity: gs.vy * 1000,
        }).start();
      },
    })
  ).current;

  // ── tRPC query ──
  const { data: tripResults, isLoading, isFetching } = useSearchTrips(
    origin?.id ?? '',
    destination?.id ?? '',
    origin?.municipalityId ?? '',
    destination?.municipalityId ?? '',
    origin?.quarterId ?? '',
    destination?.quarterId ?? '',
    dateStr,
    passengers,
    filters,
    sort,
    page
  );

  const offers: Offer[] = useMemo(() => {
    if (!tripResults?.offers) return [];
    return tripResults.offers.map((o) => ({
      id: o.offerId,
      companyId: o.companyId,
      operatorName: o.companyName,
      isExpress: o.isExpress,
      busClass:
        o.seatClass === 'VIP' ? 'VIP' : o.seatClass === 'STANDARD' ? 'Standard' : 'Economy',
      busTypeName: o.busTypeName,
      departureTime: new Date(o.departureTime).toLocaleTimeString('fr-CI', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      }),
      departureTerminal: o.originTerminalName,
      departureCity: o.originCityName,
      departureMunicipality: o.originMunicipalityName,
      departureQuarter: o.originQuarterName,
      arrivalTime: new Date(o.arrivalTime).toLocaleTimeString('fr-CI', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      }),
      arrivalTerminal: o.destinationTerminalName,
      arrivalCity: o.destinationCityName,
      arrivalMunicipality: o.destinationMunicipalityName,
      arrivalQuarter: o.destinationQuarterName,
      duration: `${Math.floor(o.durationMinutes / 60)}h ${o.durationMinutes % 60}m`,
      stopCount: o.stopCount,
      priceXOF: o.priceXOF,
      availability:
        o.availability.status === 'SOLD_OUT'
          ? 'SOLD_OUT'
          : o.availability.status === 'FEW_LEFT'
            ? 'FEW_LEFT'
            : 'AVAILABLE',
      remainingSeats: o.availability.remaining,
      amenities: o.amenities,
      serviceType: o.serviceType,
    }));
  }, [tripResults]);

  // Accumulate pages like web search-page-client (reset when criteria change)
  const criteriaKey = [
    origin?.id,
    destination?.id,
    origin?.municipalityId,
    destination?.municipalityId,
    origin?.quarterId,
    destination?.quarterId,
    dateStr,
    passengers,
    filters.operators.join(','),
    filters.amenities.join(','),
    filters.departureTime.join(','),
    filters.seatClass.join(','),
    filters.isExpress ? 'express' : '',
    sort,
  ].join('|');

  useEffect(() => {
    if (!tripResults?.offers) return;
    if (criteriaKey !== prevCriteriaKey.current) {
      prevCriteriaKey.current = criteriaKey;
      setAllOffers(offers);
      return;
    }
    setAllOffers((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const fresh = offers.filter((o) => !existingIds.has(o.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [tripResults, offers, criteriaKey]);

  const activeOperators = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const o of allOffers) {
      if (o.companyId) map.set(o.companyId, { id: o.companyId, name: o.operatorName });
    }
    return Array.from(map.values());
  }, [allOffers]);

  const isPreSearch = !isSubmitted || !origin || !destination;

  // Sync navigation route params to search state when passed from home page or link
  useEffect(() => {
    const hasCities = searchRouteParams.from && searchRouteParams.to;
    const hasOperatorOnly = !hasCities && searchRouteParams.operatorId;

    if (hasCities) {
      const nextOrigin: CityValue = {
        id: searchRouteParams.from!,
        text: searchRouteParams.fromText || searchRouteParams.from!,
        municipalityId: searchRouteParams.fromMuni,
        quarterId: searchRouteParams.fromQuarter,
      };
      const nextDest: CityValue = {
        id: searchRouteParams.to!,
        text: searchRouteParams.toText || searchRouteParams.to!,
        municipalityId: searchRouteParams.toMuni,
        quarterId: searchRouteParams.toQuarter,
      };
      setOrigin(nextOrigin);
      setDestination(nextDest);
      if (searchRouteParams.date) {
        const [y, m, d] = searchRouteParams.date.split('-').map(Number);
        if (y && m && d) setDate(new Date(y, m - 1, d));
      }
      if (searchRouteParams.passengers) {
        const p = parseInt(searchRouteParams.passengers, 10);
        if (!isNaN(p)) setPassengers(Math.min(6, Math.max(1, p)));
      }

      if (validateSearchPair(nextOrigin, nextDest) === null) {
        setIsSubmitted(true);
        snapTo('top');
      }
    }

    // Pre-set the operator filter whenever an operatorId param is present
    if (searchRouteParams.operatorId) {
      setFilters((prev) => ({
        ...prev,
        operators: [searchRouteParams.operatorId!],
      }));
    }

    if (hasOperatorOnly) {
      setIsSubmitted(true);
      snapTo('top');
    }
  }, [
    searchRouteParams.from,
    searchRouteParams.fromText,
    searchRouteParams.fromMuni,
    searchRouteParams.fromQuarter,
    searchRouteParams.to,
    searchRouteParams.toText,
    searchRouteParams.toMuni,
    searchRouteParams.toQuarter,
    searchRouteParams.date,
    searchRouteParams.passengers,
    searchRouteParams.operatorId,
    snapTo,
    setFilters,
  ]);

  // Resolve weak deep-link labels once city/geo data arrives
  useEffect(() => {
    if (!needsOriginLabel || !searchRouteParams.from) return;
    const fromId = searchRouteParams.from;
    if (originHasGeo && originGeoLabel) {
      const text = formatLocationLabel({
        cityName: originGeoLabel.cityName,
        municipalityName: originGeoLabel.municipalityName,
        quarterName: originGeoLabel.quarterName,
        isUrban: !!(searchRouteParams.fromMuni || searchRouteParams.fromQuarter),
      });
      setOrigin((prev) => (prev?.id === fromId ? { ...prev, text } : prev));
    } else if (!originHasGeo && originCityDetails?.name) {
      const text = originCityDetails.name;
      setOrigin((prev) =>
        prev?.id === fromId
          ? { ...prev, id: originCityDetails.id ?? fromId, text }
          : prev,
      );
    }
  }, [
    needsOriginLabel,
    originHasGeo,
    originGeoLabel,
    originCityDetails,
    searchRouteParams.from,
  ]);

  useEffect(() => {
    if (!needsDestLabel || !searchRouteParams.to) return;
    const toId = searchRouteParams.to;
    if (destHasGeo && destGeoLabel) {
      const text = formatLocationLabel({
        cityName: destGeoLabel.cityName,
        municipalityName: destGeoLabel.municipalityName,
        quarterName: destGeoLabel.quarterName,
        isUrban: !!(searchRouteParams.toMuni || searchRouteParams.toQuarter),
      });
      setDestination((prev) => (prev?.id === toId ? { ...prev, text } : prev));
    } else if (!destHasGeo && destCityDetails?.name) {
      const text = destCityDetails.name;
      setDestination((prev) =>
        prev?.id === toId
          ? { ...prev, id: destCityDetails.id ?? toId, text }
          : prev,
      );
    }
  }, [
    needsDestLabel,
    destHasGeo,
    destGeoLabel,
    destCityDetails,
    searchRouteParams.to,
  ]);

  // Auto-search when both cities are set — automatically expand overlay to full top position
  useEffect(() => {
    if (!origin || !destination) return;
    if (validateSearchPair(origin, destination) !== null) return;
    setIsSubmitted(true);
    setPage(1);
    snapTo('top');
  }, [origin?.id, destination?.id, origin?.municipalityId, destination?.municipalityId, origin?.quarterId, destination?.quarterId]);

  // Keep route params in sync with submitted search criteria (shareable / back-nav)
  useEffect(() => {
    if (!isSubmitted || !origin || !destination) return;

    const norm = (v?: string) => (v && v.length > 0 ? v : undefined);
    const next = {
      from: origin.id,
      fromText: origin.text,
      to: destination.id,
      toText: destination.text,
      date: dateStr,
      passengers: String(passengers),
      fromMuni: norm(origin.municipalityId),
      fromQuarter: norm(origin.quarterId),
      toMuni: norm(destination.municipalityId),
      toQuarter: norm(destination.quarterId),
    };

    const differs =
      searchRouteParams.from !== next.from ||
      searchRouteParams.fromText !== next.fromText ||
      searchRouteParams.to !== next.to ||
      searchRouteParams.toText !== next.toText ||
      searchRouteParams.date !== next.date ||
      searchRouteParams.passengers !== next.passengers ||
      norm(searchRouteParams.fromMuni) !== next.fromMuni ||
      norm(searchRouteParams.fromQuarter) !== next.fromQuarter ||
      norm(searchRouteParams.toMuni) !== next.toMuni ||
      norm(searchRouteParams.toQuarter) !== next.toQuarter;

    if (differs) {
      router.setParams(next);
    }
  }, [
    isSubmitted,
    origin?.id,
    origin?.text,
    origin?.municipalityId,
    origin?.quarterId,
    destination?.id,
    destination?.text,
    destination?.municipalityId,
    destination?.quarterId,
    dateStr,
    passengers,
    searchRouteParams.from,
    searchRouteParams.fromText,
    searchRouteParams.fromMuni,
    searchRouteParams.fromQuarter,
    searchRouteParams.to,
    searchRouteParams.toText,
    searchRouteParams.toMuni,
    searchRouteParams.toQuarter,
    searchRouteParams.date,
    searchRouteParams.passengers,
    router,
  ]);

  const handleSearch = useCallback(() => {
    if (!origin || !destination) return;
    if (validateSearchPair(origin, destination) !== null) {
      Alert.alert(t('sameCity'));
      return;
    }
    setIsSubmitted(true);
    setPage(1);
    snapTo('top');
  }, [origin, destination, snapTo, t]);

  const handleCitySelect = (city: CityValue) => {
    if (activeCityField === 'origin') setOrigin(city);
    else setDestination(city);
    setActiveCityField(null);
    setCityQuery('');
  };

  const handleSwapCities = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    if (isSubmitted) setPage(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* ═══════════════════════════════════════
          BACKGROUND LAYER — Full-Screen Map
          ═══════════════════════════════════════ */}
      <SearchMapView
        originName={origin?.text}
        destinationName={destination?.text}
      />

      {/* Floating Notification Bell Chip */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 16,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <NotificationBell />
      </View>

      {/* ═══════════════════════════════════════
          BOTTOM SHEET — draggable results panel
          ═══════════════════════════════════════ */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: sheetY,
          bottom: 0,
          backgroundColor: '#fff',
          borderTopLeftRadius: SHEET_RADIUS,
          borderTopRightRadius: SHEET_RADIUS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 16,
        }}
      >
        {/* ── DRAGGABLE HEADER AREA (entire upper section acts as drag target) ── */}
        <View {...panResponder.panHandlers}>
          {/* Drag Handle Bar */}
          <View
            style={{
              height: DRAG_HANDLE_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              borderTopLeftRadius: SHEET_RADIUS,
              borderTopRightRadius: SHEET_RADIUS,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#cbd5e1',
              }}
            />
          </View>

          {/* Search Form */}
          <SearchForm
            origin={origin}
            destination={destination}
            date={date}
            passengers={passengers}
            onOriginPress={() => setActiveCityField('origin')}
            onDestinationPress={() => setActiveCityField('destination')}
            onDatePress={() => {}}
            onDateChange={handleDateChange}
            onSwap={handleSwapCities}
            setPassengers={setPassengers}
            onSubmit={handleSearch}
          />

          {/* Date Strip (post-search only) */}
          {!isPreSearch && (
            <DateStrip
              from={origin?.id ?? ''}
              to={destination?.id ?? ''}
              fromMuni={origin?.municipalityId}
              toMuni={destination?.municipalityId}
              fromQuarter={origin?.quarterId}
              toQuarter={destination?.quarterId}
              selectedDate={dateStr}
              onSelectDate={(dStr) => {
                const [y, m, d] = dStr.split('-').map(Number) as [number, number, number];
                setDate(new Date(y, m - 1, d));
                setPage(1);
              }}
            />
          )}

          {/* Filter / Results bar (post-search only) */}
          {!isPreSearch && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#f8fafc',
              }}
            >
              <View>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a' }}>
                  {tripResults?.total ?? offers.length}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>
                  {t((tripResults?.total ?? offers.length) === 1 ? 'resultSingular' : 'resultPlural')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setSortVisible(true)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    borderWidth: 1, borderColor: '#f1f5f9',
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 20, backgroundColor: pressed ? '#f1f5f9' : '#f9fafb',
                  })}
                >
                  <HugeiconsIcon icon={Sorting01Icon} size={13} color={Colors.light.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                    {t('sortLabel')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFiltersVisible(true)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    borderWidth: 1,
                    borderColor: activeFilterCount > 0 ? '#fbcfe8' : '#f1f5f9',
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: activeFilterCount > 0 ? (pressed ? '#fbcfe8' : '#fdf2f8') : (pressed ? '#f1f5f9' : '#f9fafb'),
                  })}
                >
                  <HugeiconsIcon
                    icon={FilterIcon}
                    size={13}
                    color={activeFilterCount > 0 ? '#ee237c' : Colors.light.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 12, fontWeight: '700',
                      color: activeFilterCount > 0 ? '#ee237c' : '#475569',
                    }}
                  >
                    {t('filtersTitle')}
                  </Text>
                  {activeFilterCount > 0 && (
                    <View style={{
                      width: 16, height: 16, borderRadius: 8,
                      backgroundColor: '#ee237c',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ── Results FlatList (Nested Scroll Interaction) ── */}
        <FlatList
          data={isPreSearch ? [] : allOffers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onPressIn={(o) => prefetchSeatAvailability(o.id)}
              onSelect={(o) => setSelectedOffer(o)}
            />
          )}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: BottomTabInset + insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={(e) => {
            const velY = e.nativeEvent.velocity?.y ?? 0;
            // If dragging up on the list while sheet is not expanded, expand to top
            if (velY < 0 && currentY.current > snapRef.current.top + 30) {
              snapTo('top');
            }
          }}
          ListEmptyComponent={() => {
            if (isLoading && page === 1) return <SearchSkeleton />;
            return (
              <SearchEmptyState
                isPreSearch={isPreSearch}
                onPopularRouteSelect={(o, d) => {
                  setOrigin(o);
                  setDestination(d);
                  setIsSubmitted(true);
                  setPage(1);
                  snapTo('top');
                }}
                onResetFilters={clearFilters}
              />
            );
          }}
          ListFooterComponent={() => {
            if (!isPreSearch && allOffers.length > 0) {
              return (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  {isFetching && page > 1 ? (
                    <ActivityIndicator color="#ee237c" />
                  ) : tripResults?.hasNextPage ? (
                    <Pressable
                      onPress={() => setPage((p) => p + 1)}
                      className="will-change-pressable"
                      style={{
                        borderWidth: 1, borderColor: '#e2e8f0',
                        backgroundColor: '#fff',
                        paddingHorizontal: 24, paddingVertical: 12,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ color: '#475569', fontWeight: '700', fontSize: 14 }}>
                        {t('loadMore')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }
            return null;
          }}
        />
      </Animated.View>

      {/* ═══ Modals ═══ */}
      <CitySearchField
        visible={activeCityField !== null}
        onClose={() => { setActiveCityField(null); setCityQuery(''); }}
        onSelect={handleCitySelect}
        query={cityQuery}
        setQuery={setCityQuery}
      />
      <SortSheet
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        selectedSort={sort}
        onSelectSort={(s) => { setSort(s); setSortVisible(false); setPage(1); }}
      />
      <FiltersSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        onApplyFilters={(f) => { setFilters(f); setPage(1); }}
        operators={activeOperators}
      />
      <SeatSelectionSheet
        offer={selectedOffer}
        passengers={passengers}
        onClose={() => { setSelectedOffer(null); setSelectedSeatIds([]); }}
        onContinue={(seats) => {
          if (!session?.user) {
            if (!selectedOffer || !origin || !destination) return;
            const searchSnapshot = {
              origin,
              destination,
              date: dateStr,
              passengers,
              sort,
              filters,
            };
            setPending({
              offer: selectedOffer,
              seatIds: seats,
              passengers,
              search: searchSnapshot,
            });
            setSelectedOffer(null);
            setSelectedSeatIds([]);
            const returnTo = buildSearchReturnTo(searchSnapshot);
            router.push(
              `/(auth)/login?returnTo=${encodeURIComponent(returnTo)}` as any,
            );
          } else {
            setSelectedSeatIds(seats);
            setPassengerFormVisible(true);
          }
        }}
      />
      <PassengerFormSheet
        visible={passengerFormVisible}
        offer={selectedOffer}
        seatIds={selectedSeatIds}
        onBack={() => setPassengerFormVisible(false)}
        onClose={() => {
          setPassengerFormVisible(false);
          setSelectedOffer(null);
          setSelectedSeatIds([]);
        }}
      />
    </View>
  );
}
