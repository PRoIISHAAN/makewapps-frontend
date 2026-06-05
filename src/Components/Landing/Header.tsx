import { Button } from '../../ui/button';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center glow-blue">
            <span className="text-black font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">MakeWapps</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-200">Features</a>
          <a href="#technology" className="text-gray-300 hover:text-white transition-colors duration-200">Technology</a>
          <a href="#showcase" className="text-gray-300 hover:text-white transition-colors duration-200">Showcase</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">Login</Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0 glow-blue-soft transition-all duration-300">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};