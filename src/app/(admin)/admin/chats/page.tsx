'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, ChatSession } from '@/lib/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Flag, MessageSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ChatAuditPage() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '30',
        ...(flaggedOnly ? { flagged: 'true' } : {}),
      })
      const res = await adminApi.listChats(params.toString())
      setChats(res.chats ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, flaggedOnly])

  useEffect(() => { fetch() }, [fetch])

  const filtered = search
    ? chats.filter(c => c.user_email.includes(search) || c.doc_title?.includes(search))
    : chats

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Chat Audit</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Kiểm soát nội dung hội thoại user ↔ AI</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm email, tài liệu..."
            className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <button
          onClick={() => { setFlaggedOnly(!flaggedOnly); setPage(1) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            flaggedOnly
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          Chỉ Flagged
        </button>
      </div>

      {/* Table */}
      <Card className="bg-[#111] border-white/8">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Tài liệu</th>
                <th className="text-right px-4 py-3">Messages</th>
                <th className="text-left px-4 py-3">Thời gian</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32 bg-white/5" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40 bg-white/5" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10 bg-white/5 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28 bg-white/5" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 bg-white/5 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 bg-white/5 ml-auto" /></td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-600 py-12">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {!loading && filtered.map(chat => (
                <tr key={chat.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-zinc-300 text-xs">{chat.user_email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400 text-xs truncate max-w-[160px] block" title={chat.doc_title}>
                      {chat.doc_title || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">{chat.message_count}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-500 text-xs">
                      {new Date(chat.started_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {chat.flagged ? (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]">
                        🚩 Flagged
                      </Badge>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/chats/${chat.session_id}`}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Xem →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
          <span className="text-xs text-zinc-500">Trang {page}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={chats.length < 30}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
