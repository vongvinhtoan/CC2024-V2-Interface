const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const fs = require("fs");

app.use(cors({
    origin: [
        "http://10.124.3.248:3000"
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
    }
}));

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "curd",
});

app.get("/getAllowAnswer", (req, res) => {
    if(req.session.role !== 'player') return res.json({allow_answer: false});
    const game_state = require("./Data/game_state.json");
    const allow_answer = game_state.allowAnswer;
    return res.json({allow_answer});
});

app.post("/showPlayerAnswered", (req, res) => {
    if(req.session.role !== 'admin') return res.json({Status: "Failed"});
    const game_state = require("./Data/game_state.json");
    game_state.showPlayerAnswered = req.body.value;
    const json = JSON.stringify(game_state);
    fs.writeFileSync("./Data/game_state.json", json);
    return res.json({Status: "Success"});
});

app.get("/showPlayerAnswered", (req, res) => {
    const game_state = require("./Data/game_state.json");
    return res.json({Status: "Success", showPlayerAnswered: game_state.showPlayerAnswered});
});

app.get("/showQuestion", (req, res) => {
    const game_state = require("./Data/game_state.json");
    return res.json({Status: "Success", showQuestion: game_state.showQuestion});
});

app.get("/playerAnswered", (req, res) => {
    if(req.session.role !== 'player') return res.json({Status: "Failed"});
    const game_state = require("./Data/game_state.json");
    return res.json({Status: "Success", playerAnswered: game_state.playerAnswered, showPlayerAnswered: game_state.showPlayerAnswered});  
});

app.get("/", (req, res) => {
    if(req.session.role) {
        return res.json({Status: "Success", username: req.session.username, name: req.session.name, role: req.session.role});
    } else {
        return res.json({Status: "Failed"});
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    return res.json({Status: "Success"});
});

app.post("/updateAnswer", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.allowAnswer = req.body.value;
    if(game_state.allowAnswer) {
        game_state.playerAnswered = null;
    }
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success", answer: req.body.value});
});

app.get("/getGameState", (req, res) => {
    const game_state = require("./Data/game_state.json");
    return res.json(game_state);
});

app.post("/login", (req, res) => {
    const sql = "SELECT * FROM login WHERE username = ? AND password = ?"
    
    db.query(sql, [req.body.username, req.body.password], (err, data) => {
        if (err) {
            return res.json("Error");
        }
        if(data.length > 0) {
            req.session.username = data[0].username;
            req.session.name = data[0].name;
            req.session.role = data[0].role;
            return res.json({valid: true, username: data[0].username, name: data[0].name, role: data[0].role});
        } else {
            return res.json({valid: false});
        }
    });
});

