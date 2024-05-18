import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from 'react';
import axios from 'axios';
import serverUrl from './Assets/ServerUrl';

import Login from './Pages/Login';
import Lobby from './Pages/Lobby';
import Admin from './Pages/Admin';
import Viewer from './Pages/Viewer';
import Game from './Pages/Game';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  axios.defaults.withCredentials = true;
  useEffect(() => {
    axios.get(serverUrl)
    .then(res => {
      if(res.data.Status === 'Success') {
        setLoggedIn(true);
      }
    })
    .catch(err => console.log(err));
  }, []);

  const handleLogout = () => {
    axios.get(serverUrl + '/logout')
    .then(res => {
      window.location.reload();
    })
    .catch(err => console.log(err));
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/viewer' element={<Viewer />} /> 
        <Route path='/game' element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
