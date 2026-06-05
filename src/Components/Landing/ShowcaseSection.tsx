import { useState } from 'react';
import { showcaseWebsites } from '../../mock';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';

export const ShowcaseSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % showcaseWebsites.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + showcaseWebsites.length) % showcaseWebsites.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <section id="showcase" className="relative py-32 bg-black overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Generated Masterpieces
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore stunning websites created by our AI in seconds
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Main carousel */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl glow-blue-soft">
            <div className="relative w-full h-full">
              {showcaseWebsites.map((site, index) => (
                <div
                  key={site.id}
                  className={`absolute inset-0 transition-all duration-500 ${
                    index === currentIndex 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <img
                    src={site.image}
                    alt={site.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{site.title}</h3>
                    <p className="text-gray-300 mb-4">{site.description}</p>
                    <div className="flex items-center space-x-2">
                      {site.tech.map((tech, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation buttons */}
            <Button
              onClick={prevSlide}
              disabled={isAnimating}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-50 transition-all duration-300"
              size="icon"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Button>
            
            <Button
              onClick={nextSlide}
              disabled={isAnimating}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-50 transition-all duration-300"
              size="icon"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </Button>
          </div>
          
          {/* Dots navigation */}
          <div className="flex items-center justify-center space-x-3 mt-8">
            {showcaseWebsites.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-12 h-3 bg-gradient-to-r from-blue-500 to-blue-700'
                    : 'w-3 h-3 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};