import axios from 'axios';
import React from 'react'
import { useEffect, useState } from 'react';
import serverUrl from '../Assets/ServerUrl';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import io from 'socket.io-client';
import PreviewGrid from '../Components/PreviewGrid';
import HintGrid from '../Components/HintGrid';
import Dialog from '@mui/material/Dialog';
import QuestionPreview from '../Components/QuestionPreview';
import CountdownTimer from '../Components/CountdownTimer';

const socket = io.connect(serverUrl);

function Game() {
    axios.defaults.withCredentials = true;
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [preview, setPreview] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => "null")));
    const [state, setState] = useState(Array.from({length: 3}, () => Array.from({length: 4}, () => 0)));
    const [allowAnswerKeyword, setAllowAnswerKeyword] = useState(false);
    const [playerAnswer, setPlayerAnswer] = useState('');
    const [openQuestion, setOpenQuestion] = useState(false);
    const [openQuestionAnswered, setOpenQuestionAnswered] = useState(false);
    const [questionContent, setQuestionContent] = useState(
        <div style={{width:500, height:600}}>
            <h1>Nononono</h1>
        </div>
    );
    const [totalTime, setTotalTime] = useState(10);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [hints, setHints] = useState(Array.from({length: 6}, () => Array.from({length: 2}, () => "")));

    const updateTimer = () => {
        axios.get(serverUrl + '/time')
        .then(res => {
            if(res.data.timeElapsed >= res.data.timeToAnswer) {
                console.log('Time Up!');
                axios.post(serverUrl + '/timeUp')
                setOpenQuestion(false);
            }
            setTotalTime(res.data.timeToAnswer);
            setElapsedTime(res.data.timeElapsed);
        })
    }

    const updatePreview = () => {
        console.log('Updating Preview...');
        axios.get(serverUrl + '/getPreview')
        .then(res => {
            console.log(res.data);
            const preview = res.data.preview.map((row, i) => {
                return row.map((cell, j) => {
                    return `data:image/png;base64,${cell}`;
                });
            });
            setPreview(preview);
            setHints(res.data.hints);
        });

        axios.get(serverUrl + '/getAllowAnswerKeyword')
        .then(res => {
            setAllowAnswerKeyword(res.data.allow_answer_keyword);
        });

        axios.get(serverUrl + '/playerAnswered')
        .then(res => {
            if(res.data.Status === 'Success') {
                setPlayerAnswer(res.data.playerAnswered);
                setOpenQuestionAnswered(res.data.showPlayerAnswered);
            }
        });

        axios.get(serverUrl + '/showPlayerAnswered')
        .then(res => {
            if(res.data.Status === 'Success') {
                console.log(res.data.showPlayerAnswered);
                setOpenQuestionAnswered(res.data.showPlayerAnswered);
            }
        });
        
        axios.get(serverUrl + '/showQuestion')
        .then(res => {
            if(res.data.Status === 'Success') {
                setOpenQuestion(res.data.showQuestion);
            }
        });

        axios.get(serverUrl + '/getGameState')
        .then(res => {
            setState(res.data.progress);
        });

        updateTimer();
    };

    useEffect(() => {
        const interval = setInterval(() => {
            updateTimer();
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        axios.get(serverUrl)
        .then(res => {
            if(res.data.Status === 'Success' && res.data.role === 'player') {
                setName(res.data.name);
            } else {
                navigate('/login');
            }
        })
        .catch(err => console.log(err))

        axios.get(serverUrl + '/getGameState')
        .then(res => {
            if(!res.data.is_playing) {
                navigate('/lobby');
            }
        });
        
        updatePreview();
        updateTimer();
    }, []);

    useEffect(() => {
        socket.on("game_ended", () => {
            navigate('/lobby');
        });

        socket.on("update_preview", () => {
            updatePreview();
        });
    }, []);

    const [answer, setAnswer] = useState('');

    const handleAnswerKeyword = (e) => {
        if(e.key === 'Enter') {
            axios.post(serverUrl + '/clientAnswerKeyword', {answer})
            .then(res => {
                console.log(res.data);
                setPlayerAnswer(res.data.playerAnswered);
                updatePreview();
                socket.emit('client_answered');
            });
        }
    }

    const handleAnswer = () => {
        console.log('Answering Question...');
        axios.post(serverUrl + '/clientAnswer')
        .then(res => {
            socket.emit('client_answered');
            updatePreview();
        });
    };

    return (
        <div>
            <div>
                <h1>Contestant: {name}</h1>
                <div className="text-center">
                    <div className='d-flex justify-content-center align-items-center'>
                        <div className="d-flex container justify-content-center align-items-center">
                            <div className="row">
                                <div className="col-10 d-flex align-items-center justify-content-center w-75">
                                    <PreviewGrid preview={preview} />
                                </div>
                                <div className="col-3 d-flex align-items-center justify-content-center">
                                    <HintGrid hint={hints} preview={state}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="position-relative mt-3" style={{height: 50}}>
                    <div className="position-absolute d-flex top-50 start-50 translate-middle w-50">
                        <input type="text" className="form-control" placeholder="Enter Answer" onKeyDown={handleAnswerKeyword} onChange={e => setAnswer(e.target.value)} />
                    </div>
                </div>
                <div className="text-center mt-3">
                    <div className="d-inline-block mx-5" style={{height: 100, width: 100}}>
                        <button type="button" className="btn btn-group-justified btn-danger btn-primary h-100 w-100 " onClick={() => handleAnswerKeyword({key: 'Enter'})} disabled={!allowAnswerKeyword}>
                            Submit!
                        </button>
                    </div>
                </div>
            </div>
            <Dialog open={openQuestion}>
                <div>
                    <CountdownTimer total={totalTime} elapsed={elapsedTime} />
                </div>
                <QuestionPreview content={questionContent} onAnswer={handleAnswer} />
            </Dialog>
            <Dialog open={openQuestionAnswered}>
                <div>
                    <h1>Player {playerAnswer} has answered the question!</h1>
                    <h1>Redirecting to Lobby...</h1>
                </div>
            </Dialog>
        </div>
    )
}

export default Game