export interface CityValue {
  id: string;
  text: string;
  municipalityId?: string;
  quarterId?: string;
  level?: 'city' | 'municipality' | 'quarter' | 'terminal';
  terminalId?: string;
  companyName?: string;
  companyId?: string;
}

export interface SearchFilters {
  operators: string[];
  amenities: string[];
  departureTime: string[];
  seatClass: string[];
  isExpress: boolean;
}

export const EMPTY_FILTERS: SearchFilters = {
  operators: [],
  amenities: [],
  departureTime: [],
  seatClass: [],
  isExpress: false,
};

export type SortKey = 'BEST' | 'CHEAPEST' | 'FASTEST' | 'EARLIEST' | 'LATEST';
