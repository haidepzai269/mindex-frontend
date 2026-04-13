"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

// Khởi tạo Mermaid một lần duy nhất
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#a855f7", // Purple
    primaryTextColor: "#fff",
    primaryBorderColor: "#7c3aed",
    lineColor: "#6366f1", // Blue
    secondaryColor: "#1e1e2e",
    tertiaryColor: "#111111",
  },
  flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
  fontFamily: "Inter, sans-serif",
});

interface MermaidProps {
  chart: string;
}

export const MermaidRenderer: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  // Hàm làm sạch chuỗi Mermaid (NUCLEAR V2 - ULTRA SAFE)
  const sanitizeMermaid = (code: string) => {
    let clean = code.trim();
    
    // 1. Loại bỏ các khối markdown
    clean = clean.replace(/^```mermaid\s*/, "").replace(/```$/, "");

    // 2. XÓA SẠCH các ký tự gây nhiễu toàn cục
    clean = clean.replace(/\\/g, ""); // Xóa backslash

    // 3. Đảm bảo có từ khóa flowchart nếu chưa có
    if (!clean.startsWith("flowchart") && !clean.startsWith("graph") && !clean.startsWith("sequenceDiagram")) {
      clean = "flowchart TD\n" + clean;
    }

    // 4. ÉP TOÀN BỘ NODE VỀ MARKDOWN STRINGS AN TOÀN
    // Pattern: Tìm bất kỳ ID kèm theo ngoặc [ ], ( ), { }, etc.
    const shapePairs = [
      { open: "\\[\\[", close: "\\]\\]" },
      { open: "\\{\\{", close: "\\}\\}" },
      { open: "\\(\\(", close: "\\)\\)" },
      { open: "\\[", close: "\\]" },
      { open: "\\{", close: "\\}" },
      { open: "\\(", close: "\\)" },
    ];

    shapePairs.forEach(pair => {
      const regex = new RegExp(`([\\w-]+)\\s*${pair.open}(.*?)${pair.close}`, "g");
      clean = clean.replace(regex, (match, id, text) => {
        // DỌN DẸP TRIỆT ĐỂ: Xóa hết dấu huyền, ngoặc kép trong nhãn để tránh lồng nhau
        const ultraCleanText = text.replace(/[`"]/g, "").trim();
        // Ép về định dạng an toàn nhất của Mermaid 11: ID["` văn bản `"]
        return `${id}["\`${ultraCleanText}\`"]`;
      });
    });

    // 5. Xử lý nhãn trên mũi tên (cũng dùng Markdown String)
    clean = clean.replace(/--\s*([^"->\n]+?)\s*-->/g, (match, text) => {
        const ultraCleanText = text.replace(/[`"]/g, "").trim();
        return `-- "\`${ultraCleanText}\`" -->`;
    });

    // 6. Loại bỏ dấu chấm phẩy dư thừa
    clean = clean.replace(/;\s*$/gm, "");

    return clean;
  };

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || chart.length < 10 || !containerRef.current) return;
      
      const cleanChart = sanitizeMermaid(chart);
      
      try {
        // Kiểm tra cú pháp trước khi render
        console.log("DEBUG [Mermaid] Original:", chart);
        console.log("DEBUG [Mermaid] Cleaned:", cleanChart);
        
        await mermaid.parse(cleanChart, { suppressErrors: true });
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        
        console.log("DEBUG [Mermaid] Render Output:", svg.substring(0, 500));
        
        // NẾU SVG CHỨA LỖI (QUẢ BOM), HÃY ẨN NÓ ĐI
        if (svg.includes("mermaid-error-explanation") || svg.includes("Syntax error")) {
          setSvg(""); // Xóa sạch SVG cũ để không hiện bomb
          setError(true);
          return;
        }

        setSvg(svg);
        setError(false);
      } catch (err) {
        // Nếu parse lỗi hoặc render lỗi, hiển thị trạng thái chờ
        setError(true);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-4 group">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
          <Loader2 size={24} className="text-primary/40 animate-spin relative z-10" />
        </div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic group-hover:text-primary/40 transition-colors text-center">
          Đang tối ưu cấu trúc sơ đồ... <br/>
          <span className="opacity-50 font-medium normal-case">Vui lòng chờ AI hoàn thiện dữ liệu</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container w-full overflow-hidden flex justify-center py-10 bg-white/[0.01] border border-white/5 rounded-[40px] shadow-2xl transition-all hover:bg-white/[0.03] group"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
