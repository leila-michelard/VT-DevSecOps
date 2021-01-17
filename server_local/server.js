const server = require('http').createServer();
const { Server } = require('ws');
const fs = require('fs')
const wss = new Server({ server });
const PORT = process.env.PORT || 3000;


let rooms = {};
let roomsInGame = {};
let currentMusic = {};
let reponses = {};
let roomMusics = {};
let classement = {};
let scoreWinOfRooms = {};
let roomsNb = 0;
let userNb = 0;

wss.on('connection', (client) => {
    client.on('message', (message) => {
        let msg = JSON.parse(message);
        if (msg.id === "newRoom") {
            newRoom(msg.data, client);
        } else if (msg.id === "joinRoom") {
            joinRoom(msg.data, client);
        } else if (msg.id === "nextMusic") {
            nextMusic(msg.data, client);
        } else if (msg.id === "submitMusic") {
            submitMusic(msg.data, client);
        } else if (msg.id === "playlist") {
            submitPlaylist(msg.data, client);
        } else if (msg.id == "envoireponse"){
            receptionReponse(msg.data, client);
        } else if (msg.id == "bonneReponse"){
            bonneReponse(msg.data, client);
        } else if (msg.id == "envoiTimerAndScore"){
            envoiTimerAndScore(msg.data, client);
        }
    })
});

function newRoom(msg, client) {
    roomsNb += 1;
    let room = `room-${roomsNb}`;
    userNb += 1;
    let userId = `U_${userNb}`;
    let pseudo = msg.pseudo;

    roomsInGame[room] = {inGame: false};
    rooms[room] = [{ id: userId, client: client, pseudo: pseudo}];
    classement[room] = [{pseudo: pseudo, score: 0}];
    currentMusic[room] = 0;

    sendToClient(client, "roomCreated", { status: 200, roomId: room, userId: userId });
    
    client.on('close', () => {
        rooms[room] = rooms[room].filter((val, i, a) => { return val.id !== userId });
    });
}

function joinRoom(msg, client) {
    if (!rooms.hasOwnProperty(msg.roomId) && roomsInGame[msg.roomId].inGame == true) {
        sendToClient(client, "roomJoined", { status: 404 });
        return;
    } 
    let room = msg.roomId;
    userNb += 1;
    let userId = `U_${userNb}`;
    let pseudo = msg.pseudo;

    if (!rooms.hasOwnProperty(room) || roomsInGame[room].inGame == true) {
        sendToClient(client, "roomJoined", { status: 404 });
        return;
    }

    classement[room].push({pseudo: pseudo, score: 0});
    rooms[room].push({ id: userId, client: client, pseudo: pseudo });
    sendToClient(client, "roomJoined", { status: 200, userId: userId });

    // Send the new player to all other players in the same room
    var listCLI = [];
    rooms[room].forEach((user) => {
        if (user.client != client){ 
            listCLI.push(user.pseudo);
            sendToClient(user.client, "newPlayer", { pseudo: msg.pseudo});
        } 
    })

    // Update the list of players for the new player
    listCLI.forEach((function(name) {
        sendToClient(client, "updateList", { name: name });
    }))

    client.on('close', () => {
        rooms[room] = rooms[room].filter((val, i, a) => { return val.id !== userId });
        // Remove the user of the list of players for all other players
        rooms[room].forEach((user) => {
            if (user.client != client){
                sendToClient(user.client, "removePlayer", { pseudo: msg.pseudo, userId: userId});
            } 
        })
    });
}

