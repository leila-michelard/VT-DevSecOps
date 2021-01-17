let joinButton = document.getElementById("join-room-button");
let createButton = document.getElementById("new-room-button");
let roomIdField = document.getElementById("join-room-roomid");
let pseudoFieldJoin = document.getElementById("join-room-userid");
let pseudoFieldNew = document.getElementById("new-room-userid");

function joinRoom() {
    let roomId = "room-" + roomIdField.value;
    let pseudo = pseudoFieldJoin.value;
    if(pseudo === ""){
        alert("Please enter a name");
    }
    else {
        join = false;
        roomServer.emit("joinRoom", { roomId: roomId, pseudo: pseudo });
        roomServer.register("roomJoined", (data) => {
            switch(data.status) {
                case 404: 
                    if(!join){
                        alert("This Room ID doesn't exist or The Room started without you");
                        join = true;
                    }
                    break;
                default:
                    if(!join){
                        addMyNameToPlayerList();
                        console.log(data.userId);
                        console.log(roomId);
                        console.log(pseudo);
                        roomServer.roomId = roomId;
                        roomServer.pseudo = pseudo;
                        startGame(false);
                        join = true;
                    }
            }
        });
    }
}

function createRoom() {
    let pseudo = pseudoFieldNew.value;
    if (pseudo === ""){
        alert("Please enter a name");
    }
    else {
        roomServer.emit("newRoom", {pseudo: pseudo});
        roomServer.register("roomCreated", (data) => {
            addMyNameToPlayerList();
            console.log(data.userId);
            console.log(data.roomId);
            roomServer.roomId = data.roomId;
            roomServer.pseudo = pseudo;
            startGame(true);
        });
    }
}

function addMyNameToPlayerList() {
    // Maj du tableau des Players
    var table_players = document.getElementById("table-players");
    var newLine = table_players.insertRow(-1);
    var newCel = newLine.insertCell(0);
    var secondCel = newLine.insertCell(1);
    if(pseudoFieldJoin.value != ""){
        var playerName = document.createTextNode(pseudoFieldJoin.value);    
    }
    else if(pseudoFieldNew.value != "") {
        var playerName = document.createTextNode(pseudoFieldNew.value);
    }
    newCel.appendChild(playerName);
    secondCel.innerHTML = 0;
}

joinButton.addEventListener("click", joinRoom);
createButton.addEventListener("click", createRoom);