"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, Plus, Search, ChevronRight, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateRoomModal } from "@/components/user/CreateRoomModal";
import { JoinRoomModal } from "@/components/user/JoinRoomModal";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const { data: roomsData, mutate } = useSWR<{ success: boolean; data: any[] }>("/rooms/my", fetcher as any);
  const rooms = roomsData?.data || [];
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020205] text-white p-6 md:p-10 overflow-y-auto custom-scrollbar">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent"
          >
            Phòng học nhóm
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-sm md:text-base max-w-xl"
          >
            Cùng bạn bè thảo luận, chia sẻ tài liệu và học tập hiệu quả hơn trong không gian riêng tư.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <Button 
            onClick={() => setIsJoinOpen(true)}
            variant="outline" 
            className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl px-5 h-12 gap-2"
          >
            <Search size={18} />
            <span>Tham gia</span>
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 rounded-xl px-6 h-12 gap-2 shadow-xl transition-all"
          >
            <Plus size={18} />
            <span>Tạo nhóm mới</span>
          </Button>
        </motion.div>
      </div>

      {/* ROOM LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length > 0 ? (
          rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index % 10) }}
            >
              <Link href={`/rooms/${room.id}`}>
                <Card className="group relative bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 overflow-hidden rounded-2xl h-full flex flex-col p-6">
                  {/* Glass highlight effect */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-all duration-700" />
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:scale-110 transition-transform duration-500">
                      <Users size={24} />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {room.member_count}/5 THÀNH VIÊN
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-sm text-white/30 line-clamp-2 mb-4">
                      {room.description || "Phòng học tập chung để trao đổi kiến thức và tài liệu."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10 mt-auto">
                    <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                      <MessageSquare size={14} />
                      <span className="text-xs">Vào thảo luận</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-zinc-700 group-hover:text-white transition-all duration-300">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-white/60 mb-2">Bạn chưa tham gia nhóm nào</h3>
            <p className="text-white/30 max-w-md mb-8 text-sm">
              Hãy tạo một nhóm mới hoặc tham gia nhóm của bạn bè để bắt đầu học tập cùng nhau.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => setIsJoinOpen(true)}
                variant="outline" 
                className="bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              >
                Tham gia ngay
              </Button>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"
              >
                Tạo nhóm mới
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateRoomModal 
        isOpen={isCreateOpen} 
        onClose={() => {
          setIsCreateOpen(false);
          mutate();
        }} 
      />
      <JoinRoomModal 
        isOpen={isJoinOpen} 
        onClose={() => {
          setIsJoinOpen(false);
          mutate();
        }} 
      />
    </div>
  );
}
