import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Sorting01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import { BottomTabInset } from '@/constants/theme';
import { SearchForm } from '../components/search-form';
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
import { useSearchFilters } from '../hooks/use-search-filters';
import type { CityValue, SortKey } from '../types';
import { toLocalISODate } from '../lib/format';

export function SearchView() {
  const { t } = useTranslation("search");
  const insets = useSafeAreaInsets();

  // Location & Form State
  const [origin, setOrigin] = useState<CityValue | null>(null);
  const [destination, setDestination] = useState<CityValue | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sort, setSort] = useState<SortKey>('CHEAPEST');
  const [page, setPage] = useState(1);

  // Filters hook with AsyncStorage persistence
  const { filters, setFilters, clearFilters, activeFilterCount } = useSearchFilters();

  // Modal states
  const [activeCityField, setActiveCityField] = useState<'origin' | 'destination' | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [sortVisible, setSortVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [passengerFormVisible, setPassengerFormVisible] = useState(false);

  const dateStr = toLocalISODate(date);

  // Real tRPC query hook
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

  // Transform backend offers to component Offer interface
  const offers: Offer[] = useMemo(() => {
    if (!tripResults?.offers) return [];
    return tripResults.offers.map((o) => ({
      id: o.offerId,
      operatorName: o.companyName,
      isExpress: o.isExpress,
      busClass: o.seatClass === 'VIP' ? 'VIP' : o.seatClass === 'STANDARD' ? 'Standard' : 'Economy',
      departureTime: new Date(o.departureTime).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit', hour12: false }),
      departureTerminal: o.originTerminalName,
      departureCity: o.originCityName,
      arrivalTime: new Date(o.arrivalTime).toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit', hour12: false }),
      arrivalTerminal: o.destinationTerminalName,
      arrivalCity: o.destinationCityName,
      duration: `${Math.floor(o.durationMinutes / 60)}h ${o.durationMinutes % 60}m`,
      stopCount: o.stopCount,
      priceXOF: o.priceXOF,
      availability: o.availability.status === 'SOLD_OUT' ? 'SOLD_OUT' : o.availability.status === 'FEW_LEFT' ? 'FEW_LEFT' : 'AVAILABLE',
      amenities: o.amenities,
    }));
  }, [tripResults]);

  const isPreSearch = !isSubmitted || !origin || !destination;

  const handleSearch = useCallback(() => {
    if (origin && destination) {
      setIsSubmitted(true);
      setPage(1);
    }
  }, [origin, destination]);

  const handleCitySelect = (city: CityValue) => {
    if (activeCityField === 'origin') {
      setOrigin(city);
    } else {
      setDestination(city);
    }
    setActiveCityField(null);
    setCityQuery('');
  };

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Search Form Card */}
      <View className="bg-white pb-3 border-b border-slate-100 z-10">
        <SearchForm
          origin={origin}
          destination={destination}
          date={date}
          passengers={passengers}
          onOriginPress={() => setActiveCityField('origin')}
          onDestinationPress={() => setActiveCityField('destination')}
          onDatePress={() => {}}
          onSwap={handleSwapCities}
          setPassengers={setPassengers}
          onSubmit={handleSearch}
        />
      </View>

      {!isPreSearch && (
        <>
          <DateStrip
            from={origin?.id ?? ''}
            to={destination?.id ?? ''}
            selectedDate={dateStr}
            onSelectDate={(dStr) => {
              const [y, m, d] = dStr.split('-').map(Number) as [number, number, number];
              setDate(new Date(y, m - 1, d));
              setPage(1);
            }}
          />
          
          {/* Results Bar */}
          <View className="flex-row items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
            <Text className="text-slate-700 font-bold text-xs">
              {(tripResults?.total ?? offers.length)} {t((tripResults?.total ?? offers.length) === 1 ? "resultSingular" : "resultPlural")}
            </Text>
            <View className="flex-row gap-2">
              <Pressable onPress={() => setSortVisible(true)} className="flex-row items-center border border-slate-200 px-3 py-1.5 rounded-full active:bg-slate-50">
                <HugeiconsIcon icon={Sorting01Icon} size={14} color={Colors.light.textSecondary} className="mr-1.5" />
                <Text className="text-slate-700 text-xs font-bold">{t("sortLabel")}</Text>
              </Pressable>
              
              <Pressable onPress={() => setFiltersVisible(true)} className={`flex-row items-center px-3 py-1.5 rounded-full border active:bg-pink-50
                ${activeFilterCount > 0 ? 'bg-pink-50 border-pink-200' : 'border-slate-200 bg-white'}
              `}>
                <HugeiconsIcon icon={FilterIcon} size={14} color={activeFilterCount > 0 ? '#ee237c' : Colors.light.textSecondary} className="mr-1.5" />
                <Text className={`text-xs font-bold ${activeFilterCount > 0 ? 'text-[#ee237c]' : 'text-slate-700'}`}>
                  {t("filtersTitle")}
                </Text>
                {activeFilterCount > 0 && (
                  <View className="bg-[#ee237c] w-4 h-4 rounded-full items-center justify-center ml-1.5">
                    <Text className="text-white text-[9px] font-black">{activeFilterCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* List Area with safe area bottom inset + floating tab inset */}
      <FlatList
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: BottomTabInset + insets.bottom + 24,
        }}
        data={isPreSearch ? [] : offers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OfferCard offer={item} onSelect={(o) => setSelectedOffer(o)} />
        )}
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
              }}
              onResetFilters={clearFilters}
            />
          );
        }}
        ListFooterComponent={() => {
          if (!isPreSearch && offers.length > 0) {
            return (
              <View className="p-4 items-center">
                {isFetching && page > 1 ? (
                  <ActivityIndicator color="#ee237c" />
                ) : tripResults?.hasNextPage ? (
                  <Pressable 
                    onPress={() => setPage(p => p + 1)}
                    className="border-2 border-slate-200 px-6 py-3 rounded-full active:bg-slate-50"
                  >
                    <Text className="text-slate-700 font-bold text-sm">{t("loadMore")}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }
          return null;
        }}
      />

      {/* Modals */}
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
      />

      <SeatSelectionSheet
        offer={selectedOffer}
        passengers={passengers}
        onClose={() => {
          setSelectedOffer(null);
          setSelectedSeatIds([]);
        }}
        onContinue={(seats) => {
          setSelectedSeatIds(seats);
          setPassengerFormVisible(true);
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
