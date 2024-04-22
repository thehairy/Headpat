import WebsocketEvent from "../../structs/WebsocketEvent";
import {readDatabase} from "../database";
import Channel from "../../structs/Channel";
import Message from "../../structs/Message";


export default class GetMessages extends WebsocketEvent {
    constructor() {
        super("GET_MSG");
    }

    async exec(event, ws, args) {
        if(event.data?.from) return; //TODO Implement scrolling get
        const channel = await readDatabase("channels",ws.currentChannel) as Channel;
        const messagePromises: Promise<Message>[] = [];
        channel.messages.slice(-50).forEach(messageID => {
            messagePromises.push(readDatabase("messages", messageID) as Promise<Message>);
        });
        const messages: Message[] = await Promise.all(messagePromises);
        ws.send(JSON.stringify({
            opCode: "GET_MSG",
            data: {
                messages
            }
        }));
    }
}