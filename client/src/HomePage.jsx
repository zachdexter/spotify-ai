import React, { useEffect, useState } from 'react';
import './index.css';

const accentBlue = "#1e3a8a"; // Tailwind blue-800
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

  if (!user) return <p className="text-white bg-black min-h-screen flex items-center justify-center" style={{ fontFamily: fontStack }}>Loading...</p>;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, #0f172a 0%, ${accentBlue} 100%)`,
        color: "#e0e7ef",
        fontFamily: fontStack
      }}
    >
      {/* Logout Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          Log Out
        </button>
      </div>

      {/* Profile Info */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: "#fff", fontFamily: `'Montserrat', ${fontStack}` }}
        >
          Welcome, {user.name}
        </h1>
        {user.profilePicture && (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="rounded-full w-36 h-36 mx-auto border-4"
            style={{ borderColor: accentBlue, boxShadow: `0 0 24px 0 ${accentBlue}80` }}
          />
        )}
      </div>

      {/* Time Range Selector */}
      <div className="text-center mb-6">
        <label htmlFor="timeRange" className="mr-2 font-medium text-blue-200">Time Range:</label>
        <select
          id="timeRange"
          className="px-3 py-1 rounded bg-[#1e293b] text-blue-100 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="long_term">All Time</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="short_term">Last Month</option>
        </select>
      </div>

      {/* Centered Columns Container */}
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Artists Column */}
          <div
            className="flex-1 p-4 rounded-lg shadow"
            style={{
              background: "#111827",
              border: `1.5px solid ${accentBlue}`,
              boxShadow: `0 2px 16px 0 #0008`,
              fontFamily: fontStack,
              maxWidth: 440,
              minWidth: 0
            }}
          >
            <h2
              className="text-2xl font-semibold mb-4 text-center"
              style={{ color: accentBlue, fontFamily: `'Montserrat', ${fontStack}` }}
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
                  <li key={index} className="flex items-center gap-4 min-w-0">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-12 h-12 rounded border-2 flex-shrink-0"
                      style={{ borderColor: accentBlue }}
                    />
                    <span
                      className="text-lg font-medium text-blue-100 truncate"
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

          {/* Tracks Column */}
          <div
            className="flex-1 p-4 rounded-lg shadow"
            style={{
              background: "#111827",
              border: `1.5px solid ${accentBlue}`,
              boxShadow: `0 2px 16px 0 #0008`,
              fontFamily: fontStack,
              maxWidth: 440,
              minWidth: 0
            }}
          >
            <h2
              className="text-2xl font-semibold mb-4 text-center"
              style={{ color: accentBlue, fontFamily: `'Montserrat', ${fontStack}` }}
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
                  <li key={index} className="flex items-center gap-4 min-w-0">
                    <img
                      src={track.image}
                      alt={track.name}
                      className="w-12 h-12 rounded border-2 flex-shrink-0"
                      style={{ borderColor: accentBlue }}
                    />
                    <span
                      className="text-lg font-medium text-blue-100 truncate"
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
      </div>
    </div>
  );
};

export default HomePage;
