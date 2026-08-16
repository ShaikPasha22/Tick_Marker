export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow animate-pulse-slow">
          <span className="text-white font-bold text-2xl">✓</span>
        </div>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading TickMark...</p>
      </div>
    </div>
  );
}
