let nextButton = document.getElementById("next-music-button");
let submitPlaylistDiv = document.getElementById("submit-playlist");
let textDiv = document.getElementById("text");
let gifDance = document.getElementById("gif-dance");
let boutonReponse = document.getElementById("boutonReponse");
let reponsediv = document.getElementById("reponse-div");
let reponseField = document.getElementById("reponseField");
let texteReponse = document.getElementById("texteReponse");
var tableauReponse = document.getElementById("tableauReponse");

var dureeTimer = document.getElementById("timerField");
var labelTimer = document.getElementById("definitionTimer");
var winnerScoreField = document.getElementById("winnerScoreField");

// Start with an initial value of 20 seconds
var TIME_LIMIT = 0;

var WINNER_SCORE = 0;
const FULL_DASH_ARRAY = 283;

// Warning occurs at 10s
const WARNING_THRESHOLD = 10;
// Alert occurs at 5s
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
  info: {
    color: "green"
  },
  debut: {
    color: "grey"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

// Initially, no time has passed, but this will count up
// and subtract from the TIME_LIMIT
let timeLeft = TIME_LIMIT;  
let timerInterval = null;
let timePassed = 0;

let remainingPathColor = COLOR_CODES.debut.color;

var tableauPlayers = document.getElementById("table-players");


var player1;
var done = true;
let AmICreator = false;

function startGame(isCreator) {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    if (!isCreator) {
        submitPlaylistDiv.style.display = "none";
        textDiv.innerText = "Waiting for the creator to select a playlist";
    } else {
        textDiv.innerText = "Please select a playlist";
        dureeTimer.style.display = "inline";
        labelTimer.style.display = "flex";
    }
    AmICreator = isCreator;

    roomServer.register("newPlayer", addTheNewPlayer);
    roomServer.register("updateList", updateListOfPlayers);
    roomServer.register("removePlayer", removePlayer);
    roomServer.register("Timer&ScoreRecu", (data) => {
        TIME_LIMIT = data.duree;
        WINNER_SCORE = data.score;
    });

    tableauPlayers.style.display = "table";
}

function addTheNewPlayer(data) {
    var table_players = document.getElementById("table-players");
    var newLine = table_players.insertRow(-1);
    var newCel = newLine.insertCell(0);
    var secondCel = newLine.insertCell(1);
    var playerName = document.createTextNode(data.pseudo);
    newCel.appendChild(playerName);
    secondCel.innerHTML = 0;
}

function updateListOfPlayers(data) {
    var table_players = document.getElementById("table-players");
    var newLine = table_players.insertRow(-1);
    var newCel = newLine.insertCell(0);
    var secondCel = newLine.insertCell(1);
    var playerName = document.createTextNode(data.name);
    newCel.appendChild(playerName);
    secondCel.innerHTML = 0;;
}

function updateScore(classement){
    var table_players = document.getElementById("table-players");
    classement.forEach((joueur) => {
        for (var i=1; i<table_players.rows.length; i++) { 
            if (table_players.rows[i].querySelectorAll('td')[0].innerHTML == joueur.pseudo){
                table_players.rows[i].querySelectorAll('td')[1].innerHTML = joueur.score;
            } 
        } 
    });
}

function removePlayer(data) {
    var table_players = document.getElementById("table-players");
}

function onYouTubeIframeAPIReady() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("room-id").innerText = roomServer.roomId;

    nextButton.addEventListener("click", next);

    roomServer.register("nextMusic", playNextMusic);
    roomServer.register("submitMusic", revealAnswer);
    roomServer.register("endGame", endOfTheGame);

    if (AmICreator) {
        document.getElementById("submit-playlist-button").addEventListener("click", submitPlaylist);
    }

    var ctrlq1 = document.getElementById("youtube-audio1");
    ctrlq1.innerHTML = '<div id="youtube-player1"></div>'
    player1 = new YT.Player('youtube-player1', {
        height: '0',
        width: '0',
        videoId: ctrlq1.dataset.video,
        events: {
            'onReady': onPlayerReady1,
            'onStateChange': onPlayerStateChange1,
            'onError': (e) => {
                textDiv.innerText = "Cannot be played";
                submitAnswer();
                next();
            }
        }
    });
}