function nextMusic(msg) {
    let roomId = msg.roomId;
    let roomWinnerScore = scoreWinOfRooms[roomId];
    //console.log(roomWinnerScore);
    var winner = null;

    //Update du classement (nullcheck pour ne pas qu'il se fasse à la toute premiere manche ni quand la musique est passée)
    if (reponses[roomId] != null){
        classement[roomId].forEach((joueur) => {
            reponses[roomId].forEach((player) => {
                if(joueur.pseudo == player.pseudo){
                    joueur.score += player.points;

                    // Test si l'on a un vainqueur
                    if(joueur.score >= roomWinnerScore){
                        winner = joueur.pseudo;
                    }
                }
            })
        })
    }

    //Reinitialisation du tableau de réponses
    reponses[roomId]=[];
    reponses[roomId].length = 0;
    if (!roomMusics.hasOwnProperty(roomId)) return;
    if (currentMusic[roomId] >= roomMusics[roomId].length) return;

    if (winner == null) {
       rooms[roomId].forEach((user) => {
            sendToClient(user.client, "nextMusic", { token: roomMusics[roomId][currentMusic[roomId]].videoId, classement: classement[roomId]});
        }) 
    }
    else {
        rooms[roomId].forEach((user) => {
            sendToClient(user.client, "endGame", { winner: winner});
        }) 
    }
    
}

function submitMusic(msg) {
    let roomId = msg.roomId;

    rooms[roomId].forEach((user) => {
        sendToClient(user.client, "submitMusic", { title: roomMusics[roomId][currentMusic[roomId]].title, reponse: reponses[roomId] });
    })
    currentMusic[roomId] += 1;
    reponses[roomId]=[];
    reponses[roomId].length = 0;
}

function receptionReponse(msg, client){
    let proposition = msg.reponse;
    let pseudo = msg.pseudo;
    let room = msg.roomId;
    if(reponses[room] == null){
        reponses[room] = [{pseudo: pseudo, reponse: proposition, vf: false, points: 0}];
    }
    else reponses[room].push({ pseudo: pseudo, reponse: proposition, vf: false, points: 0});
    sendToClient(client, "ReponseEnvoye", { status: 200});
    //msg.reponse = "";
}

function submitPlaylist(msg) {
    let roomId = msg.roomId;

    roomsInGame[roomId].inGame = true;

    getPlaylist(msg.playlistId, (music) => {
        roomMusics[roomId] = music.sort(() => Math.random() - 0.5);
        nextMusic(msg);
    });
}

function bonneReponse(msg, client){
    let roomId = msg.roomId;

    reponses[roomId] = msg.array;

    var premiervrai = true;
    reponses[roomId].forEach((joueur) => {
        if (joueur.vf){
            if (premiervrai){
                joueur.points = 2;
                premiervrai = false;
            } else {
                joueur.points = 1;
            }
        } else {
            joueur.points = 0;
        }
    })

    rooms[roomId].forEach((user) => {
        sendToClient(user.client, "bonneReponse", { array: reponses[roomId] });
    });
    
}

function sendToClient(client, id, msg) {
    client.send(JSON.stringify({ id: id, data: msg }));
}


server.listen(PORT);

const PlaylistSummary = require('youtube-playlist-summary');
const { exit } = require('process');
const config = {
    GOOGLE_API_KEY: 'AIzaSyCscobFCKmWDG7SUNo4jcOLU-W48U9Ir7I', // require
    PLAYLIST_ITEM_KEY: ['title', 'videoId'],
}

const ps = new PlaylistSummary(config)
const PLAY_LIST_ID = 'PLlYKDqBVDxX1Q_jLy_Olg_VlQpl_xZEX1'

function getPlaylist(playlistId, callback){   
    ps.getPlaylistItems(playlistId)
    .then((result) => {
        callback(result.items);
    })
    .catch((error) => {
        console.error(error)
    })
}

function envoiTimerAndScore(data, client){
    let roomId = data.roomId;
    let winnerScore = data.WINNER_SCORE;
    scoreWinOfRooms[roomId] = winnerScore;

    rooms[roomId].forEach((user) => {
        sendToClient(user.client, "Timer&ScoreRecu", { duree: data.TIME_LIMIT, score: data.WINNER_SCORE });
    });
}