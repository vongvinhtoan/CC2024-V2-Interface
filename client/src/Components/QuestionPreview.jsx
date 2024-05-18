import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import serverUrl from '../Assets/ServerUrl';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io.connect(serverUrl);

function QuestionPreview({ content, onAnswer }) {
    axios.defaults.withCredentials = true;
    const [playerAnswer, setPlayerAnswer] = useState('');

    const handleAnswer = () => {
        axios.post(serverUrl + '/clientAnswer',)
        .then(res => {
            setPlayerAnswer(res.data.playerAnswered);
            socket.emit('client_answered');
        });

        console.log('Answered!');
        onAnswer();
    };

    return (
        <div>
            { content }
            <div className="text-center">
                <div className="d-inline-block my-2" style={{height: 50, width: 100}}>
                    <button type="button" className="btn btn-group-justified btn-danger btn-primary h-100 w-100" onClick={handleAnswer}>
                        Answer!
                    </button>
                </div>
            </div>
        </div>
    )
}

export default QuestionPreview