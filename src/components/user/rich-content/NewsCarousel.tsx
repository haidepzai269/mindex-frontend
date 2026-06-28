"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { NewsResult, NewsItem } from "@/types/rich-content";
import { fetchMoreNews } from "@/lib/api/tools";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink, AlertCircle } from "lucide-react";

const MAX_ARTICLES = 100;

interface NewsCarouselProps {
  data: NewsResult;
  className?: string;
}

function NewsCard({ article }: { article: NewsItem }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-64 rounded-lg border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      {article.image_url && (
        <div className="w-full h-32 overflow-hidden bg-muted">
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {article.title}
        </h4>
        {article.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="font-medium truncate max-w-[120px]">{article.source}</span>
          <span className="flex items-center gap-0.5">
            <ExternalLink size={10} />
            Đọc thêm
          </span>
        </div>
      </div>
    </a>
  );
}

export function NewsCarousel({ data, className }: NewsCarouselProps) {
  const [articles, setArticles] = useState<NewsItem[]>(data.articles);
  const [nextPageToken, setNextPageToken] = useState<string | null>(data.next_page_token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialCategory = data.articles[0]?.category || "top";

  async function loadMore() {
    if (!nextPageToken || loading || articles.length >= MAX_ARTICLES) return;
    setLoading(true);
    setError(false);
    try {
      const result = await fetchMoreNews({ category: initialCategory, page_token: nextPageToken });
      setArticles((prev) => {
        const combined = [...prev, ...result.articles];
        return combined.slice(0, MAX_ARTICLES);
      });
      setNextPageToken(result.next_page_token);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (!articles.length) return null;

  const canLoadMore = nextPageToken && articles.length < MAX_ARTICLES;

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tin tức
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Cuộn trái"
          >
            <ChevronLeft size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Cuộn phải"
          >
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {articles.map((article, i) => (
          <NewsCard key={`${article.url}-${i}`} article={article} />
        ))}

        {canLoadMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex-shrink-0 w-32 rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : error ? (
              <>
                <AlertCircle size={16} className="text-destructive" />
                <span className="text-xs">Thử lại</span>
              </>
            ) : (
              <>
                <ChevronRight size={16} />
                <span className="text-xs">Tìm thêm</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
