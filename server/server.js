// server/server.js
const express = require('express'); // import framework
const cors = require('cors'); // import cors for cross-origin resource sharing
require('dotenv').config(); // load environment variables from .env file

const app = express(); // create express app
app.use(cors()); // enable CORS

// test route to confirm backend is alive
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

const spotifyWebApi = require('spotify-web-api-node'); // import spotify-web-api-node

const userSpotifyApis = new Map(); 

const scopes = [
  'user-read-private', // Read user's private data
  'user-read-email', // Read user's email address
  'playlist-read-private', // Read user's private playlists
  'user-top-read', // Read user's top tracks and artists
  'user-library-read', // Read user's saved tracks and albums
  'playlist-modify-public', // Create and modify public playlists
  'playlist-modify-private', // Create and modify private playlists
];

const createSpotifyApi = () =>
  new spotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI, // e.g., http://localhost:5000/callback
  });


app.get('/login', (req, res) => {
  const spotifyApi = createSpotifyApi();

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, null) + '&show_dialog=true';

  res.redirect(authorizeURL);
});

// after login, spotify redirects to this route with temp login code
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Callback received with code:', code);

    if (!code) {
    return res.status(400).send('Missing authorization code.');
    }

    const spotifyApi = new spotifyWebApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.REDIRECT_URI,
    });

    try {
        // takes temp code and exchanges it for access and refresh tokens
        console.log('Received code:', code);
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body.access_token;
        const refreshToken = data.body.refresh_token;

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        // save the instance to the map
        userSpotifyApis.set(accessToken, {
          spotifyApi,
          refreshToken,
        });


        res.redirect(`http://localhost:5173/home?token=${accessToken}`);
    } catch (err) {
        console.error('Error getting tokens:', err);
        res.status(500).json({ error: 'Failed to authenticate' });
    }
});


// receives token, talks to spotify, gives back user profile info
app.get('/homepage', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // gets token from request header (Authorization: Bearer abc123), split by space and take the second part
  if (!token) return res.status(401).send('No token provided');

  const { spotifyApi } = userSpotifyApis.get(token);
  if (!spotifyApi) return res.status(401).send('Invalid token');

  const timeRange = req.query.timeRange || 'long_term'; // default to long_term if not provided

  try {
    const userData = await spotifyApi.getMe(); // call's spotify's /me endpoint for profile info 
    const topArtists = await spotifyApi.getMyTopArtists({ time_range: timeRange }); // get user's top artists
    const topTracks = await spotifyApi.getMyTopTracks({ time_range: timeRange }); // get user's top tracks

    // format response data to send to frontend
    res.json({
        name: userData.body.display_name,
        profilePicture: userData.body.images[0]?.url || '',
        artists: topArtists.body.items.map(a => ({
            name: a.name,
            image: a.images[0]?.url || '',
        })),
        tracks: topTracks.body.items.map(t => ({
            name: t.name,
            artist: t.artists[0]?.name || '',
            image: t.album.images[0]?.url || '',
        }))
    });
  } catch (err) {
    console.error('Error in /homepage', err);
    res.status(500).send('Failed to fetch user');
  }
});

const { OpenAI } = require('openai'); // import OpenAI SDK
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // create OpenAI instance with API key

app.use(express.json()); // need to parse json boyd in post requests

app.post('/generate-playlist', async(req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // gets token from request header
  if (!token) return res.status(401).send('No token provided');

  const userPrompt = req.body.prompt; // get user's prompt from request body
  if (!userPrompt) return res.status(400).send('No prompt provided');

  const { spotifyApi } = userSpotifyApis.get(token) || {};
  if (!spotifyApi) return res.status(401).send('Invalid token');

  try {
    // fetch user data
    // const topTracks = await spotifyApi.getMyTopTracks({ time_range: 'medium_term', limit: 20 });
    // const trackSummary = topTracks.body.items.map(t => `${t.name} by ${t.artists[0].name}`).join(', ');
    // get all of user's saved tracks
    let allTracks = [];
    let limit = 50;
    let offset = 0;
    let total = 0;

    do {
      const response = await spotifyApi.getMySavedTracks({ limit, offset });
      allTracks = allTracks.concat(response.body.items);
      total = response.body.total;
      offset += limit;
    } while (allTracks.length < total);

    // get unique artist ids
    const artistIds = new Set();
    allTracks.forEach(item => {
      item.track.artists.forEach(artist => {
        artistIds.add(artist.id);
      });
    });

    // fetch genres from artists in batches of 50 
    const artistArray = Array.from(artistIds);
    const genreCount = {};

    for (let i = 0; i < artistArray.length; i += 50) {
      const batch = artistArray.slice(i, i + 50);
      const artistData = await spotifyApi.getArtists(batch);

      artistData.body.artists.forEach(artist => {
        artist.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });
    }

    // build genre summary string
    const genreSummary = Object.entries(genreCount)
    .sort((a,b) => b[1] - a[1]) // sort by count descending
    .slice(0, 15)
    .map(([genre, count]) => `${genre} (${count})`)
    .join(', ');

    // call openai to suggest tracks
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
      { role: 'system', content: 'You are a spotify playlist generator bot.'},
      { role: 'user', content: `User listens to: ${genreSummary}. Based on this, and the prompt: "${userPrompt}", generate a playlist. IMPORTANT: Respond with a JSON array of objects, each with "track" and "artist" fields, e.g. [{"track": "Song Name", "artist": "Artist Name"}, ...].` }
      ],
    });
      
      const suggestions = completion.choices[0].message.content;

      console.log('OpenAI response:', suggestions);

      res.json({ playlist: suggestions });
  } catch (err) {
    console.error('Error generating playlist:', err);
    res.status(500).send('Failed to generate playlist');
  }
});

app.post('/create-playlist', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; //get token 
  const { name, tracks } = req.body; // get playlist name and tracks from request body
  
  if (!token) return res.status(401).send('No token provided');
  if (!name || !tracks || !Array.isArray(tracks)) {
    return res.status(400).send('Invalid request body');
  }

  const { spotifyApi }  = userSpotifyApis.get(token) || {};
  if (!spotifyApi) return res.status(401).send('Invalid token');

  try {
    const user = await spotifyApi.getMe(); 
    const userId = user.body.id;

    const playlist = await spotifyApi.createPlaylist(userId, {
      name,
      public: false,
      description: 'Generated by Playlist Generator',
    });

    const uris = [];

    for (const item of tracks) {
      const q = encodeURIComponent(`${item.track} ${item.artist}`);
      const search = await spotifyApi.searchTracks(q, {limit: 1});
      const found = search.body.tracks.items[0];
      if (found) uris.push(found.uri);
    }

    // add tracks
    await spotifyApi.addTracksToPlaylist(playlist.body.id, uris);

    res.json({success: true, playlistUrl: playlist.body.external_urls.spotify });
  } catch (err) { 
    console.error('Error creating playlist:', err);
    res.status(500).send('Failed to create playlist');
  }
});


app.get('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // gets token from request header
  if (!token) return res.status(401).send('No token provided');

  userSpotifyApis.delete(token); // remove the user's spotify api instance from the map

  res.redirect('http://localhost:5173/'); // redirect to home page
});


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// tells express to start listening for requests on port 5000
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
