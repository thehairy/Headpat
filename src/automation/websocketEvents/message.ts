import WebsocketEvent from "../../structs/WebsocketEvent";
import {readDatabase, writeDatabase} from "../database";
import User from "../../structs/User";
import Server from "../../structs/Server";
import Channel from "../../structs/Channel";
import Message from "../../structs/Message";
import {WebSocket} from "ws";

export default class MessageCreate extends WebsocketEvent {
    constructor() {
        super("MSG");
    }

    async exec(event, ws, args) {
        const msg: Message = {
            ID: "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)),
            createdAt: Date.now().toString(),
            content: event.data.content,
            userID: ws.tid,
            channelID: ws.currentChannel,
            serverID: ws.currentServer
        };
        sendMessage(msg).catch(e => {
            ws.send(JSON.stringify({
                opCode: "MSG",
                error: e
            }));
        });

        async function sendMessage(message: Message){
            return new Promise(async (res, rej)=>{
                const author = await readDatabase("users",message.userID) as User;
                if(!author) rej("NO_USER");
                if(message.serverID){
                    const server = await readDatabase("servers",message.serverID) as Server;
                    if(!server) rej("NO_SERVER");
                    if(!server.members.includes(author.ID)) rej("NOT_MEMBER");
                    if(!server.channels.includes(message.channelID)) rej("NO_CHANNEL");
                    const channel: Channel = await readDatabase("channels", message.channelID) as Channel;
                    if(channel["messages"] === undefined) channel["messages"] = [];
                    channel.messages.push(message.ID);
                    await writeDatabase("messages", message.ID, message);
                    await writeDatabase("channels", message.channelID, channel);
                } else {
                    const recipient = await readDatabase("users", message.channelID) as User;
                    if(!recipient) rej("NO_RECIPIENT");
                    await writeDatabase("messages", message.ID, message);
                    const recipientWebsocket = args.server.clients.find(x => x.tid === message.channelID);
                    recipientWebsocket.send(JSON.stringify({
                        opCode: "MSG",
                        data: message
                    }));
                    return res(true);
                }

                const queue: Promise<boolean>[] = [];
                args.server.clients.forEach(x => {
                    queue.push(new Promise(async res => {
                        if(x.readyState === WebSocket.OPEN){
                            const user = await readDatabase("users",x.tid) as User;
                            if(!user) return res(false);
                            if(user.servers.includes(message.serverID)){
                                x.send(JSON.stringify({
                                    opCode: "MSG",
                                    data: message
                                }));
                                res(true);
                            }
                        }
                    }));
                });
                Promise.all(queue).then(()=>res(true));
            });
        }
    }
}