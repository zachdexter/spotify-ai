import React, { useState, useRef, useEffect } from 'react';

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedPlaylist, setEditedPlaylist] = useState([]);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [showSpotifyDelayMsg, setShowSpotifyDelayMsg] = useState(false);


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
      if (content.startsWith('{') && content.includes('"playlist":')) {
        try {
          const obj = JSON.parse(content);
          if (Array.isArray(obj.playlist)) {
            content = JSON.stringify(obj.playlist);
          }
        } catch {
          // ignore, fallback to normal parsing below
        }
      }
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
        <style>
          {`
          .playlist-scroll::-webkit-scrollbar {
            width: 10px;
          }
          .playlist-scroll::-webkit-scrollbar-thumb {
            background: #232f3e;
            border-radius: 8px;
            border: 2px solid #1e3a8a;
          }
          .playlist-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .playlist-scroll {
            scrollbar-width: thin;
            scrollbar-color: #232f3e #181f2a;
          }
          `}
        </style>
        <div className="bg-[#181f2a] rounded-lg shadow-lg p-8 max-w-lg w-full relative border" style={{ borderColor: accentBlue }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
          <h2
            className="text-2xl font-bold mb-6 text-center"
            style={{
              color: "#f1f5f9", // match "Generate Playlist" text color
              fontFamily: `'Montserrat', ${fontStack}`,
              textShadow: '0 2px 12px #000a'
            }}
          >
            Your Generated Playlist
          </h2>
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto playlist-scroll">
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
            <>
              <div className="flex flex-row items-center justify-center gap-4 mt-6">
                <button
                  onClick={async () => {
                    console.log('Creating playlist on Spotify with tracks:', playlist);
                    setModalOpen(false);
                    setTimeout(() => {
                      setShowSavedMsg(true);
                      setShowSpotifyDelayMsg(true);
                      setTimeout(() => setShowSavedMsg(false), 1800);
                      setTimeout(() => setShowSpotifyDelayMsg(false), 8000);
                    }, 100);
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
                  className="px-6 py-2 rounded-full font-semibold transition text-blue-100 bg-gray-700 hover:bg-gray-800 border-2 border-green-500 shadow"
                  style={{
                    minWidth: 180,
                    fontSize: "1rem",
                  }}
                >
                  Add to Spotify
                </button>
                <button
                  onClick={() => {
                    setEditedPlaylist([...playlist]);
                    setModalOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="px-6 py-2 rounded-full font-semibold transition text-blue-100 bg-gray-700 hover:bg-gray-800 border-2 border-yellow-500 shadow"
                  style={{
                    minWidth: 180,
                    fontSize: "1rem",
                  }}
                >
                  Edit Playlist
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };


  const EditModal = ({ open, onClose }) => {
    if (!open) return null;

    const [chatPrompt, setChatPrompt] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const handleRemove = (index) => {
      const updated = [...editedPlaylist];
      updated.splice(index, 1);
      setEditedPlaylist(updated);
    };

    const handleChatSubmit = async () => {
      if (!chatPrompt) return;
      setChatLoading(true);
      try {
        const res = await fetch ('http://localhost:5000/refine-playlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: chatPrompt,
            playlist: editedPlaylist
          }),
        });
        const data = await res.json();
        let cleaned = data.playlist.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setEditedPlaylist(parsed);
        setChatPrompt('');
      } catch (err) {
        console.error('Error refining playlist:', err);
      }
      setChatLoading(false);
    };

    const handleSaveToSpotify = async () => {
      setEditError('');
      // Only send valid tracks (with both track and artist)
      const validTracks = editedPlaylist.filter(
        item => item && typeof item.track === 'string' && typeof item.artist === 'string' && item.track.trim() && item.artist.trim()
      );
      if (!validTracks.length) {
        setEditError('Playlist is empty or invalid.');
        return;
      }
      setEditModalOpen(false);
      setTimeout(() => {
        setShowSavedMsg(true);
        setShowSpotifyDelayMsg(true);
        setTimeout(() => setShowSavedMsg(false), 1800);
        setTimeout(() => setShowSpotifyDelayMsg(false), 8000);
      }, 100);
      const res = await fetch('http://localhost:5000/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Edited AI Playlist - ${new Date().toLocaleDateString()}`,
          tracks: validTracks,
        }),
      });

      const data = await res.json();
      if (data.playlistUrl) {
        window.open(data.playlistUrl, '_blank');
      }
    };

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" style={{ fontFamily: fontStack }}>
      <style>
        {`
          .playlist-scroll::-webkit-scrollbar {
            width: 10px;
          }
          .playlist-scroll::-webkit-scrollbar-thumb {
            background: #232f3e;
            border-radius: 8px;
            border: 2px solid #1e3a8a;
          }
          .playlist-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .playlist-scroll {
            scrollbar-width: thin;
            scrollbar-color: #232f3e #181f2a;
          }
        `}
      </style>
      <div className="bg-[#181f2a] rounded-lg shadow-lg p-8 max-w-lg w-full relative border" style={{ borderColor: accentBlue }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center"
          style={{
            color: "#f1f5f9",
            fontFamily: `'Montserrat', ${fontStack}`,
            textShadow: '0 2px 12px #000a'
          }}
        >
          Edit Playlist
        </h2>

        <ul className="space-y-3 max-h-[50vh] overflow-y-auto mb-4 playlist-scroll">
          {editedPlaylist.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between bg-[#1e293b] px-4 py-2 rounded">
              <div>
                <span className="text-blue-100 font-semibold">{item.track}</span>
                <span className="text-blue-300 ml-2">by {item.artist}</span>
              </div>
              <button
                onClick={() => handleRemove(idx)}
                className="text-red-400 hover:text-red-600 font-bold text-lg"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        {editError && (
          <div className="mb-2 text-red-400 text-center">{editError}</div>
        )}
        <div>
          <textarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Ask the AI to tweak the playlist (e.g., add more rock songs)..."
            className="w-full p-2 rounded bg-[#1e293b] text-blue-100 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <div className="flex flex-row gap-3 mt-2">
            <button
              onClick={handleChatSubmit}
              disabled={chatLoading}
              className="px-4 py-2 rounded font-semibold transition bg-gray-700 hover:bg-gray-800 text-blue-100 border-2 border-blue-500 shadow flex-1"
              style={{ minWidth: 0 }}
            >
              {chatLoading ? 'Talking to AI...' : 'Update Playlist'}
            </button>
            <button
              onClick={handleSaveToSpotify}
              className="px-4 py-2 rounded font-semibold transition bg-gray-700 hover:bg-gray-800 text-blue-100 border-2 border-green-500 shadow flex-1"
              style={{ minWidth: 0 }}
            >
              Save Playlist to Spotify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "#0f172a",
        color: "#e0e7ef",
        fontFamily: fontStack
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
      {/* Back to Home button in top left */}
      <button
        onClick={() => window.location.href = `/home?token=${token}`}
        className="fixed top-6 left-6 px-4 py-2 rounded-full bg-transparent hover:bg-white/10 text-blue-100 font-semibold border border-blue-900 shadow transition z-10"
        style={{
          fontFamily: fontStack,
          backdropFilter: 'blur(2px)',
        }}
      >
        ← Back to Home
      </button>
      {/* Saved message at the top of the page */}
      <div
        className={`transition-opacity duration-500 text-center mb-4 text-green-400 font-semibold text-lg ${showSavedMsg ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ minHeight: '1.5em', zIndex: 1 }}
      >
        {showSavedMsg && "Saved!"}
      </div>
      {showSpotifyDelayMsg && (
        <div
          className="transition-opacity duration-500 text-center mb-4 text-blue-300 font-medium text-base"
          style={{ minHeight: '1.5em', zIndex: 1 }}
        >
          It may take a few minutes for your playlist to appear in your Spotify library.
        </div>
      )}
      {/* Main card with homepage-like styling */}
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl border border-blue-900 p-8 flex flex-col items-center backdrop-blur-md"
        style={{
          zIndex: 1,
          color: "#e0e7ef",
          background: "rgba(30, 41, 59, 0.82)" // slightly transparent dark blue
        }}
      >
        <h1
          className="text-3xl font-bold mb-4 text-center"
          style={{
            color: "#f1f5f9",
            fontFamily: `'Montserrat', ${fontStack}`,
            textShadow: '0 2px 12px #000a'
          }}
        >
          Playlist Generator
        </h1>
        <form onSubmit={handleGenerate} className="mb-6 w-full">
          <label className="block mb-2 font-medium text-blue-200" htmlFor="prompt">
            Describe your playlist:
          </label>
          <textarea
            id="prompt"
            className="w-full p-3 rounded bg-[#1e293b] text-blue-100 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Chill songs for a rainy day, energetic workout tracks, etc. Be sure to include specific genres or artists you'd like to be included."
            required
            style={{ fontFamily: fontStack }}
          />
          <button
            type="submit"
            className="mt-4 w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-blue-100 font-semibold transition"
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
      <EditModal open={editModalOpen} onClose={() => setEditModalOpen(false)} />

    </div>
  );
};

export default PlaylistGenerator;
