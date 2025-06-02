import React, { useState } from 'react';

const accentBlue = "#1e3a8a";
const fontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

const PlaylistGenerator = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [prompt, setPrompt] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlaylist(null);

    try {
      const res = await fetch('http://localhost:5000/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate playlist');
      }

      const data = await res.json();

      console.log('Received playlist data:', data);
      // Try to parse the playlist as JSON array
      let parsed = [];
      try {
        parsed = JSON.parse(data.playlist);
      } catch {
        setError('Could not parse playlist response.');
        setLoading(false);
        return;
      }
      setPlaylist(parsed);
    } catch (err) {
      setError('Error generating playlist.');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: `linear-gradient(135deg, #0f172a 0%, ${accentBlue} 100%)`,
        color: "#e0e7ef",
        fontFamily: fontStack
      }}
    >
      <div className="w-full max-w-xl bg-[#111827] rounded-lg shadow-lg p-8 border" style={{ borderColor: accentBlue }}>
        <div className="flex justify-between mb-6">
          <button
            onClick={() => window.location.href = `/home?token=${token}`}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white font-semibold transition"
          >
            ← Back to Home
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-center" style={{ color: accentBlue, fontFamily: `'Montserrat', ${fontStack}` }}>
          Playlist Generator
        </h1>
        <form onSubmit={handleGenerate} className="mb-6">
          <label className="block mb-2 font-medium text-blue-200" htmlFor="prompt">
            Describe your playlist:
          </label>
          <textarea
            id="prompt"
            className="w-full p-3 rounded bg-[#1e293b] text-blue-100 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Chill songs for a rainy day, energetic workout tracks, etc."
            required
            style={{ fontFamily: fontStack }}
          />
          <button
            type="submit"
            className="mt-4 w-full px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="inline-block w-5 h-5 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mr-2"></span>
                Generating...
              </span>
            ) : (
              'Generate Playlist'
            )}
          </button>
        </form>
        {error && (
          <div className="mb-4 text-red-400 text-center">{error}</div>
        )}
        {playlist && (
          <div>
            <h2 className="text-xl font-semibold mb-3 text-blue-200 text-center">Your Playlist</h2>
            <ul className="space-y-3">
              {playlist.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 bg-[#1e293b] rounded px-4 py-2"
                  style={{ borderLeft: `4px solid ${accentBlue}` }}
                >
                  <span className="font-bold text-blue-100">{item.track}</span>
                  <span className="text-blue-300">by {item.artist}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistGenerator;
