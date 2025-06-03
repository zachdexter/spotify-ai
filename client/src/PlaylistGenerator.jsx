import React, { useState } from 'react';

const accentBlue = "#1e3a8a";
const fontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

const PlaylistGenerator = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [prompt, setPrompt] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [playlistWithImages, setPlaylistWithImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Helper to fetch track images from Spotify API
  const fetchTrackImages = async (playlistArr) => {
    // For each track, search Spotify for the track and artist, get the first result's album image
    const results = await Promise.all(
      playlistArr.map(async (item) => {
        try {
          const q = encodeURIComponent(`${item.track} ${item.artist}`);
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) throw new Error('Spotify search failed');
          const data = await res.json();
          const found = data.tracks?.items?.[0];
          return {
            ...item,
            image: found?.album?.images?.[0]?.url || null,
            spotifyUrl: found?.external_urls?.spotify || null,
          };
        } catch {
          return { ...item, image: null, spotifyUrl: null };
        }
      })
    );
    return results;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlaylist(null);
    setPlaylistWithImages(null);

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
      let content = data.playlist;

      //remove ```json if present 
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();

      // Try to parse the playlist as JSON array
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        setError('Could not parse playlist response.');
        setLoading(false);
        return;
      }
      setPlaylist(parsed);

      // Fetch images for each track
      const withImages = await fetchTrackImages(parsed);
      setPlaylistWithImages(withImages);
      setModalOpen(true);
    } catch (err) {
      setError('Error generating playlist.');
    }
    setLoading(false);
  };

  // Modal component
  const PlaylistModal = ({ open, onClose, playlist }) => {
    if (!open || !playlist) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        style={{ fontFamily: fontStack }}
      >
        <div className="bg-[#181f2a] rounded-lg shadow-lg p-8 max-w-lg w-full relative border" style={{ borderColor: accentBlue }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: accentBlue, fontFamily: `'Montserrat', ${fontStack}` }}>
            Your Generated Playlist
          </h2>
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
            {playlist.map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 bg-[#1e293b] rounded px-3 py-2">
                <img
                  src={item.image || "https://via.placeholder.com/56x56?text=No+Image"}
                  alt={item.track}
                  className="w-14 h-14 rounded object-cover border"
                  style={{ borderColor: accentBlue }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-blue-100 truncate" title={item.track}>
                    {item.track}
                  </span>
                  <span className="text-blue-300 truncate" title={item.artist}>
                    {item.artist}
                  </span>
                  {item.spotifyUrl && (
                    <a
                      href={item.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1"
                    >
                      Open in Spotify
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {playlist.length > 0 && (
          <button
            onClick={async () => {
              console.log('Creating playlist on Spotify with tracks:', playlist);
              const res = await fetch('http://localhost:5000/create-playlist', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: `AI Playlist - ${new Date().toLocaleDateString()}`,
                  tracks: playlist,
                }),
              });

              const data = await res.json();
              if (data.playlistUrl) {
                window.open(data.playlistUrl, '_blank');
              }
            }}
            className="mt-4 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Add to Spotify
          </button>
          )}
        </div>
      </div>
    );
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
      </div>
      {/* Modal for playlist */}
      <PlaylistModal open={modalOpen} onClose={() => setModalOpen(false)} playlist={playlistWithImages} />
    </div>
  );
};

export default PlaylistGenerator;
