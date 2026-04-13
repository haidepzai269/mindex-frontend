import { fetchApi } from './api'

async function adminFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  // Sử dụng fetchApi đã có sẵn logic Reactive Refresh (401 tự động refresh)
  const json: any = await fetchApi(path, opts)
  
  // Trả về trường .data để tương thích với các component hiện tại
  return json.data as T
}

export const adminApi = {
  getSystemHealth: () => adminFetch<SystemHealth>('/admin/system'),
  getTokens: (params: string) => adminFetch<TokenOverview>(`/admin/tokens?${params}`),
  getKeysStatus: () => adminFetch<KeyStatus[]>('/admin/keys/status'),
  listChats: (params: string) => adminFetch<ChatListResponse>(`/admin/chats?${params}`),
  getChatDetail: (id: string) => adminFetch<ChatDetail>(`/admin/chats/${id}`),
  flagChat: (id: string, flag: boolean, reason: string) =>
    adminFetch(`/admin/chats/${id}/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ flag, reason }),
    }),
  getQuota: () => adminFetch<QuotaResponse>('/admin/quota'),
}

export interface QuotaResponse {
  updated_at: string
  providers: Record<string, ProviderQuota>
}

export interface ProviderQuota {
  provider: string
  total_keys: number
  rate_limited_keys: number
  total_rpd_used: number
  total_monthly_token_used: number
  keys: KeyUsageDetailed[]
}

export interface KeyUsageDetailed {
  key_id: string
  provider: string
  account_note: string
  rpm_remaining: number
  rpm_limit: number
  tpm_remaining: number
  tpm_limit: number
  reset_at: string
  rpd_used: number
  monthly_token_used: number
  is_rate_limited: boolean
  last_used: string
  last_error?: string
}

export interface SystemHealth {
  db: {
    total_users: number
    new_users_24h: number
    new_users_7d: number
    total_docs: number
    docs_processing: number
    docs_error: number
    docs_public: number
    docs_expiring_24h: number
    total_chunks: number
    db_size_human: string
    chunks_table_human: string
    token_logs_human: string
    chat_histories_human: string
    will_sweep_tonight: number
    chunks_to_free_tonight: number
  }
  redis: {
    connected: boolean
    active_keys: number
    upload_queue_len: number
  }
  checked_at: string
}

export interface TokenBreakdown {
  service: string
  operation: string
  requests: number
  tokens: number
  avg_latency: number
  error_count: number
}

export interface KeyStatus {
  alias: string
  service: string
  limit_tokens: number
  remaining_tokens: number
  limit_requests: number
  remaining_requests: number
  reset_at: number
  last_updated: number
}

export interface TokenOverview {
  period: string
  breakdown: TokenBreakdown[]
}

export interface ChatSession {
  id: string
  session_id: string
  user_email: string
  doc_title: string
  message_count: number
  summary: string
  flagged: boolean
  flag_reason: string
  started_at: string
}

export interface ChatListResponse {
  chats: ChatSession[]
  page: number
}

export interface ChatDetail {
  id: string
  user_email: string
  summary: string
  messages: unknown[]
  flagged: boolean
  flag_reason: string | null
  started_at: string
}
