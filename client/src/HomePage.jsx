import React, { useEffect, useState, useRef } from 'react';
import './index.css';

const accentBlue = "#1e3a8a";
const accentGreen = "#1ed760";
const fontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

// Helper to truncate text
function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('long_term'); // default time range
  const [loading, setLoading] = useState(true);

  // Get token from URL params (make available for logout)
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  

  useEffect(() => {
    // get token from URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    console.log("token from URL:", token);

    if (!token) {
      console.error('No access token found');
      return;
    }
    setLoading(true);

    // send request to backend to get user's profile and top artists, tracks 
    fetch(`http://localhost:5000/homepage?timeRange=${timeRange}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json()) // parse resopnse as json
      // set user state with the response data
      .then(data => {
        console.log("received user data.", data);
        setUser(data);
        setLoading(false);
       }) 
      .catch(err => {
        console.error('Failed to fetch user', err);
        setLoading(false); // stop loading even if error
    });

  }, [timeRange]); // re-run effect if timeRange changes

  // Logout handler
  const handleLogout = async () => {
    if (!token) return;
    try {
      await fetch(`http://localhost:5000/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // ignore error, just continue
    }
    window.location.href = '/';
  };


  // Generate star positions only once on mount
  const starsRef = useRef([]);
  if (starsRef.current.length === 0) {
    starsRef.current = Array.from({ length: 40 }).map(() => {
      const size = Math.random() * 2 + 1.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 2 + Math.random() * 2;
      const delay = Math.random() * 4;
      return { size, left, top, duration, delay };
    });
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: fontStack, background: "#0f172a" }}>
      <span className="text-blue-100 text-xl">Loading...</span>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: fontStack,
        background: "#0f172a",
        position: "relative",
      }}
    >
      {/* Twinkling stars background */}
      <style>
        {`
        .starfield {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #e0e7ef;
          opacity: 0.7;
          animation: twinkle 2.5s infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.2; }
        }
        `}
      </style>
      <div className="starfield" style={{zIndex: 0}}>
        {starsRef.current.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              boxShadow: `0 0 ${star.size * 4}px ${star.size / 2}px #e0e7ef88`,
              zIndex: 0,
            }}
          />
        ))}
      </div>
      {/* Button Bar */}
      <div className="w-full flex justify-center mt-8 mb-6" style={{zIndex: 1}}>
        <div className="flex gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl border border-blue-900 items-center">
          <button
            onClick={() => window.location.href = `/playlist-generator?token=${token}`}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-800 text-blue-100 font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ fontFamily: fontStack, letterSpacing: '0.01em' }}
          >
            {/* Music note icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 17V5a1 1 0 0 1 .76-.97l8-2A1 1 0 0 1 19 3v12.13A3.99 3.99 0 1 1 17 17V7.28l-6 1.5V17a3.99 3.99 0 1 1-2-3.47V5a1 1 0 0 1 .76-.97l8-2A1 1 0 0 1 19 3v12.13A3.99 3.99 0 1 1 17 17V7.28l-6 1.5V17a3.99 3.99 0 1 1-2-3.47z"/>
            </svg>
            Generate Playlist
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-800 text-blue-100 font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ fontFamily: fontStack, letterSpacing: '0.01em' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-900 p-8 flex flex-col items-center mb-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {user.profilePicture && (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="rounded-full w-36 h-36 border-4 shadow-lg"
                style={{ borderColor: accentBlue, boxShadow: `0 0 32px 0 ${accentBlue}80` }}
              />
            )}
            <span className="absolute bottom-2 right-2 bg-green-500 rounded-full w-5 h-5 border-2 border-white"></span>
          </div>
          <h1
            className="text-4xl font-extrabold mt-4 mb-1 text-center tracking-tight"
            style={{ color: "#fff", fontFamily: `'Montserrat', ${fontStack}` }}
          >
            {user.name}
          </h1>
          <span className="text-blue-200 text-lg font-medium tracking-wide">Spotify Listener</span>
        </div>
        {/* Centered Top Stats Section */}
        <div className="flex flex-col items-center w-full">
          <span className="text-blue-200 font-medium mb-1 text-xl text-center">Your Top Stats</span>
          <span className="text-blue-400 text-sm opacity-70 mb-2 text-center">Based on your Spotify listening</span>
          {/* Add your personalized stat here */}
          <div className="mt-2 text-lg text-blue-100 font-semibold text-center min-h-[2.5rem]">
            {/* Example: */}
            {/* You listened to 1,234 unique tracks this year! */}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="w-full max-w-5xl flex flex-col items-center mb-6">
        <label htmlFor="timeRange" className="mb-2 text-lg font-semibold text-blue-100 tracking-wide">
          Sort Top Artists & Tracks By:
        </label>
        <select
          id="timeRange"
          className="px-4 py-2 rounded-lg bg-[#1e293b] text-blue-100 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="long_term">All Time</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="short_term">Last Month</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Artists */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-blue-900 p-6 flex flex-col">
          <h2
            className="text-2xl font-bold mb-4 text-center tracking-wide"
            style={{
              color: "#f1f5f9", // much lighter for contrast
              fontFamily: `'Montserrat', ${fontStack}`,
              textShadow: '0 2px 12px #000a'
            }}
          >
            Top 10 Artists
          </h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="inline-block w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <ul className="space-y-4">
              {user.artists.slice(0, 10).map((artist, index) => (
                <li key={index} className="flex items-center gap-4 min-w-0 group hover:bg-blue-900/30 rounded-lg px-2 py-1 transition">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-12 h-12 rounded border-2 flex-shrink-0 shadow"
                    style={{ borderColor: accentBlue }}
                  />
                  <span
                    className="text-lg font-medium text-blue-100 truncate group-hover:text-green-300 transition"
                    style={{
                      maxWidth: 270,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                    title={artist.name}
                  >
                    {truncate(artist.name, 40)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Tracks */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-blue-900 p-6 flex flex-col">
          <h2
            className="text-2xl font-bold mb-4 text-center tracking-wide"
            style={{
              color: "#f1f5f9", // much lighter for contrast
              fontFamily: `'Montserrat', ${fontStack}`,
              textShadow: '0 2px 12px #000a'
            }}
          >
            Top 10 Tracks
          </h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="inline-block w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <ul className="space-y-4">
              {user.tracks.slice(0, 10).map((track, index) => (
                <li key={index} className="flex items-center gap-4 min-w-0 group hover:bg-blue-900/30 rounded-lg px-2 py-1 transition">
                  <img
                    src={track.image}
                    alt={track.name}
                    className="w-12 h-12 rounded border-2 flex-shrink-0 shadow"
                    style={{ borderColor: accentBlue }}
                  />
                  <span
                    className="text-lg font-medium text-blue-100 truncate group-hover:text-green-300 transition"
                    style={{
                      maxWidth: 270,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                    title={track.name}
                  >
                    {truncate(track.name, 40)}
                    <span className="text-blue-300">
                      {" by "}
                      {truncate(track.artist, 40)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <footer className="w-full text-center text-blue-200 text-xs opacity-70 mb-2" style={{fontFamily: fontStack}}>
        &copy; {new Date().getFullYear()} Spotify Stats &mdash; Not affiliated with Spotify
      </footer>
    </div>
  );
};

export default HomePage;
