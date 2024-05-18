import React from 'react'
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import serverUrl from '../Assets/ServerUrl';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@mui/material';
import scmap from '../Components/StateColorMap';

const socket = io.connect(serverUrl);

function Admin() {
    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    const [preview, setPreview] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => 0)));
    const [previewColor, setPreviewColor] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => 'default')));
    const [hints, setHints] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => 0)));
    const [is_playing, setIsPlaying] = useState(false);
    const [dialogPreview, setDialogPreview] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => false)));
    const [dialogDispatch, setDialogDispatch] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => false)));
    const [dialogDispatchTimeout, setDialogDispatchTimeout] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => false)));
    const [answer, setAnswer] = useState('null');

    const updatePreview = () => {
        axios.get(serverUrl + '/getGameState')
        .then(res => {
            setIsPlaying(res.data.is_playing);
            setPreview(res.data.progress);
            setAnswer(res.data.playerAnswered);
        });
        
        socket.emit(`admin_update_preview`);
    };
    
    useEffect(() => {
        setPreviewColor(preview.map(row => row.map(cell => scmap(cell))));
    } , [preview]);

    const handleCellClick = (i, j, value) => {
        axios.post(serverUrl + '/updatePreview', {i, j, value})
        .then(res => {
            if(res.data.Status !== 'Success') {
                console.log("Failed to update preview");
                return;
            }
            updatePreview();
        });
        setDialogPreview([...dialogPreview, dialogPreview[i][j] = false]);
    }

    const startGame = () => {
        axios.post(serverUrl + '/startGame');
        socket.emit("admin_game_started");
        updatePreview();
    }

    const gameOver = () => {
        axios.post(serverUrl + '/gameOver');
        socket.emit("admin_game_ended");
        updatePreview();
    }

    const resetGame = () => {
        axios.post(serverUrl + '/resetGame')
        .then(res => {
            updatePreview();
        })
    }

    useEffect(() => {
        axios.get(serverUrl)
        .then(res => {
            if(res.data.Status !== 'Success' || res.data.role !== 'admin') {
                navigate('/login');
            }
        })
        .catch(err => console.log(err));

        console.log("Admin useEffect");
        console.log(is_playing);
        updatePreview();
    }, []);

    useEffect(() => {
        socket.on('client_answered', () => {
            updatePreview();
        });
    }, []);

    const handleShowPlayerAnswered = (value) => {
        axios.post(serverUrl + '/showPlayerAnswered', {value})
        .then(res => {
            if(res.data.Status !== 'Success') {
                console.log("Failed to update show player answered");
                return;
            }
            socket.emit(`admin_update_preview`);
        });
    }

    const dispatchQuestion = (questionId, timeout) => {
        axios.post(serverUrl + '/dispatchQuestion', {questionId, timeout})
        .then(res => {
            if(res.data.Status !== 'Success') {
                console.log("Failed to dispatch question");
                return;
            }
            socket.emit(`admin_update_preview`);
        });
    }

    const hideQuestion = () => {
        axios.post(serverUrl + '/hideQuestion')
        .then(res => {
            if(res.data.Status !== 'Success') {
                console.log("Failed to hide question");
                return;
            }
            socket.emit(`admin_update_preview`);
        });
    }

    return (
        <div>
            <h1>Admin</h1>
            <h2>Game Preview</h2>
            <div className="text-center">
                <div className='d-inline-block mx-1' style={{height:40, width: 100}}> <button onClick={startGame} className='mx-1 h-100 w-100'> Start Game </button> </div>
                <div className='d-inline-block mx-1' style={{height:40, width: 100}}> <button onClick={gameOver} className='mx-1 h-100 w-100'> End Game </button> </div>
                <div className='d-inline-block mx-1' style={{height:40, width: 100}}> <button onClick={resetGame} className='mx-1 h-100 w-100'> Reset Game </button> </div>
                {is_playing &&
                    <div className='container mt-1 w-50'> {
                        preview.map((row, i) => (
                            <div className='row' key={i}>{
                                row.map((cell, j) => (
                                    <div key={j} className="col p-1" style={{width:50, height:50}}>
                                        <button className='w-100 h-100' key={j} onClick={() => {
                                            setDialogPreview([...dialogPreview, dialogPreview[i][j] = true]);
                                        }} style={{backgroundColor: previewColor[i][j]}}>{cell}</button>
                                        <Dialog open={dialogPreview[i][j]} onClose={() => setDialogPreview([...dialogPreview, dialogPreview[i][j] = false])}>
                                            <h2>Update value for cell ({i}, {j})</h2>
                                            <ul>
                                                <li>0. Unrevealed</li>
                                                <li>1. Correct</li>
                                                <li>2. Wrong</li>
                                                <li>3. Pending</li>
                                            </ul>
                                            <div className='container w-50'> 
                                                <div className="row">
                                                    <div className="col p-1" style={{height:50, width:35}}><button className='w-100 h-100' style={{backgroundColor: scmap(0)}} onClick={() => handleCellClick(i, j, 0)}>0</button></div>
                                                    <div className="col p-1" style={{height:50, width:35}}><button className='w-100 h-100' style={{backgroundColor: scmap(1)}} onClick={() => handleCellClick(i, j, 1)}>1</button></div>
                                                    <div className="col p-1" style={{height:50, width:35}}><button className='w-100 h-100' style={{backgroundColor: scmap(2)}} onClick={() => handleCellClick(i, j, 2)}>2</button></div>
                                                    <div className="col p-1" style={{height:50, width:35}}><button className='w-100 h-100' style={{backgroundColor: scmap(3)}} onClick={() => handleCellClick(i, j, 3)}>3</button></div>
                                                </div>
                                                <div className="row" hidden={true}>
                                                    <div className="col p-1" style={{height:50, width:35}}><button className='w-100 h-100' onClick={() => {
                                                        setDialogPreview([...dialogPreview, dialogPreview[i][j] = false]);
                                                    }}>Cancel</button></div>
                                                </div>
                                            </div>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                }
            </div>
            <h2>Dispatch Question</h2>
            <div className="text-center">
                <div className='d-inline-block mx-1' style={{height:40, width: 125}}> <button onClick={hideQuestion} className='mx-1 h-100 w-100'> Stop dispatch </button> </div>
                {is_playing &&
                    <div className='container mt-1 w-50'>{
                        Array.from(Array(3).keys()).map((i) => Array.from(Array(4).keys()).map((j) => i*4+j+1)).map((row, i) => (
                            <div className='row' key={i}>{
                                row.map((cell, j) => (
                                    <div className="col p-1" style={{width:50, height:50}}>
                                        <button className='w-100 h-100' key={j} onClick={() => {
                                            setDialogDispatch([...dialogDispatch, dialogDispatch[i][j] = true]);
                                        }}>{cell}</button>
                                        <Dialog open={dialogDispatch[i][j]} onClose={() => {setDialogDispatch([...dialogDispatch, dialogDispatch[i][j] = false]);}}>
                                            <h2>Dispatch question {cell}</h2>
                                            <h3>Are you sure?</h3>
                                            <div className="container w-50">
                                                <div className="row">
                                                    <div className="col p-2" style={{height:70, width:40}}><button className='w-100 h-100' style={{backgroundColor: scmap(2)}} onClick={() => {
                                                        setDialogDispatch([...dialogDispatch, dialogDispatch[i][j] = false]);
                                                    }}>NO</button></div>
                                                    <div className="col p-2" style={{height:70, width:40}}><button className='w-100 h-100' style={{backgroundColor: scmap(1)}} onClick={() => {
                                                        setDialogDispatchTimeout([...dialogDispatchTimeout, dialogDispatchTimeout[i][j] = true]);   
                                                        setDialogDispatch([...dialogDispatch, dialogDispatch[i][j] = false]);
                                                    }}>YES</button></div>
                                                </div>
                                            </div>
                                        </Dialog>
                                        <Dialog open={dialogDispatchTimeout[i][j]} onClose={() => {setDialogDispatchTimeout([...dialogDispatchTimeout, dialogDispatchTimeout[i][j] = false]);}}>
                                            <h2>Set timeout for question {cell}</h2>
                                            <div className="container w-50">
                                                <div className="row">
                                                    <div className="col p-2" style={{height:70, width:40}}><button className='w-100 h-100' onClick={() => {
                                                        dispatchQuestion(cell, 90);
                                                        setDialogDispatchTimeout([...dialogDispatchTimeout, dialogDispatchTimeout[i][j] = false]);
                                                    }}>90s</button></div>
                                                    <div className="col p-2" style={{height:70, width:40}}><button className='w-100 h-100' onClick={() => {
                                                        dispatchQuestion(cell, 15);
                                                        setDialogDispatchTimeout([...dialogDispatchTimeout, dialogDispatchTimeout[i][j] = false]);
                                                    }}>15s</button></div>
                                                </div>
                                            </div>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                }
            </div>
            <h2 hidden={true}>Show hint</h2>
            <div>
                {is_playing &&
                    <div className='container mt-1 w-50' hidden={true}>{
                        Array.from(Array(3).keys()).map((i) => Array.from(Array(4).keys()).map((j) => i*4+j+1)).map((row, i) =>  (
                            <div className='row' key={i}> {
                                row.map((cell, j) => (
                                    <div className="col p-1" style={{width:50, height:50}}> 
                                        <button className='w-100 h-100' key={j} onClick={() => {
                                            
                                        }} style={{backgroundColor: hints[i][j] === 1 ? 'red' : 'default'}}>{cell}</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                }
            </div>
            <h2>Show Player Answered</h2>
            <div>
                <button onClick={() => handleShowPlayerAnswered(true)}> Show </button>
                <button onClick={() => handleShowPlayerAnswered(false)}> Hide </button>
                <button onClick={() => {
                    axios.post(serverUrl + '/clearPlayerAnswered')
                    .then(res => {
                        if(res.data.Status !== 'Success') {
                            console.log("Failed to clear player answered");
                            console.log(res.data);
                            return;
                        }
                        socket.emit(`admin_update_preview`);
                        updatePreview();
                    });
                }}> Clear </button>
            </div>
            <div>
                {answer}
            </div>
        </div>
    )
}

export default Admin