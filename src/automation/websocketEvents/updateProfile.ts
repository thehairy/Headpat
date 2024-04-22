import WebsocketEvent from "../../structs/WebsocketEvent";
import {getUser} from "../usermanager";
import Auth from "../../structs/Auth";
import {readDatabase, writeDatabase} from "../database";
import {compare} from "bcrypt";
import {updatePass} from "../authmanager";

export default class UpdateProfile extends WebsocketEvent {
    constructor() {
        super("UPD_PRF");
    }

    async exec(event, ws) {
        const user = await getUser(ws.tid);
        const auth: Auth | null = await readDatabase("auth",ws.tid) as Auth;
        if(event.data.email){
            const emailRgx = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/gi;
            if(!emailRgx.test(event.data.email)) return ws.send(JSON.stringify({opCode: "UPD_PRF",error: "INVALID_EMAIL"}));
            if(event.data.email.split("@").length !== 2 || event.data.email.split("@")[1] === "localhost") return ws.send(JSON.stringify({opCode: "UPD_PRF",error: "INVALID_EMAIL"}));
            auth.email = event.data.email;
        }
        if(event.data.oldPass && event.data.newPass){
            const validPass = await compare(event.data.oldPass, auth.passHash);
            if(!validPass) return ws.send(JSON.stringify({error: "INVALID_PASSWORD"}));
            await updatePass(ws.tid, event.data.newPass);
        }
        if(event.data.username){
            user.username = event.data.username;
        }
        if(event.data.discriminator){
            user.discriminator = event.data.discriminator;
        }
        await writeDatabase("users", ws.tid, user);
        await writeDatabase("auth", ws.tid, auth);

        //Mask the email being sent.
        ws.send(JSON.stringify({
            opCode: "UPD_PRF",
            data: {user, email: `${auth.email.substring(0,1)}*******${auth.email.split("@")[0].substring(auth.email.split("@")[0].length-1)}@${auth.email.split("@")[1]}`}
        }))
    }
}