function onPlayerReady1(event) {
    player1.setPlaybackQuality("small");
    document.getElementById("youtube-audio1").style.display = "block";
    player1.playVideo();
    player1.setVolume(50);
    if (!AmICreator) {
        next();
    }
}

function onPlayerStateChange1(event) {
    if (event.data == 1 && !done) {
        setTimeout(stopVideo, TIME_LIMIT*1000);
        done = true;
        timeLeft = TIME_LIMIT;
        timerInterval = null;
        timePassed = 0;
        startTimer();
    }
}

function stopVideo() {
    player1.pauseVideo();
    if(AmICreator){
        submitAnswer();
    }
  }

function next() {
    roomServer.emit("nextMusic", { roomId: roomServer.roomId});
}

function submitAnswer() {
    roomServer.emit("submitMusic", { roomId: roomServer.roomId });
}

function playNextMusic(data) {
    reponseField.style.display = "inline";
    boutonReponse.style.display = "inline";
    texteReponse.style.display = "inline";
    tableauReponse.style.display = "none";
    var classement = data.classement;
    updateScore(classement);

    var longueur = tableauReponse.rows.length;
    for(i=1; i < longueur; i++){
        tableauReponse.deleteRow(-1);
    }

    done = false;
    document.getElementById("reponseField").value = "";
    nextButton.style.display = "none";
    reponsediv.style.display = "inline-block"
    textDiv.innerText = "Now Playing";
    gifDance.style.display = "inline-block";
    dureeTimer.style.display = "none";
    labelTimer.style.display = "none";
    var ctrlq1 = document.getElementById("youtube-audio1");
    ctrlq1.dataset.video = data.token;
    player1.loadVideoById({'videoId': ctrlq1.dataset.video, 'startSeconds' : 5});

    document.getElementById("app").innerHTML = `
    <div class="base-timer">
        <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
                <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
                <path
                    id="base-timer-path-remaining"
                    stroke-dasharray="0"
                    class="base-timer__path-remaining ${remainingPathColor}"
                    d="
                    M 50, 50
                    m -45, 0
                    a 45,45 0 1,0 90,0
                    a 30,30 0 1,0 -90,0
                    "
                ></path>
            </g>
        </svg>
        <span id="base-timer-label" class="base-timer__label">
            ${formatTimeLeft(timeLeft)}
        </span>
    </div>
`;
}

function onTimesUp() {
    clearInterval(timerInterval);
  }
  
  function startTimer() {
    timerInterval = setInterval(() => {
      timePassed = timePassed += 1;
      timeLeft = TIME_LIMIT - timePassed;
      document.getElementById("base-timer-label").innerHTML = formatTimeLeft(
        timePassed
      );
      setCircleDasharray();
      setRemainingPathColor(timeLeft);
  
      if (timeLeft === 0) {
        onTimesUp();
      }
    }, 1000);
  }

function submitPlaylist() {
    let playlistId = document.getElementById("submit-playlist-id").value;
    roomServer.emit("playlist", { roomId: roomServer.roomId, playlistId: playlistId});
    document.getElementById("submit-playlist").style.display = "none";
    dureeTimer.style.display = "none";
    labelTimer.style.display = "none";
    TIME_LIMIT = dureeTimer.value;
    WINNER_SCORE = winnerScoreField.value;
    roomServer.emit("envoiTimerAndScore", {WINNER_SCORE: WINNER_SCORE, TIME_LIMIT: TIME_LIMIT, roomId: roomServer.roomId});
}

function revealAnswer(data) {
    done = true;
    if(AmICreator){
        nextButton.style.display = "initial";
    }
    reponsediv.style.display = "none"
    textDiv.innerText = data.title;
    gifDance.style.display = "none";
    var array = data.reponse;
    displayArray(array);
    roomServer.register("bonneReponse", function(outerArray){ 
        var longueur = tableauReponse.rows.length;
        for(i=1; i < longueur; i++){
            tableauReponse.deleteRow(-1);
        }
        displayArray(outerArray.array);
    });
}

