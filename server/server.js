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
