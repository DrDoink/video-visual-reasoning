import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, FileText, Download, FileType } from 'lucide-react';
import { jsPDF } from "jspdf";

interface SummaryResultProps {
  summary: string;
}

const SummaryResult: React.FC<SummaryResultProps> = ({ summary }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "analysis_report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Aesthetic Constants
    const COLOR_ACCENT = [255, 198, 0]; // #FFC600
    const COLOR_BLACK = [5, 5, 5];
    const COLOR_GRAY = [60, 60, 60];
    
    let y = margin;

    // Helper: Draw Header on every page
    const drawPageHeader = () => {
       doc.setFont("helvetica", "bold");
       doc.setFontSize(8);
       doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
       doc.text("VIDEO TO VISUAL REASONING", margin, 15);
       
       doc.setFont("courier", "normal");
       doc.setFontSize(8);
       doc.setTextColor(150, 150, 150);
       const dateStr = `ID_${Date.now().toString().slice(-6)} // ${new Date().toLocaleDateString()}`;
       const dateWidth = doc.getTextWidth(dateStr);
       doc.text(dateStr, pageWidth - margin - dateWidth, 15);
       
       doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
       doc.setLineWidth(0.5);
       doc.line(margin, 20, pageWidth - margin, 20);
    };

    // Initial Setup
    drawPageHeader();
    y = 35; 

    // Document Title
    doc.setFont("times", "italic");
    doc.setFontSize(24);
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text("Analysis Results", margin, y);
    y += 15;

    // Process Content Line by Line
    const lines = summary.split('\n');
    const lineHeight = 5.5;

    lines.forEach((line) => {
        // Check for page break
        if (y > pageHeight - margin) {
            doc.addPage();
            drawPageHeader();
            y = 35;
        }

        const trimmed = line.trim();
        if (!trimmed) {
            y += lineHeight / 2;
            return;
        }

        // H2 Headers (## ) -> Large Serif
        if (trimmed.startsWith('## ')) {
            y += 8; // Extra spacing before section
            if (y > pageHeight - margin) { doc.addPage(); drawPageHeader(); y = 35; }

            const text = trimmed.replace(/^##\s+/, '');
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
            doc.text(text, margin, y);
            
            // Accent Underline
            const textWidth = doc.getTextWidth(text);
            doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, y + 2, margin + textWidth, y + 2);
            
            y += lineHeight * 2;
        }
        // H3 Headers (### ) -> Technical Mono
        else if (trimmed.startsWith('### ')) {
            y += 4;
            if (y > pageHeight - margin) { doc.addPage(); drawPageHeader(); y = 35; }
            
            const text = trimmed.replace(/^###\s+/, '');
            doc.setFont("courier", "bold");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
            doc.text(text.toUpperCase(), margin, y);
            y += lineHeight * 1.5;
        }
        // List Items (* or -) -> Indented with custom bullet
        else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            // Remove markdown syntax (*, -, **)
            const cleanText = trimmed.replace(/^[*-\s]+/, '').replace(/\*\*/g, ''); 
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2]);

            // Custom Accent Bullet
            doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
            doc.circle(margin + 2, y - 1.5, 0.8, 'F');

            const textLines = doc.splitTextToSize(cleanText, contentWidth - 8);
            
            // Block height check
            if (y + (textLines.length * lineHeight) > pageHeight - margin) {
                 doc.addPage(); drawPageHeader(); y = 35;
            }

            doc.text(textLines, margin + 8, y);
            y += textLines.length * lineHeight + 2; // Extra spacing for readability
        }
        // Standard Paragraph
        else {
            const cleanText = trimmed.replace(/\*\*/g, '');
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2]);
            
            const textLines = doc.splitTextToSize(cleanText, contentWidth);
            
            if (y + (textLines.length * lineHeight) > pageHeight - margin) {
                 doc.addPage(); drawPageHeader(); y = 35;
            }

            doc.text(textLines, margin, y);
            y += textLines.length * lineHeight;
        }
    });

    doc.save("visual-reasoning-analysis.pdf");
  };

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-white/10 pb-4 mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl text-white italic">Analysis Results</h2>
          <p className="font-mono text-[10px] text-accent mt-1 uppercase tracking-widest">
             /// Generated by Gemini 2.0
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
             <button 
                onClick={handleDownloadTxt}
                className="px-3 py-1 font-mono text-[10px] uppercase border border-neutral-800 text-neutral-400 hover:text-accent hover:border-accent transition-all"
            >
                .TXT
            </button>
            <button 
                onClick={handleDownloadPdf}
                className="px-3 py-1 font-mono text-[10px] uppercase border border-neutral-800 text-neutral-400 hover:text-accent hover:border-accent transition-all"
            >
                .PDF
            </button>
          </div>
          <button 
            onClick={handleCopy}
            className="group flex items-center gap-2 px-3 py-1 font-mono text-[10px] uppercase text-neutral-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-accent"/> : <Copy size={12} />}
            <span className="group-hover:underline decoration-accent underline-offset-4">
                {copied ? 'COPIED' : 'COPY RAW'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-12">
        <div className="hidden md:block sticky top-32 h-fit">
            <div className="border-l border-white/10 pl-6 space-y-2">
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Structure</p>
                <div className="h-px w-4 bg-accent mb-4"></div>
                <p className="font-serif italic text-neutral-400 text-sm">Executive Summary</p>
                <p className="font-serif italic text-neutral-400 text-sm">Chronological</p>
                <p className="font-serif italic text-neutral-400 text-sm">Key Takeaways</p>
            </div>
        </div>

        <div className="prose prose-invert prose-headings:font-serif prose-headings:font-normal prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:italic prose-h3:font-mono prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-accent prose-p:text-neutral-300 prose-p:font-light prose-p:leading-relaxed prose-strong:text-white prose-strong:font-normal prose-ul:list-none prose-ul:pl-0 prose-li:mb-4 prose-li:border-l prose-li:border-white/10 prose-li:pl-6 prose-li:text-neutral-400 max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default SummaryResult;