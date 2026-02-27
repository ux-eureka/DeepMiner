import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Download, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useChatFlow } from '../../hooks/useChatFlow';
import { QUESTIONS_CONFIG } from '../../data/questionsConfig';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export const ReportModal: React.FC = () => {
  const { state, dispatch } = useChatFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportReady, setReportReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.isReportModalOpen) return null;

  const mode = state.currentMode ? QUESTIONS_CONFIG[state.currentMode] : null;

  // Auto-generate report when modal opens
  useEffect(() => {
    if (state.isReportModalOpen && !reportReady && !isGenerating) {
        generateReport();
    }
  }, [state.isReportModalOpen]);

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setReportReady(false);

    try {
        // Simulate API analysis phases
        const steps = ['正在解析对话上下文...', '正在提取关键业务指标...', '正在生成诊断建议...', '正在排版报告文档...'];
        
        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work
            setProgress(((i + 1) / steps.length) * 90);
        }

        // Finalize
        setProgress(100);
        setReportReady(true);
        triggerConfetti();
        
    } catch (err) {
        console.error("Report generation failed:", err);
        setError("报告生成失败，请稍后重试。");
    } finally {
        setIsGenerating(false);
    }
  };

  const triggerConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
  };

  const handleDownloadPDF = () => {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;
      const lineHeight = 10;
      const pageHeight = doc.internal.pageSize.height;

      // Title
      doc.setFontSize(20);
      doc.text(mode?.mode_name || 'Analysis Report', margin, y);
      y += 15;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, y);
      y += 20;

      // Content
      doc.setFontSize(12);
      doc.setTextColor(0);

      state.messages.filter(m => m.type === 'user').forEach((msg) => {
          const phaseId = msg.phase || 'Unknown';
          const phase = mode?.phases[phaseId];
          
          // Check page break
          if (y > pageHeight - 40) {
              doc.addPage();
              y = 20;
          }

          // Phase Title
          doc.setFont(undefined, 'bold');
          doc.setTextColor(50);
          doc.text(`Phase ${phaseId}: ${phase?.title || 'General'}`, margin, y);
          y += 8;

          // User Answer
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0);
          const splitText = doc.splitTextToSize(msg.content, 170); // Wrap text
          doc.text(splitText, margin, y);
          y += (splitText.length * 7) + 10; // Adjust spacing based on lines
      });

      doc.save(`DeepMiner_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center">
             {isGenerating ? (
                 <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-3" />
             ) : reportReady ? (
                 <CheckCircle className="w-6 h-6 text-emerald-500 mr-3" />
             ) : (
                 <FileText className="w-6 h-6 text-slate-500 mr-3" />
             )}
             <h3 className="text-xl font-bold text-zinc-800">
                 {isGenerating ? 'Generating Report...' : reportReady ? 'Diagnostic Report Ready' : 'Analysis Report'}
             </h3>
          </div>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_REPORT_MODAL', payload: false })}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 relative">
            
            {/* Loading Overlay / Progress */}
            {isGenerating && (
                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-4">
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                            <span>正在深度分析业务逻辑...</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 text-center animate-pulse">
                            正在调用 DeepMiner 核心引擎进行数据交叉验证...
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-800 mb-2">生成出错</h3>
                    <p className="text-zinc-500 mb-6">{error}</p>
                    <button 
                        onClick={generateReport}
                        className="px-4 py-2 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 text-sm font-medium"
                    >
                        重试
                    </button>
                </div>
            )}

            {/* Report Content (Preview) */}
            {!error && (
                <div className={`bg-white border border-zinc-200 rounded-lg shadow-sm p-8 max-w-4xl mx-auto transition-opacity duration-500 ${isGenerating ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
                    <div className="mb-8 border-b border-zinc-100 pb-6">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2">{mode?.mode_name || 'Analysis Report'}</h1>
                        <p className="text-zinc-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-8">
                        {/* Render Chat History as Report */}
                        {state.messages.filter(m => m.type === 'user').map((msg) => {
                            const phaseId = msg.phase || 'Unknown';
                            const phase = mode?.phases[phaseId];
                            return (
                                <div key={msg.id} className="border-l-4 border-slate-200 pl-4 py-1">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">
                                        Phase {phaseId}: {phase?.title}
                                    </h4>
                                    <div className="text-zinc-800 text-base leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-12 pt-8 border-t border-zinc-200 text-center">
                        <p className="text-zinc-400 text-sm italic">End of Report</p>
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end px-8 py-5 bg-white border-t border-zinc-200 gap-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_REPORT_MODAL', payload: false })}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
          >
            Close
          </button>
          
          {reportReady && (
              <button
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-sm flex items-center animate-in fade-in slide-in-from-bottom-2"
                onClick={handleDownloadPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
