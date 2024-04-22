import WebsocketEvent from "../../structs/WebsocketEvent";
import {getConnectionIDs} from "../connectionmanager";
import {readDatabase} from "../database";
import Server from "../../structs/Server";
import User from "../../structs/User";
import {getUser} from "../usermanager";

export default class GetMembers extends WebsocketEvent {
    constructor() {
        super("GET_MEM");
    }

    async exec(event, ws, args) {
        const server = await readDatabase("servers",ws.currentServer) as Server;
        const memberPromises: Promise<User>[] = [];
        server.members.forEach(memberID => {
            memberPromises.push(getUser(memberID));
        });
        const members = await Promise.all(memberPromises);
        const connectionIDs = getConnectionIDs();
        const memberList = members.map(x => ({user: x, online: connectionIDs.includes(x.ID) ? "ONLINE" : "OFFLINE"}));

        ws.send(JSON.stringify({
            opCode: "GET_MEM",
            data: {
                memberList
            }
        }));
    }
}