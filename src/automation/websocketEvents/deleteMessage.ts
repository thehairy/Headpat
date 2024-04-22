import WebsocketEvent from "../../structs/WebsocketEvent";
import {readDatabase, removeDatabase, writeDatabase} from "../database";
import Message from "../../structs/Message";
import Channel from "../../structs/Channel";
import {WebSocket} from "ws";

export default class DeleteMessage extends WebsocketEvent {
    constructor() {
        super("DEL_MSG");
    }

    async exec(event, ws, args) {
        readDatabase("messages", event.data.messageID).then((message: Message) => {
            if(
                message.serverID === ws.currentServer &&
                message.channelID === ws.currentChannel &&
                message.userID === ws.tid
            ){
                removeDatabase("messages",event.data.messageID).then(()=>{
                    readDatabase("channels", message.channelID).then((channel: Channel) => {
                        const idx = channel.messages.indexOf(event.data.messageID);
                        if(idx > -1) channel.messages.splice(idx,1);
                        writeDatabase("channels",message.channelID,channel).then(()=>{
                            args.server.clients.forEach(x => {
                                if(x.readyState === WebSocket.OPEN && x.currentChannel === ws.currentChannel){
                                    x.send(JSON.stringify({
                                        opCode: "DEL_MSG",
                                        data: {
                                            messageID: event.data.messageID
                                        }
                                    }));
                                }
                            }); //What the fuck is this catching hell... I need to improve upon this XD
                        }).catch(()=>{
                            ws.send(JSON.stringify({
                                opCode: "DEL_MSG",
                                error: "Channel not found."
                            }));
                        });
                    }).catch(()=>{
                        ws.send(JSON.stringify({
                            opCode: "DEL_MSG",
                            error: "Channel not found."
                        }));
                    });
                }).catch(()=>{
                    ws.send(JSON.stringify({
                        opCode: "DEL_MSG",
                        error: "Message not found."
                    }));
                });
            } else {
                ws.send(JSON.stringify({
                    opCode: "DEL_MSG",
                    error: "Message data not a match."
                }));
            }
        }).catch(()=>{
            ws.send(JSON.stringify({
                opCode: "DEL_MSG",
                error: "Message data not a match."
            }));
        });
    }
}