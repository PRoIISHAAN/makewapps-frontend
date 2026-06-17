import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/TextArea";
import { Send, Sparkles } from "lucide-react";

export const PromptSection = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      sessionStorage.removeItem("chat-session");
      navigate("/chat", { state: { prompt } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section
      id="prompt-section"
      className="relative py-32 bg-gradient-to-b from-gray-900 to-black"
    >
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-700/20 border border-blue-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">
                Start Building Now
              </span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Describe Your Vision
            </h2>
            <p className="text-xl text-gray-400">
              Tell us what you want to build, and our AI will bring it to life
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., Create a modern e-commerce website for selling handmade jewelry with a clean, elegant design..."
                className="min-h-[200px] text-lg bg-white/5 border-white/10 backdrop-blur-xl text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none transition-all duration-300"
              />

              {/* Character count */}
              <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                {prompt.length} characters
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                type="submit"
                disabled={!prompt.trim()}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0 px-12 py-6 text-lg font-semibold glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                Generate Website
                <Send className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-sm text-gray-500">
                Free trial • No credit card required
              </p>
            </div>
          </form>

          {/* Example prompts */}
          <div className="mt-12">
            <p className="text-sm text-gray-500 mb-4 text-center">
              Try these examples:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Portfolio website for a photographer",
                "Restaurant landing page with menu",
                "Tech startup homepage",
                "Personal blog with dark theme",
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 text-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