function displayArray(array) {
    if(array != null){
        array.forEach(element => {
            var ligne = tableauReponse.insertRow(-1);//on a ajouté une ligne
	        var colonne1 = ligne.insertCell(0);//on a une ajouté une cellule
	        colonne1.innerHTML += element.pseudo;
	        var colonne2 = ligne.insertCell(1);//on ajoute la seconde cellule
            colonne2.innerHTML += element.reponse;
            var colonne3 = ligne.insertCell(2);
            boutonVF = document.createElement("button");
            boutonVF.style.backgroundColor = element.vf ? "#1D8B28" : "#B43636";
            boutonVF.style.color = "#313337";
            boutonVF.style.height = '30px';
            boutonVF.style.display = "initial";
            boutonVF.innerHTML = element.vf ? "TRUE" : "FALSE";
            colonne3.appendChild(boutonVF);
            if (AmICreator){
                boutonVF.addEventListener("click", function(){
                    element.vf = !element.vf;
                    roomServer.emit("bonneReponse", {roomId: roomServer.roomId, array:array})
                });               
            }
            var colonne4 = ligne.insertCell(3);
            colonne4.innerHTML = element.points;
        });
    }
    if(tableauReponse != null){
        tableauReponse.style.display = "table";
    }
}

function envoyerReponse(){
    let reponse = reponseField.value;
    let pseudo = roomServer.pseudo;
    roomServer.emit("envoireponse", { roomId: roomServer.roomId, reponse: reponse, pseudo: pseudo});
    roomServer.register("ReponseEnvoye", (data) => {
        if (data.status === 404) {
            alert("Reponse non transmise");
        } else if (data.status === 200) {
        }
    });
    reponsediv.style.display = "none";
}

function endOfTheGame(data) {
    let messageWinner = document.getElementById("winnerCongrats");
    let winnerPopUp = document.getElementById("winner-screen");
    let menuButton = document.getElementById("back-to-menu");

    messageWinner.innerHTML = "CONGRATULATION " + data.winner + ", you WIN !";
    winnerPopUp.style.display = "initial";
    menuButton.addEventListener("click", backToMenu);
}

function backToMenu(){
    location.reload();
    return false;
}

function formatTimeLeft(time) { 
    // Seconds are the remainder of the time divided by 60 (modulus operator)
    let seconds = time % 60;
    // If the value of seconds is less than 10, then display seconds with a leading zero
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    // The output in SS format
    return `${seconds}`;
  }

  // Divides time left by the defined time limit.
  function calculateTimeFraction() {
    const rawTimeFraction = timeLeft / TIME_LIMIT;
    return 1 - (rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction));
  }
      
  // Update the dasharray value as time passes, starting with 283
  function setCircleDasharray() {
    const circleDasharray = `${(
      calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} 283`;
    document
      .getElementById("base-timer-path-remaining")
      .setAttribute("stroke-dasharray", circleDasharray);
  }

  function setRemainingPathColor(timeLeft) {
    const { alert, warning, info, debut } = COLOR_CODES;
    document
        .getElementById("base-timer-path-remaining")
        .classList.remove(debut.color);
    document
        .getElementById("base-timer-path-remaining")
        .classList.add(info.color);
    // If the remaining time is less than or equal to 5, remove the "warning" class and apply the "alert" class.
    if (timeLeft <= alert.threshold) {
      document
        .getElementById("base-timer-path-remaining")
        .classList.remove(warning.color);
      document
        .getElementById("base-timer-path-remaining")
        .classList.add(alert.color);
  
    // If the remaining time is less than or equal to 10, remove the base color and apply the "warning" class.
    } else if (timeLeft <= warning.threshold) {
      document
        .getElementById("base-timer-path-remaining")
        .classList.remove(info.color);
      document
        .getElementById("base-timer-path-remaining")
        .classList.add(warning.color);
    }
  }

boutonReponse.addEventListener("click", envoyerReponse);