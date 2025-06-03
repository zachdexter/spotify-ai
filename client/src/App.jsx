import React from 'react';
import './index.css';

const accentBlue = "#1e3a8a";
const fontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

function App() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden animate-gradientMove"
      style={{
        fontFamily: fontStack,
        background: 'linear-gradient(-45deg, #0f172a, #1e3a8a, #15803d, #191414)',
        backgroundSize: '400% 400%',
      }}
    >
      {/* Animated gradient keyframes */}
      <style>
        {`
          @keyframes gradientMove {
            0% {background-position: 0% 50%;}
            50% {background-position: 100% 50%;}
            100% {background-position: 0% 50%;}
          }
          .animate-gradientMove {
            animation: gradientMove 12s ease-in-out infinite;
          }
        `}
      </style>
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        <h1
          className="text-6xl font-extrabold mb-6 text-center tracking-tight drop-shadow-lg"
          style={{
            color: "#fff",
            fontFamily: `'Montserrat', ${fontStack}`,
            letterSpacing: '0.01em',
            textShadow: '0 4px 32px #000a'
          }}
        >
          Spotify Stats
        </h1>
        <button
          onClick={handleLogin}
          className="px-10 py-4 rounded-full bg-[#1ed760] text-[#191414] font-bold text-2xl shadow-xl transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#1ed760]/40"
          style={{
            boxShadow: '0 8px 32px 0 #1ed76044',
            fontFamily: fontStack,
            letterSpacing: '0.02em'
          }}
        >
          Log in with Spotify
        </button>
      </div>
      <footer className="absolute bottom-6 left-0 w-full text-center text-blue-200 text-sm opacity-70 z-10" style={{fontFamily: fontStack}}>
        Made with <span style={{color: accentBlue}}>React</span> & <span style={{color: "#1ed760"}}>Spotify</span>
      </footer>
    </div>
  );
}

export default App;
