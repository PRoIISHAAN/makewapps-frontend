import { Button } from '../../ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export const HeroSection = () => {
  const scrollToPrompt = () => {
    document.getElementById('prompt-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
      
      {/* Glow orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-6 py-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 glow-blue-soft">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Powered by Advanced AI</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
            Build Websites
            <span className="block bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-clip-text text-transparent animate-gradient">
              With AI Magic
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into stunning, fully functional websites in minutes. 
            No coding required. Just describe your vision, and watch it come to life.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              onClick={scrollToPrompt}
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0 px-8 py-6 text-lg font-semibold glow-blue transition-all duration-300 transform hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              onClick={scrollToPrompt}
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
            >
              Try Now
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-12 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-sm text-gray-400 mt-1">Websites Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">2 Min</div>
              <div className="text-sm text-gray-400 mt-1">Average Build Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-gray-400 mt-1">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};