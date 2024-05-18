import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import serverUrl from '../Assets/ServerUrl';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    axios.defaults.withCredentials = true;
    useEffect(() => {
        axios.get(serverUrl)
        .then(res => {
            if(res.data.Status === 'Success') {
                switch(res.data.role) {
                    case 'admin':
                        navigate('/admin');
                        break;
                    case 'player':
                        navigate('/lobby');
                        break;
                    case 'viewer':
                        navigate('/viewer');
                        break;
                    default:
                        navigate('/login');
                }
            }
        })
        .catch(err => {
            console.log(err);
        });
    }, []);

    axios.defaults.withCredentials = true;
    function handleSubmit(e) {
        e.preventDefault();
        axios.post(serverUrl + '/login', { username, password })
        .then(res => {
            console.log(res.data);
            if(res.data.valid) {
                if(res.data.role === 'admin')
                    navigate('/admin');
                else if(res.data.role === 'player')
                    navigate('/lobby');
                else if(res.data.role === 'viewer')
                    navigate('/viewer');
            } else {
                alert('Invalid username or password');
            }

        })
        .catch(err => {
            console.log(err);
        });
    }

  return (
    <div>
        <div className='d-flex justify-content-center vh-100 align-items-center bg-primary'>
            <div className='p-3 bg-white w-30'>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label htmlFor="username">Username</label>
                        <input type="text" name="username" id="username" placeholder="Enter Username" className='form-control'
                        onChange={e => setUsername(e.target.value)}/>
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" id="password" placeholder="Enter Password" className='form-control'
                        onChange={e => setPassword(e.target.value)}/>
                    </div>
                    <button type="submit" className='btn btn-success'>Login</button>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Login