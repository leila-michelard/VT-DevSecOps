class RoomServer {
    msgHandlers
    ws;
    roomId;
    pseudo;

    constructor() {
        //this.ws = new WebSocket('ws://localhost:3000');
        this.ws = new WebSocket('wss://blindtest-chaf.herokuapp.com/');
        this.msgHandlers = {};
        this.keepAlive();
        this.ws.onopen = () => { console.log("Connected to room server, it's ok !"); };
        this.ws.onmessage = (msg) => { this.onMsg(msg.data); };
    }

    keepAlive() {
        let timeout = 20000;
        let server = this.ws;
        let ping = () => {
            if (server.readyState === server.OPEN) {
                server.send(JSON.stringify({ id: "ping" }));
            }
            setTimeout(ping, timeout);
        };
        ping();
    }

    register(msgId, f) {
        if (!this.msgHandlers.hasOwnProperty(msgId)) {
            this.msgHandlers[msgId] = [];
        }

        this.msgHandlers[msgId].push(f);
    }

    emit(id, msg) {
        this.ws.send(JSON.stringify({ id: id, data: msg }));
    }

    onMsg(message) {
        let msg = JSON.parse(message);
        console.log(this.msgHandlers.hasOwnProperty(msg.id));
        if (!this.msgHandlers.hasOwnProperty(msg.id)) {
            return;
        }
        this.msgHandlers[msg.id].forEach((f) => f(msg.data));
    }
}

let roomServer = new RoomServer();