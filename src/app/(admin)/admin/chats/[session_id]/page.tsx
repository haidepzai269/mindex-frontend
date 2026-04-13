'use client'

import { useEffect, useState, useCallback } from 'react'
import { use } from 'react'
import { adminApi, ChatDetail } from '@/lib/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Flag, FlagOff } from 'lucide-react'
import Link from 'next/link'

export default function ChatDetailPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = use(params)
  const [chat, setChat] = useState<ChatDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [showFlagForm, setShowFlagForm] = useState(false)

  const fetchDetail = useCallback(async () => {
    try {
      const res = await adminApi.getChatDetail(session_id)
      setChat(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [session_id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleFlag = async (flag: boolean) => {
    if (flag && !flagReason.trim()) return
    setFlagging(true)
    try {
      await adminApi.flagChat(session_id, flag, flagReason)
      await fetchDetail()
      setShowFlagForm(false)
      setFlagReason('')
    } catch (e) {
      console.error(e)
    } finally {
      setFlagging(false)
    }
  }

  const messages = (chat?.messages ?? []) as Array<{ role: string; content: string; timestamp?: string }>

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back */}
      <Link href="/admin/chats" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white truncate">Session: {session_id.slice(0, 12)}…</h1>
          {loading ? <Skeleton className="h-4 w-40 mt-1 bg-white/5" /> : (
            <p className="text-sm text-zinc-500 mt-0.5">{chat?.user_email}</p>
          )}
        </div>
        {!loading && (
          <div className="flex items-center gap-2 shrink-0">
            {chat?.flagged ? (
              <>
                <Badge className="bg-red-500/15 text-red-400 border-red-500/20">🚩 Flagged</Badge>
                <button
                  onClick={() => handleFlag(false)}
                  disabled={flagging}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <FlagOff className="h-3.5 w-3.5" />
                  Bỏ flag
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowFlagForm(!showFlagForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Flag session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flag form */}
      {showFlagForm && (
        <Card className="bg-red-950/20 border-red-500/20">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-red-400 font-medium">Lý do đánh dấu nghi vấn:</p>
            <textarea
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              rows={2}
              className="w-full bg-black/30 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none resize-none"
              placeholder="Nhập lý do tại sao session này cần review..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowFlagForm(false)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Hủy</button>
              <button
                onClick={() => handleFlag(true)}
                disabled={flagging || !flagReason.trim()}
                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                {flagging ? 'Đang lưu...' : 'Xác nhận Flag'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="bg-[#111] border-white/8">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Nội dung hội thoại ({messages.length} tin nhắn)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
          {!loading && messages.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-6">Không có tin nhắn</p>
          )}
          {!loading && messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/5 text-zinc-300 rounded-tl-sm'
                    : 'bg-violet-500/10 text-violet-200 border border-violet-500/15 rounded-tr-sm'
                }`}
              >
                <p className="text-[10px] font-medium mb-1 opacity-50">
                  {msg.role === 'user' ? '👤 User' : '🤖 Mindex AI'}
                </p>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      {chat?.summary && (
        <Card className="bg-[#111] border-white/8">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Tóm tắt session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 leading-relaxed">{chat.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
