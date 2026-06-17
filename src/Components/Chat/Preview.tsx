import { useRef, useState } from 'react';
import { Monitor } from 'lucide-react';

type DeviceMode = 'desktop' | 'mobile';

export function Preview({ viewmode, url, iFrameKey, isGenerating }: { viewmode: string; url: string; iFrameKey: number; isGenerating: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  if (!url && !isGenerating) {
    return (
      <div className={`h-full flex items-center justify-center ${viewmode === "preview" ? "block" : "hidden"}`}>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Monitor className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/50 text-lg font-medium">No preview available</p>
          <p className="text-white/20 text-sm mt-2">
            Generate a website to see the preview
          </p>
        </div>
      </div>
    );
  }

  else if( isGenerating){
    return (
      <div className={`h-full flex items-center justify-center ${viewmode === "preview" ? "block" : "hidden"}`}>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Monitor className="w-10 h-10 text-white/20" />
          </div>
          <p className="sweep-text text-lg font-medium">Your Preview will appear Here</p>
        </div>
      </div>
    );
  }

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'desktop':
        return '100%';
      case 'mobile':
        return '375px';
    }
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden ${viewmode === "preview" ? "block" : "hidden"} `}>
      {/* Toolbar feature addition for future */}
      {/* <div className="h-12 bg-slate-800/70 border-b border-slate-700/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-2 rounded-md transition-all ${
              deviceMode === 'desktop'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
            }`}
            title="Desktop view"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-2 rounded-md transition-all ${
              deviceMode === 'mobile'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
            }`}
            title="Mobile view"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div> */}

      {/* Preview Area */}
      <div className="flex-1 overflow-auto">
        <div
          className="mx-auto h-full transition-all duration-300 rounded-lg overflow-hidden"
          style={{ width: getDeviceWidth() }}
        >
          <iframe
            src={url}
            key={iFrameKey}
            ref={iframeRef}
            title="Preview"
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

export default Preview;