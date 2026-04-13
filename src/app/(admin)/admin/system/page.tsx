'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, SystemHealth } from '@/lib/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, FileText, Database, HardDrive, Clock,
  AlertTriangle, CheckCircle2, Layers, Server
} from 'lucide-react'

function StatCard({
  title, value, sub, icon: Icon, accent = 'default', loading
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: 'default' | 'green' | 'yellow' | 'red' | 'violet'
  loading?: boolean
}) {
  const accentMap = {
    default: 'text-zinc-400',
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
    violet: 'text-violet-400',
  }
  return (
    <Card className="bg-[#111] border-white/8 hover:border-white/15 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accentMap[accent]}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-white/5" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</div>
            {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function SystemHealthPage() {
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
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  const db = data?.db
  const redis = data?.redis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">System Health</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {lastRefresh ? `Cập nhật lúc ${lastRefresh.toLocaleTimeString('vi-VN')}` : 'Đang tải...'}
          </p>
        </div>
        <Badge variant="outline" className={`text-xs border-none ${redis?.connected ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {redis?.connected ? '● Redis Connected' : '○ Redis Offline'}
        </Badge>
      </div>

      {/* Users */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Người dùng</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard loading={loading} title="Tổng Users" value={db?.total_users ?? 0} icon={Users} accent="violet" />
          <StatCard loading={loading} title="Mới 24h" value={db?.new_users_24h ?? 0} sub="+users hôm nay" icon={Users} accent="green" />
          <StatCard loading={loading} title="Mới 7 ngày" value={db?.new_users_7d ?? 0} sub="+users tuần này" icon={Users} />
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Tài liệu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard loading={loading} title="Tổng Docs" value={db?.total_docs ?? 0} icon={FileText} />
          <StatCard loading={loading} title="Đang xử lý" value={db?.docs_processing ?? 0} icon={Clock} accent={db?.docs_processing ? 'yellow' : 'default'} />
          <StatCard loading={loading} title="Lỗi" value={db?.docs_error ?? 0} icon={AlertTriangle} accent={db?.docs_error ? 'red' : 'default'} />
          <StatCard loading={loading} title="Công khai" value={db?.docs_public ?? 0} icon={CheckCircle2} accent="green" />
        </div>
      </div>

      {/* Chunks & DB */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Database & Storage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard loading={loading} title="Tổng Chunks" value={db?.total_chunks?.toLocaleString() ?? 0} icon={Layers} accent="violet" />
          <StatCard loading={loading} title="DB Size" value={db?.db_size_human ?? '—'} icon={Database} />
          <StatCard loading={loading} title="Chunks Table" value={db?.chunks_table_human ?? '—'} icon={HardDrive} />
          <StatCard loading={loading} title="Chat History" value={db?.chat_histories_human ?? '—'} icon={Database} />
        </div>
      </div>

      {/* Redis */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Redis Cache</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard loading={loading} title="Active Keys" value={redis?.active_keys ?? 0} icon={Server} accent="violet" />
          <StatCard loading={loading} title="Upload Queue" value={redis?.upload_queue_len ?? 0} icon={Clock} accent={redis?.upload_queue_len ? 'yellow' : 'green'} sub="jobs đang chờ" />
        </div>
      </div>

      {/* Sweeper Forecast */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Sweeper Forecast (3AM)</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard loading={loading} title="Docs sẽ bị xóa tối nay" value={db?.will_sweep_tonight ?? 0} icon={AlertTriangle} accent={db?.will_sweep_tonight ? 'yellow' : 'green'} />
          <StatCard loading={loading} title="Chunks sẽ được giải phóng" value={db?.chunks_to_free_tonight?.toLocaleString() ?? 0} icon={Layers} accent="yellow" />
        </div>
      </div>
    </div>
  )
}
