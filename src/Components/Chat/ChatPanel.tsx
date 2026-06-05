import { useState, useRef, useEffect } from 'react';
import type { FileMessage, Step } from '../../types/types.ts';
import { Send, Bot, User, Sparkles, CheckCircle2, AlertCircle, Loader } from 'lucide-react';

interface ChatPanelProps {
  messages: FileMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
}

export function ChatPanel({ messages, onSendMessage, isGenerating }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {/* Main message */}
            <div
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-tr-md'
                    : 'bg-slate-800 text-slate-200 rounded-tl-md border border-slate-700/50'
                }`}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>

            {/* Steps */}
            {message.steps && message.steps.length > 0 && (
              <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.role === 'user' ? 'hidden' : 'flex'} flex-shrink-0 w-8`} />
                <div className="max-w-[85%] space-y-2">
                  {message.steps.map((step) => (
                    <StepItem key={step.id} step={step} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 text-slate-300 px-4 py-3 rounded-2xl rounded-tl-md text-sm border border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Generating your website...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the website you want to build..."
            disabled={isGenerating}
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

interface StepItemProps {
  step: Step;
}

function StepItem({ step }: StepItemProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm space-y-1">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {step.status === 'pending' && (
            <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-emerald-400" />
          )}
          {step.status === 'in-progress' && (
            <Loader className="w-4 h-4 text-emerald-400 animate-spin" />
          )}
          {step.status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {step.status === 'error' && (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-200">{step.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{step.description}</div>
        </div>
      </div>
    </div>
  );
}
