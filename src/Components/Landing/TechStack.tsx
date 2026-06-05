export default function TechStack() {
  return (
    <section id="stack" className="relative py-32 md:py-44 px-6">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left content */}
          <div className="lg:col-span-5">
            <div className="font-mono-label text-[10px] text-[#00F0FF] mb-4">
              ▍ The stack we generate
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-6 leading-[0.95]">
              Built on the
              <br />
              tools the web
              <br />
              <span className="text-glow-blue">already loves.</span>
            </h2>
            <p className="text-white/55 text-base lg:text-lg leading-relaxed mb-8">
              MakeWapps outputs a clean, idiomatic codebase — every project is a
              modern <span className="text-white">React</span> front-end paired
              with a <span className="text-white">Node.js</span> back-end. No
              proprietary layers. No lock-in. Just code you'd be proud to ship.
            </p>

            <div className="flex flex-wrap gap-2">
              {["React 19", "Node.js", "Vite", "Tailwind", "MongoDB", "Express"].map(
                (t) => (
                  <span
                    key={t}
                    className="font-mono-label text-[10px] text-white/70 px-3 py-1.5 rounded-full border border-white/10 glass"
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Right - stack visualization */}
          <div className="lg:col-span-7">
            <div className="relative glass-strong rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#3B82F6]/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#1E3A8A]/20 blur-3xl" />

              {/* React Card */}
              <div className="relative beam-card glass rounded-2xl p-6 mb-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ReactLogo />
                    <div>
                      <div className="font-display text-xl tracking-tight">
                        React Frontend
                      </div>
                      <div className="font-mono-label text-[9px] text-white/40 mt-0.5">
                        Component · State · Routing
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-label text-[9px] text-[#3B82F6]">
                    GENERATED
                  </span>
                </div>
                <pre className="font-mono text-[11px] text-white/60 bg-black/40 rounded-lg p-4 overflow-x-auto">
{`export default function App() {
  return <Dashboard user={current} />;
}`}
                </pre>
              </div>

              {/* Connection */}
              <div className="flex items-center justify-center my-2">
                <div className="h-8 w-px bg-gradient-to-b from-[#3B82F6] to-[#1E3A8A]" />
              </div>

              {/* Node Card */}
              <div className="relative beam-card glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <NodeLogo />
                    <div>
                      <div className="font-display text-xl tracking-tight">
                        Node.js Backend
                      </div>
                      <div className="font-mono-label text-[9px] text-white/40 mt-0.5">
                        REST · Auth · Database
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-label text-[9px] text-[#1E3A8A]">
                    GENERATED
                  </span>
                </div>
                <pre className="font-mono text-[11px] text-white/60 bg-black/40 rounded-lg p-4 overflow-x-auto">
{`app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(user);
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ReactLogo = () => (
  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#3B82F6]" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </g>
    </svg>
  </div>
);

const NodeLogo = () => (
  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#60A5FA]" fill="currentColor">
      <path d="M12 1.5l9.5 5.5v10L12 22.5 2.5 17V7L12 1.5zm0 2.3L4.5 8v8L12 20l7.5-4V8L12 3.8z" />
    </svg>
  </div>
);