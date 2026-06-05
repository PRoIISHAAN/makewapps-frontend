
export const Footer = () => {
  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">MakeWapps</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              Transform your ideas into stunning, fully functional websites with the power of AI. 
              No coding required.
            </p>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#technology" className="text-gray-400 hover:text-white transition-colors duration-200">Technology</a></li>
              <li><a href="#showcase" className="text-gray-400 hover:text-white transition-colors duration-200">Showcase</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200">Pricing</a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors duration-200">About</a></li>
              <li><a href="#blog" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</a></li>
              <li><a href="#careers" className="text-gray-400 hover:text-white transition-colors duration-200">Careers</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm">
            © 2025 MakeWapps. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Privacy Policy</a>
            <a href="#terms" className="text-gray-500 hover:text-white text-sm transition-colors duration-200">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};