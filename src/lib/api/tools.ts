import { fetchApi } from '@/lib/api';
import type { NewsResult } from '@/types/rich-content';

interface FetchMoreNewsParams {
  category?: string;
  query?: string;
  page_token?: string;
  language?: string;
  country?: string;
}

export async function fetchMoreNews(params: FetchMoreNewsParams): Promise<NewsResult> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.query) searchParams.set('query', params.query);
  if (params.page_token) searchParams.set('page_token', params.page_token);
  if (params.language) searchParams.set('language', params.language);
  if (params.country) searchParams.set('country', params.country);

  const query = searchParams.toString();
  const endpoint = `/tools/news/more${query ? `?${query}` : ''}`;

  const res = await fetchApi<{ data: NewsResult }>(endpoint, { method: 'GET' });
  return res.data;
}
