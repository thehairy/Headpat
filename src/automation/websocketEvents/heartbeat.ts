import WebsocketEvent from "../../structs/WebsocketEvent";
import {connectionHeartbeat, getConnection} from "../connectionmanager";

export default class Heartbeat extends WebsocketEvent {
    constructor() {
        super("HRT");
    }

    async exec(event, ws, args) {
        //console.log(`${ws.tid} is still alive!`);
        connectionHeartbeat(ws.tid);
        ws.send(JSON.stringify({
            opCode: "HRT",
            data: {
                version: args.version
            }
        }));
    }
}