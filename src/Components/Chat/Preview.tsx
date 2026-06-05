import { useRef, useState } from 'react';
import { Monitor, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

type DeviceMode = 'desktop' | 'mobile';

export function Preview({ viewmode, url }: { viewmode: string; url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [key, setKey] = useState(0);

  if (!url) {
    return (
      <div className={`h-full flex items-center justify-center bg-slate-900 ${viewmode === "preview" ? "block" : "hidden"}`}>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <Monitor className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No preview available</p>
          <p className="text-slate-600 text-sm mt-2">
            Generate a website to see the preview
          </p>
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

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`h-full flex flex-col bg-slate-900 overflow-hidden ${viewmode === "preview" ? "block" : "hidden"} `}>
      {/* Toolbar */}
      <div className="h-12 bg-slate-800/70 border-b border-slate-700/50 flex items-center justify-between px-4 flex-shrink-0">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-slate-800/30 p-4">
        <div
          className="mx-auto h-full transition-all duration-300 rounded-lg overflow-hidden shadow-2xl border border-slate-700/50"
          style={{ width: getDeviceWidth() }}
        >
          <iframe
            src={url}
            key={key}
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