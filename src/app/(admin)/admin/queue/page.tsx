'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, SystemHealth } from '@/lib/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Layers, Server, Clock, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react'

export default function QueueHealthPage() {
  const [data, setData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetch = useCallback(async () => {
    try {
      const res = await adminApi.getSystemHealth()
      setData(res)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [fetch])

  const db = data?.db
  const redis = data?.redis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Queue Health</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {lastRefresh ? `Snapshot lúc ${lastRefresh.toLocaleTimeString('vi-VN')}` : 'Đang tải...'}
          </p>
        </div>
      </div>

      {/* Upload Queue */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Upload Queue (Redis)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-[#111] border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500 flex items-center justify-between">
                Queue Length <Server className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16 bg-white/5" /> : (
                <>
                  <div className={`text-2xl font-bold ${(redis?.upload_queue_len ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {redis?.upload_queue_len ?? 0}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">jobs đang chờ xử lý</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500 flex items-center justify-between">
                Redis Status <div className={`h-2 w-2 rounded-full ${redis?.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24 bg-white/5" /> : (
                <>
                  <div className={`text-lg font-semibold ${redis?.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {redis?.connected ? 'Connected' : 'Offline'}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{redis?.active_keys ?? 0} active keys</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500 flex items-center justify-between">
                Docs đang xử lý <Cpu className="h-3.5 w-3.5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16 bg-white/5" /> : (
                <>
                  <div className={`text-2xl font-bold ${(db?.docs_processing ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {db?.docs_processing ?? 0}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">đang trong pipeline embedding</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Status Pipeline */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Document Pipeline Status</h2>
        <Card className="bg-[#111] border-white/8">
          <CardContent className="pt-4">
            <div className="flex items-center gap-0">
              {[
                { label: 'Queued', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-800', value: null },
                { label: 'Processing', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-400/10', value: db?.docs_processing },
                { label: 'Ready', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', value: (db?.total_docs ?? 0) - (db?.docs_processing ?? 0) - (db?.docs_error ?? 0) },
                { label: 'Error', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', value: db?.docs_error },
              ].map(({ label, icon: Icon, color, bg, value }, i, arr) => (
                <div key={label} className="flex items-center flex-1">
                  <div className={`flex-1 flex flex-col items-center gap-2 px-4 py-3 rounded-xl ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className={`text-xl font-bold ${color}`}>{loading ? '—' : (value ?? '—')}</span>
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-6 flex justify-center text-zinc-700">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sweeper Forecast */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Sweeper 3AM Preview</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className={`bg-[#111] border-white/8 ${(db?.will_sweep_tonight ?? 0) > 10 ? 'border-amber-500/20' : ''}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Tài liệu sẽ bị xóa</p>
                  {loading ? <Skeleton className="h-7 w-16 mt-1 bg-white/5" /> : (
                    <p className={`text-2xl font-bold mt-1 ${(db?.will_sweep_tonight ?? 0) > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {db?.will_sweep_tonight ?? 0}
                    </p>
                  )}
                </div>
                <AlertTriangle className={`h-8 w-8 ${(db?.will_sweep_tonight ?? 0) > 0 ? 'text-amber-400/40' : 'text-zinc-700'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-white/8">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Chunks sẽ được giải phóng</p>
                  {loading ? <Skeleton className="h-7 w-24 mt-1 bg-white/5" /> : (
                    <p className="text-2xl font-bold mt-1 text-violet-400">
                      {(db?.chunks_to_free_tonight ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <Layers className="h-8 w-8 text-violet-400/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
