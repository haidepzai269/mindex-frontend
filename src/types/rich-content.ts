export interface HourlyTemp {
  time: string;
  temp: number;
}

export interface WeatherData {
  city: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  condition: string;
  condition_icon: string;
  wind_speed: number;
  hourly_temps: HourlyTemp[];
}

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  image_url: string | null;
  published_at: string;
  category: string;
}

export interface NewsResult {
  articles: NewsItem[];
  next_page_token: string | null;
  has_more: boolean;
  total_results: number;
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface CryptoPrice {
  name: string;
  symbol: string;
  price_vnd: number;
  change_24h: number;
  market_cap_vnd: number;
  volume_24h_vnd: number;
  price_history: PricePoint[];
}

export type RichContentType = 'weather' | 'news' | 'crypto';

export interface RichContentMessage {
  type: RichContentType;
  data: WeatherData | NewsResult | CryptoPrice;
  timestamp: string;
}
