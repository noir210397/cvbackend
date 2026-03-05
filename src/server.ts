import "dotenv/config"
import express from "express"
import { generateDocument, generatePreview, getGeneratedContent, updateGeneratedContent } from "./controllers/file.controller"
import { errorHandler } from "./middlewares/error.middleware"
import { notfoundHandler } from "./middlewares/notfound.middleware"
import puppeteer from "puppeteer"
import { v4 as uuidv4 } from "uuid"
import profileRouter from "./routes/profile.route"
import { db } from "./config/firebase.config"
import { data } from "./seeder"
import corsMiddleware from "./middlewares/cors.middleware"
import { validateIdParam } from "./middlewares/validate-id.middleware"

const PORT = Number(process.env.PORT) || 5000
const app = express()

// async function test() {
//     try {
//         console.log("started");

//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         await page.goto(process.env.URL! || "http://localhost:5500/", {
//             waitUntil: 'networkidle2',
//         });
//         // Saves the PDF to hn.pdf.
//         await page.pdf({
//             path: `src/cvs/${uuidv4()}.pdf`,
//         });

//         await browser.close();
//         console.log("finished");

//     } catch (error) {
//         console.log(error);

//     }
// }
async function seeder() {
    console.log("seeding");
    try {
        await db.collection("profiles").add(data)
        console.log("data seeded");
    } catch (error) {
        console.log("unable to seed data");
    }
}
app.use(corsMiddleware)
app.use(express.json())
// app.post("/api/letter/:id", validateIdParam("letter"), generateCoverLetter)
// app.post("/api/cover/preview", generateCoverLetter)
app.get("/api/document/:id", validateIdParam("document"), generateDocument)
app.post("/api/content/", generatePreview)
app.get("/api/content/:id", validateIdParam("content"), getGeneratedContent)
app.put("/api/content/:id", validateIdParam("/generate"), updateGeneratedContent)
app.use("/api/profile", profileRouter)
app.use(notfoundHandler)
app.use(errorHandler)



function startServer() {
    try {
        app.listen(PORT, async (err) => {
            if (!err) {
                if (process.env.NODE_ENV === "development") {
                    // const tunnel = await localtunnel({ port: PORT, });
                    console.log(`server running on port:${PORT}`)
                    // console.log(` url:${tunnel.url}`);
                    // await seeder()
                }
                else {
                    console.log(err);
                }
            }
        })

    } catch (error) {
        console.log(error)
    }
}

startServer()
