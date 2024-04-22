import {readDatabase} from "./database";
import Auth from "../structs/Auth";

const connections = new Map();

function hasConnection(id: string): boolean{
    return connections.has(id);
}

function setConnection(id: string, connection){
    connections.set(id, connection);
}

function getConnection(id: string){
    return connections.get(id);
}

function connectionHeartbeat(id: string){
    let a = connections.get(id);
    a.heartbeat = Date.now();
    connections.set(id,a);
}

setInterval(()=>{
    connections.forEach(async x => {
        const inspect = await readDatabase("auth",x.id) as Auth;
        if(x.session !== inspect.sessionSecret || Date.now() - x.heartbeat > 1000*15){
            connections.delete(x.id);
            //console.log(`${x.id} lost connection.`);
        }
    });
}, 30*1000);

export {
    hasConnection,
    setConnection,
    getConnection,
    connectionHeartbeat
}