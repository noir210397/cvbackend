"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const file_controller_1 = require("./controllers/file.controller");
const error_middleware_1 = require("./middlewares/error.middleware");
const notfound_middleware_1 = require("./middlewares/notfound.middleware");
const profile_route_1 = __importDefault(require("./routes/profile.route"));
const firebase_config_1 = require("./config/firebase.config");
const seeder_1 = require("./seeder");
const cors_middleware_1 = __importDefault(require("./middlewares/cors.middleware"));
const validate_id_middleware_1 = require("./middlewares/validate-id.middleware");
const PORT = Number(process.env.PORT) || 5000;
const app = (0, express_1.default)();
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
        await firebase_config_1.db.collection("profiles").add(seeder_1.data);
        console.log("data seeded");
    }
    catch (error) {
        console.log("unable to seed data");
    }
}
app.use(cors_middleware_1.default);
app.use(express_1.default.json());
// app.post("/api/letter/:id", validateIdParam("letter"), generateCoverLetter)
// app.post("/api/cover/preview", generateCoverLetter)
app.get("/api/document/:id", (0, validate_id_middleware_1.validateIdParam)("document"), file_controller_1.generateDocument);
app.post("/api/content/", file_controller_1.generatePreview);
app.get("/api/content/:id", (0, validate_id_middleware_1.validateIdParam)("content"), file_controller_1.getGeneratedContent);
app.put("/api/content/:id", (0, validate_id_middleware_1.validateIdParam)("/generate"), file_controller_1.updateGeneratedContent);
app.use("/api/profile", profile_route_1.default);
app.use(notfound_middleware_1.notfoundHandler);
app.use(error_middleware_1.errorHandler);
function startServer() {
    try {
        app.listen(PORT, async (err) => {
            if (!err) {
                if (process.env.NODE_ENV === "development") {
                    // const tunnel = await localtunnel({ port: PORT, });
                    console.log(`server running on port:${PORT}`);
                    // console.log(` url:${tunnel.url}`);
                    // await seeder()
                }
                else {
                    console.log(err);
                }
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}
startServer();
