import { fetchApi } from '@/lib/api';

export type DashboardPeriod = '7d' | '30d' | '6m' | '1y';

export interface DashboardMetrics {
  document_count: number;
  chat_count: number;
  message_count: number;
  positive_feedback: number;
  negative_feedback: number;
  period: string;
}

export interface TrendPoint {
  date: string;
  chats: number;
  documents: number;
}

export interface DashboardTrends {
  points: TrendPoint[];
  group_by: string;
  period: string;
}

export interface TopDocument {
  id: string;
  title: string;
  query_count: number;
  created_at: string;
}

export interface TopChat {
  id: string;
  title: string | null;
  message_count: number;
  document_title: string | null;
  started_at: string;
}

export interface DashboardHighlights {
  top_documents: TopDocument[];
  top_chats: TopChat[];
  period: string;
}

export function fetchDashboardMetrics(period: DashboardPeriod) {
  return fetchApi<{ data: DashboardMetrics }>(`/dashboard/metrics?period=${period}`);
}

export function fetchDashboardTrends(period: DashboardPeriod) {
  return fetchApi<{ data: DashboardTrends }>(`/dashboard/trends?period=${period}`);
}

export function fetchDashboardHighlights(period: DashboardPeriod) {
  return fetchApi<{ data: DashboardHighlights }>(`/dashboard/highlights?period=${period}`);
}
