import {Router} from "express";
import {jwtVerify} from "jose";
import {getUser} from "../automation/usermanager";
import {readDatabase} from "../automation/database";
import Auth from "../structs/Auth";

const appRouter = Router();

appRouter.get("/", (req, res)=>{
    if(!req.cookies.auth) return res.redirect("/login");
    jwtVerify(req.cookies.auth, new TextEncoder().encode(process.env.JWT_SECRET as string)).then(async jwtData => {
        const payload = jwtData.payload;
        if(payload.iss !== "urn:Headpat:axiom" || payload.aud !== "urn:Headpat:users") return res.clearCookie("auth").redirect("/");
        const auth: Auth | null = await readDatabase("auth",payload.id) as Auth;
        if(!auth) return res.clearCookie("auth").redirect("/");
        const user = await getUser(payload.id);
        if(!user) return res.clearCookie("auth").redirect("/");
        res.render("app.ejs", {user});
    }).catch(() => res.clearCookie("auth").redirect("/"));
});

export default appRouter;