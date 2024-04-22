import {
    readdirSync
} from "fs";
import WebsocketEvent from "../structs/WebsocketEvent";

export async function loadWebsocketEvents(): Promise<Map<string, WebsocketEvent>> {
    return new Promise(res => {
        const events: Map<string, WebsocketEvent> = new Map();
        console.log("Loading webhook events...");
        const eventFiles = readdirSync(`${__dirname}/websocketEvents/`).filter(x => x.endsWith(".js"));
        const eventTable: Object = {};
        const promises: Array<Promise<boolean>> = [];
        eventFiles.forEach(name => {
            promises.push(new Promise(res => {
                import(`./websocketEvents/${name}`).then(file => {
                    const js = new(<any>Object.entries(file)[0][1]);
                    if(!(js instanceof WebsocketEvent)) return;
                    const opcode = js.getOpcode();
                    events.set(opcode,js);
                    eventTable[opcode] = {loaded: true};
                    res(true);
                }).catch(() => res(false));
            }));
        });
        Promise.all(promises).then(() => {
            console.table(eventTable);
            console.log("\nEvents loaded.");
            res(events);
        });
    });
}