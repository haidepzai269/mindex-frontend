'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, QuotaResponse, ProviderQuota, KeyUsageDetailed } from '@/lib/admin-api'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Key, 
  ShieldAlert, 
  Activity, 
  Layers,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

// Màu sắc cho từng provider dựa trên ảnh mẫu và thương hiệu
const PROVIDER_THEMES: Record<string, { color: string, bg: string }> = {
  groq: { color: '#6366f1', bg: 'bg-indigo-500/10' },
  gemini: { color: '#10b981', bg: 'bg-emerald-500/10' },
  gemini_flash: { color: '#10b981', bg: 'bg-emerald-500/10' },
  gemini_embed: { color: '#3b82f6', bg: 'bg-blue-500/10' },
  cerebras: { color: '#f59e0b', bg: 'bg-amber-500/10' },
  mistral: { color: '#8b5cf6', bg: 'bg-violet-500/10' },
  openrouter: { color: '#ef4444', bg: 'bg-red-500/10' },
  huggingface: { color: '#f97316', bg: 'bg-orange-500/10' },
}

const getProgressColor = (percent: number) => {
  if (percent <= 20) return 'bg-red-500';
  if (percent <= 50) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

const getTextColor = (percent: number) => {
  if (percent <= 20) return 'text-red-400';
  if (percent <= 50) return 'text-yellow-400';
  return 'text-emerald-400';
};

function StatCard({ label, value, subtext, icon: Icon, color }: any) {
  return (
    <Card className="bg-[#18181b] border-white/5 overflow-hidden relative group">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
      <CardContent className="pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold mt-1 text-white">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{subtext}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors`}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderAccordion({ provider, data, isExpanded, onToggle }: { provider: string, data: ProviderQuota, isExpanded: boolean, onToggle: () => void }) {
  const theme = PROVIDER_THEMES[provider] || { color: '#71717a', bg: 'bg-zinc-500/10' }
  
  // Tính toán chỉ số tiến trình (Ví dụ RPD)
  // Trong thực tế, RPM/TPM từ header thay đổi liên tục, ở đây ta hiển thị RPD used so với một mốc ước lượng hoặc tổng key
  const totalRpd = data.total_rpd_used
  const isLimited = data.rate_limited_keys > 0

  return (
    <div className="mb-3">
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 bg-[#18181b] border border-white/5 rounded-xl cursor-pointer hover:bg-[#202023] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
          <div>
            <span className="text-sm font-bold text-white uppercase">{provider}</span>
            <span className="ml-2 text-xs text-zinc-500">{data.total_keys} keys</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isLimited && (
            <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-tighter">
              {data.rate_limited_keys} limited
            </div>
          )}
          
          <div className="hidden md:flex flex-col items-end min-w-[120px]">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Usage</span>
            <span className="text-xs font-mono text-zinc-300">
               {totalRpd.toLocaleString()} <span className="text-zinc-600">reqs今日</span>
            </span>
          </div>

          <div className="text-zinc-500 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-1 ml-4 border-l border-white/5 pl-4 py-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
          <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#121214]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-600 uppercase text-[9px] font-bold">
                  <th className="px-4 py-3">Key ID</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">RPM Rem.</th>
                  <th className="px-4 py-3 text-right">TPM Rem.</th>
                  <th className="px-4 py-3 text-right">RPD Used</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.keys.map((k, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] last:border-0">
                    <td className="px-4 py-3 font-mono text-zinc-400">{k.key_id}</td>
                    <td className="px-4 py-3 text-zinc-500">{k.account_note}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      <div className="flex flex-col items-end">
                        <span className={k.rpm_limit > 0 ? getTextColor((k.rpm_remaining / k.rpm_limit) * 100) : 'text-zinc-400'}>
                          {k.rpm_remaining > 0 ? k.rpm_remaining.toLocaleString() : '-'}
                        </span>
                        {k.rpm_limit > 0 && (
                          <div className="w-16 h-1 mt-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor((k.rpm_remaining / k.rpm_limit) * 100)}`} 
                              style={{ width: `${(k.rpm_remaining / k.rpm_limit) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <div className="flex flex-col items-end">
                        <span className={k.tpm_limit > 0 ? getTextColor((k.tpm_remaining / k.tpm_limit) * 100) : 'text-zinc-400'}>
                          {k.tpm_remaining > 0 ? k.tpm_remaining.toLocaleString() : '-'}
                        </span>
                        {k.tpm_limit > 0 && (
                          <div className="w-16 h-1 mt-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor((k.tpm_remaining / k.tpm_limit) * 100)}`} 
                              style={{ width: `${(k.tpm_remaining / k.tpm_limit) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-mono">{k.rpd_used}</td>
                    <td className="px-4 py-3 text-center">
                      {k.is_rate_limited ? (
                        <div className="flex justify-center" title={k.last_error}>
                          <ShieldAlert size={14} className="text-red-500" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TokenQuotaPage() {
  const [data, setData] = useState<QuotaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({ groq: true })
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  const simulateData = () => {
    const mock: QuotaResponse = {
      updated_at: new Date().toISOString(),
      providers: {
        groq: {
          provider: 'groq', total_keys: 3, rate_limited_keys: 0, total_rpd_used: 4200, total_monthly_token_used: 0,
          keys: [
            { key_id: 'gsk...Ry8Z', provider: 'groq', account_note: 'groq_1', rpm_remaining: 120, rpm_limit: 1000, tpm_remaining: 15000, tpm_limit: 40000, reset_at: '', rpd_used: 1500, monthly_token_used: 0, is_rate_limited: false, last_used: '' },
            { key_id: 'gsk...ERGS', provider: 'groq', account_note: 'groq_2', rpm_remaining: 45, rpm_limit: 1000, tpm_remaining: 2000, tpm_limit: 40000, reset_at: '', rpd_used: 2400, monthly_token_used: 0, is_rate_limited: false, last_used: '' },
            { key_id: 'gsk...J7rO', provider: 'groq', account_note: 'groq_3', rpm_remaining: 980, rpm_limit: 1000, tpm_remaining: 38000, tpm_limit: 40000, reset_at: '', rpd_used: 300, monthly_token_used: 0, is_rate_limited: false, last_used: '' },
          ]
        },
        gemini: {
          provider: 'gemini', total_keys: 2, rate_limited_keys: 1, total_rpd_used: 710, total_monthly_token_used: 0,
          keys: [
            { key_id: 'AIza...yGBA', provider: 'gemini', account_note: 'gemini_1', rpm_remaining: 0, rpm_limit: 15, tpm_remaining: 0, tpm_limit: 10000, reset_at: '', rpd_used: 500, monthly_token_used: 0, is_rate_limited: true, last_used: '', last_error: 'Rate limit reached' },
            { key_id: 'AIza...HPqk', provider: 'gemini', account_note: 'gemini_2', rpm_remaining: 12, rpm_limit: 15, tpm_remaining: 8500, tpm_limit: 10000, reset_at: '', rpd_used: 210, monthly_token_used: 0, is_rate_limited: false, last_used: '' },
          ]
        }
      }
    }
    setData(mock)
  }

  const fetchQuota = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getQuota()
      setData(res)
      setLastRefreshed(new Date())
    } catch (e) {
      console.error('Failed to fetch quota:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchQuota()
    // Tự động refresh mỗi 30s
    const timer = setInterval(fetchQuota, 30000)
    return () => clearInterval(timer)
  }, [fetchQuota])

  const toggleProvider = (p: string) => {
    setExpandedProviders(prev => ({ ...prev, [p]: !prev[p] }))
  }

  // Phân tích dữ liệu tổng quan
  const providers = data?.providers ? Object.values(data.providers) : []
  const totalKeys = providers.reduce((acc, p) => acc + p.total_keys, 0)
  const totalRateLimited = providers.reduce((acc, p) => acc + p.rate_limited_keys, 0)
  const activeProviders = providers.length
  const groqUsage = data?.providers?.['groq']?.total_rpd_used || 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
             API Quota Monitor
             {loading && <RefreshCw size={16} className="animate-spin text-violet-400" />}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">
            Last updated: <span className="text-zinc-400">{mounted ? lastRefreshed.toLocaleTimeString() : '--:--:--'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={simulateData}
            className="px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-[10px] font-bold text-violet-400 transition-all uppercase"
          >
            Simulate Data
          </button>
          <button 
            onClick={fetchQuota}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !data ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full bg-[#18181b] rounded-xl" />)
        ) : (
          <>
            <StatCard 
              label="Total API Keys" 
              value={totalKeys} 
              subtext="across all providers" 
              icon={Key} 
              color="bg-violet-500" 
            />
            <StatCard 
              label="Rate Limited Now" 
              value={totalRateLimited} 
              subtext="keys currently throttled" 
              icon={ShieldAlert} 
              color={totalRateLimited > 0 ? "bg-red-500" : "bg-emerald-500"} 
            />
            <StatCard 
              label="Providers Active" 
              value={activeProviders} 
              subtext="monitoring" 
              icon={Layers} 
              color="bg-blue-500" 
            />
            <StatCard 
              label="Groq RPD" 
              value={groqUsage >= 1000 ? `${(groqUsage/1000).toFixed(1)}K` : groqUsage} 
              subtext="today total requests" 
              icon={Zap} 
              color="bg-indigo-500" 
            />
          </>
        )}
      </div>

      {/* Providers List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">Provider Health Status</h2>
        </div>

        {loading && providers.length === 0 ? (
          <div className="space-y-3">
             {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full bg-[#18181b] rounded-xl" />)}
          </div>
        ) : providers.length === 0 ? (
          <Card className="bg-[#18181b] border-dashed border-white/10">
            <CardContent className="py-20 flex flex-col items-center justify-center text-zinc-500">
              <AlertCircle size={40} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">No quota data available yet.</p>
              <p className="text-xs opacity-60">System will automatically track usage once API calls are made.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {providers.sort((a, b) => b.total_rpd_used - a.total_rpd_used).map((p) => (
              <ProviderAccordion
                key={p.provider}
                provider={p.provider}
                data={p}
                isExpanded={!!expandedProviders[p.provider]}
                onToggle={() => toggleProvider(p.provider)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Historical Stats Hook (Optional/Future) */}
      <div className="pt-10 flex items-center justify-center gap-4 text-zinc-700">
        <div className="h-[1px] flex-1 bg-white/5" />
        <div className="text-[9px] uppercase font-bold tracking-widest flex items-center gap-2">
           <Activity size={10} />
           Real-time Quota Stream Active
        </div>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>
    </div>
  )
}
