import React from 'react'
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import serverUrl from '../Assets/ServerUrl';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const socket = io.connect(serverUrl);

function Lobby() {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    axios.defaults.withCredentials = true;
    useEffect(() => {
        axios.get(serverUrl)
        .then(res => {
            if(res.data.Status === 'Success' && res.data.role === 'player') {
                setName(res.data.name);
            } else {
                navigate('/login');
            }
        })
        .catch(err => console.log(err));

        axios.get(serverUrl + '/getGameState')
        .then(res => {
            if(res.data.is_playing) {
                navigate('/game');
            }
        });
    }, []);

    useEffect(() => {
        socket.on("game_started", () => {
            navigate('/game');
        });
    }, []);

  return (
    <div>
        <h1>Hello {name}</h1>
    </div>
  );
}

export default Lobby