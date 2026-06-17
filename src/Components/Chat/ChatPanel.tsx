import { useState, useRef, useEffect } from "react";
import type { FileMessage, Step } from "../../types/types.ts";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Oval, ThreeDots } from "react-loader-spinner";

interface ChatPanelProps {
  messages: FileMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden flex-col">
      {/* Messages */}
      <div className="flex-1 h-full overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2 message-in">
            {/* Main message */}
            {message.content && (
              <div
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
              key={message.content.length}
                className={`max-w-[95%] px-4 py-3 rounded-2xl text-sm streaming-text leading-relaxed ${
                  message.role === "user"
                    ? "bg-gray-600/40 text-white"
                    : ""
                }`}
              >
                {message.content}
              </div>
            </div>
            )}

            {/* Steps */}
            {message.steps && message.steps.length > 0 && (
              <div
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${message.role === "user" ? "hidden" : "flex"} flex-shrink-0`}
                />
                <div className="max-w-[95%] space-y-2">
                  {message.steps.map((step) => (
                    <div key={step.id} className="streaming-steps">
                      <StepItem step={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-center items-center">
            <ThreeDots
              visible={isGenerating}
              height="40"
              width="40"
              color="#7a7a7a"
              ariaLabel="three-dots-loading"
            ></ThreeDots>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the website you want to build..."
            disabled={isGenerating}
            rows={3}
            className="w-full bg-[#2c2c30] border border-[#404042] rounded-xl px-4 py-3 pr-12 focus:ring-0 text-sm text-white placeholder-[#ababac] focus:outline-none resize-none disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2.5 bottom-4 w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-white/20 mt-2 text-center">
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
    <div className="p-1 text-sm">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {step.status === "in-progress" && (
            <Oval
              height={16}
              width={16}
              color="#797979"
              secondaryColor="#595959"
              visible={true}
              ariaLabel="oval-loading"
              strokeWidth={8}
            />
          )}
          {step.status === "pending" && (
            <Oval
              height={16}
              width={16}
              color="#797979"
              secondaryColor="#595959"
              visible={true}
              ariaLabel="oval-loading"
              strokeWidth={8}
            />
          )}
          {step.status === "isStreaming" && (
            <Oval
              height={16}
              width={16}
              color="#797979"
              secondaryColor="#595959"
              visible={true}
              ariaLabel="oval-loading"
              strokeWidth={8}
            />
          )}
          {step.status === "completed" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {step.status === "error" && (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-200">{step.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {step.description}
          </div>
        </div>
      </div>
    </div>
  );
}