app.post("/startGame", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.is_playing = true;
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

app.post("/gameOver", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.is_playing = false;
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

app.post("/resetGame", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.progress = Array.from({length: 3}, () => Array.from({length: 4}, () => 0));
    game_state.allowAnswer = false;
    game_state.playerAnswered = null;
    game_state.summitedAnswers = [];
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

function isAllowAnswered(req) {
    const game_state = require("./Data/game_state.json");
    const count_answered = game_state.progress.reduce((sum, row) => {
        return sum + row.reduce((sum, cell) => {
            return sum + (cell !== 0 && cell !== 3);
        }, 0);
    }, 0);

    if(game_state.summitedAnswers.filter(answer => answer.username === req.session.username).length === 0) {
        game_state.summitedAnswers.push({username: req.session.username, answer: null});
        const json = JSON.stringify(game_state);
        fs.writeFileSync("./Data/game_state.json", json);
    }

    const submittedAnswer = game_state.summitedAnswers.find(answer => answer.username === req.session.username).answer;   

    return count_answered >= 6 && !game_state.allowAnswer && submittedAnswer === null;
}

app.get("/getAllowAnswerKeyword", (req, res) => {
    if(req.session.role !== 'player') return res.json({allow_answer_keyword: false});
    return res.json({allow_answer_keyword: isAllowAnswered(req)});
});

app.post("/clientAnswerKeyword", (req, res) => {
    if(req.session.role !== 'player') return res.json({Status: "Failed"});
    if(!isAllowAnswered(req)) return res.json({Status: "Failed: Not allowed"});

    const game_state = require("./Data/game_state.json");
    game_state.summitedAnswers.find(answer => answer.username === req.session.username).answer = req.body.answer;
    const json = JSON.stringify(game_state);
    fs.writeFileSync("./Data/game_state.json", json);
    return res.json({Status: "Success"});
});

function getImage(i, j, state) {
    let imagePath = "";
    if(state === 0) {
        imagePath = `Data/unrevealed.png`
    } else if(state === 1) {
        imagePath = `Data/correct_cropped/${i}_${j}.png`
    } else if(state === 2) {
        imagePath = `Data/wrong.png`
    } else if(state === 3) {
        imagePath = `Data/pending.png`
    }
    return fs.readFileSync(imagePath, {encoding: "base64"});
}

function getHint(questionID, state) {
    const hints = require("./Data/hints.json");

    if(state === 1) return hints[questionID];
    return "";
}

app.get("/getPreview", (req, res) => {
    const progress = require("./Data/game_state.json").progress;
    const preview = new Array(3).fill("").map(() => new Array(4).fill("??"));

    for(let i = 0; i < progress.length; i++) {
        for(let j = 0; j < progress[i].length; j++) {
            preview[i][j] = getImage(i, j, progress[i][j]); 
        }
    }

    const hints = new Array(6).fill("").map(() => new Array(2).fill(""));
    for(let i = 0, cnt = 0; i < hints.length; i++) {
        for(let j = 0; j < hints[i].length; j++) {
            hints[i][j] = getHint(cnt, progress[Math.floor(cnt/4)][cnt%4]);
            cnt++;
        }
    }

    return res.json({preview, hints});
});

app.get("/time", (req, res) => {
    const game_state = require("./Data/game_state.json");
    const timeToAnswer = game_state.timeToAnswer;
    const currentTime = new Date().getTime();
    const timeElapsed = (currentTime - game_state.currentTimeStart) / 1000;
    if(timeElapsed >= timeToAnswer) {
        return res.json({timeToAnswer, timeElapsed: timeToAnswer});
    }
    return res.json({timeToAnswer, timeElapsed, timeStamp: currentTime});
});

app.post("/timeUp", (req, res) => {
    const game_state = require("./Data/game_state.json");
    const timeLeft = game_state.timeToAnswer - (new Date().getTime() - game_state.currentTimeStart) / 1000;
    if(timeLeft <= 0) {
        game_state.showQuestion = false;
        game_state.playerAnswered = null;
        const json = JSON.stringify(game_state);
        fs.writeFileSync("./Data/game_state.json", json);
    }
    return res.json({Status: "Success"});
});

app.post("/dispatchQuestion", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require("./Data/game_state.json");
    game_state.showQuestion = true;
    game_state.questionDisplaying = req.body.questionId;
    game_state.currentTimeStart = new Date().getTime();
    game_state.timeToAnswer = req.body.timeout;
    
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

app.post("/hideQuestion", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.showQuestion = false;
    game_state.questionDisplaying = null;
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

app.post("/updatePreview", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    const i = req.body.i;
    const j = req.body.j;
    const value = req.body.value;
    game_state.progress[i][j] = value;
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

app.post("/clientAnswer", (req, res) => {
    if(req.session.role !== 'player') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    if(game_state.playerAnswered !== null) {
        return res.json({Status: "Failed"});
    }
    game_state.playerAnswered = req.session.username;
    game_state.showPlayerAnswered = true;
    game_state.showQuestion = false;
    const json = JSON.stringify(game_state);
    console.log(json);
    fs.writeFileSync(game_state_json, json);
});

app.post("/clearPlayerAnswered", (req, res) => {
    if(req.session.role !== 'admin') {
        return res.json({Status: "Failed"});
    }

    const game_state_json = "./Data/game_state.json";
    const game_state = require(game_state_json);
    game_state.playerAnswered = null;
    const json = JSON.stringify(game_state);
    fs.writeFileSync(game_state_json, json);
    return res.json({Status: "Success"});
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    },
});

io.on("connection", (socket) => {
    socket.on("admin_game_ended", () => {
        socket.broadcast.emit("game_ended");
    });

    socket.on("admin_game_started", () => {
        socket.broadcast.emit("game_started");
    });

    socket.on("admin_update_preview", () => {
        socket.broadcast.emit("update_preview");
    });

    socket.on("client_answered", () => {
        socket.broadcast.emit("update_preview");
        socket.broadcast.emit("client_answered");
    });
});

server.listen(4000, () => {
    console.log("Server is running on port 4000");
});