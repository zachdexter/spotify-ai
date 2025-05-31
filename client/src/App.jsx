import React from 'react';
import './index.css';


function App() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Spotify Stats</h1>
      <button onClick={handleLogin}>Log in with Spotify</button>
    </div>
  );
}

export default App;
