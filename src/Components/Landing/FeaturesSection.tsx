import { Sparkles, Eye, Rocket } from 'lucide-react';
import { features } from '../../mock';

const iconMap: Record<string, any> = {
  Sparkles,
  Eye,
  Rocket,
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to create, customize, and deploy stunning websites
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature: any, index: number) => {
            const Icon = iconMap[feature.icon] ?? Sparkles;
            return (
              <div 
                key={feature.id}
                className="group relative p-8 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/0 to-blue-700/0 group-hover:from-blue-500/10 group-hover:to-blue-700/10 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 glow-blue-soft group-hover:glow-blue transition-all duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};