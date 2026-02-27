import React from 'react';
import { Lightbulb, Target, ArrowRight, MessageSquare, FileText, MousePointerClick } from 'lucide-react';

export const WelcomeGuide: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
      {/* 头部欢迎语 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">
          👋 嗨，我是你的产品思维伙伴 DeepMiner
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          别担心，这里没有死板的问卷。我会像一位犀利的咨询师，陪你聊透产品的<span className="text-slate-700 font-semibold">商业价值</span>与<span className="text-slate-700 font-semibold">用户痛点</span>。
        </p>
      </div>

      {/* 核心价值卡片 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-zinc-800 mb-2">精准定位</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            不想做“自嗨”的功能？我会帮你撕开表象，找到用户最原始的欲望和业务最核心的利益。
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-zinc-800 mb-2">深度对话</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            我会追问、反驳、启发。就像和一位资深专家面对面，把模糊的想法变成清晰的策略。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-zinc-800 mb-2">自动报告</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            聊完即出结果。对话自动转化为结构化的诊断报告，直接汇报给老板或团队。
          </p>
        </div>
      </div>

      {/* 简明操作指引 */}
      <div className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100">
        <h2 className="text-lg font-bold text-zinc-800 mb-6 flex items-center">
          🚀 3步开启诊断之旅
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-600 text-sm shadow-sm mt-0.5">
              1
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-zinc-800 flex items-center">
                选择模式
                <MousePointerClick className="w-4 h-4 ml-2 text-zinc-400" />
              </h4>
              <p className="text-sm text-zinc-500 mt-1">
                点击右下角输入框旁的<span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-xs font-mono mx-1">选择模式</span>按钮。C 端选增长，B 端选效率。
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-600 text-sm shadow-sm mt-0.5">
              2
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-zinc-800 flex items-center">
                真诚回答
                <MessageSquare className="w-4 h-4 ml-2 text-zinc-400" />
              </h4>
              <p className="text-sm text-zinc-500 mt-1">
                我会抛出 5-6 个关键问题。请用大白话回答，越真实越好，不需要华丽的词藻。
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-600 text-sm shadow-sm mt-0.5">
              3
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-zinc-800 flex items-center">
                获取报告
                <FileText className="w-4 h-4 ml-2 text-zinc-400" />
              </h4>
              <p className="text-sm text-zinc-500 mt-1">
                通关后，我会为你生成一份完整的诊断建议书，支持导出 PDF。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部反馈 */}
      <div className="text-center border-t border-zinc-100 pt-8">
        <p className="text-sm text-zinc-400">
          遇到问题或有新想法？欢迎随时 <a href="mailto:support@deepminer.ai" className="text-slate-600 hover:text-slate-800 underline underline-offset-2 transition-colors">告诉我们</a>
        </p>
      </div>
    </div>
  );
};
