import { Code2, Server } from 'lucide-react';
import { technologies } from '../../mock';

const iconMap: Record<string, any> = {
  Code2,
  Server,
};

export const TechnologySection = () => {
  return (
    <section id="technology" className="relative py-32 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Built with Modern Tech
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Leveraging the most powerful and popular web technologies
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {technologies.map((tech) => {
            const Icon = iconMap[tech.icon];
            return (
              <div 
                key={tech.id}
                className="group relative p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500"
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center glow-blue-soft">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">{tech.name}</h3>
                  </div>
                  
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {tech.description}
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