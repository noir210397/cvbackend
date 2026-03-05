"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeneratedContent = exports.updateGeneratedContent = exports.generatePreview = exports.generateDocument = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const openai_1 = __importDefault(require("../config/openai"));
// import { v4 as uuidv4 } from "uuid"
const zod_1 = require("openai/helpers/zod");
const schema_1 = require("../schema/schema");
const api_error_1 = require("../errors/api.error");
const firebase_config_1 = require("../config/firebase.config");
const docx_1 = require("docx");
const generateDocument = async (req, res) => {
    const { id } = req.params;
    const doc = await firebase_config_1.db.collection("contents").doc(id).get();
    if (!doc.exists)
        throw new api_error_1.AppError(400, undefined);
    const data = doc.data();
    if (!data)
        throw new api_error_1.AppError(400, undefined);
    if (data.type === "cv") {
        let browser;
        if (process.env.NODE_ENV === "development") {
            browser = await puppeteer_1.default.launch();
        }
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
        });
        const page = await browser.newPage();
        await page.goto(process.env.URL || `http://localhost:5500/cv/${doc.id}`, {
            waitUntil: 'networkidle2',
        });
        const cv = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
            preferCSSPageSize: true
        });
        await browser.close();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=cv.pdf");
        return res.send(cv);
    }
    else if (data.type === "cover letter") {
        const { paragraphs } = data; // expecting string[]
        // Map array of strings to docx Paragraphs
        const docParagraphs = paragraphs.map((para) => new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: para,
                    size: 22, // 11pt (docx uses half-points)
                }),
            ],
            spacing: {
                after: 200, // space between paragraphs
            },
        }));
        const document = new docx_1.Document({
            sections: [
                {
                    properties: {},
                    children: docParagraphs,
                },
            ],
        });
        const buffer = await docx_1.Packer.toBuffer(document);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", "attachment; filename=cover-letter.docx");
        return res.send(buffer);
    }
    else
        return res.status(400).send("unknown data type");
};
exports.generateDocument = generateDocument;
// const generateCoverLetter: RequestHandler = async (req, res) => {
//     const { id } = req.params
//     const doc = await db.collection("contents").doc(id as string).get()
//     if (!doc.exists) throw new AppError(400, undefined)
//     const data = doc.data() as { type: string, paragraphs: string[] }
//     if (!data || data.type !== "cover letter") throw new AppError(400, undefined)
//     const { paragraphs } = data; // expecting string[]
//     // Map array of strings to docx Paragraphs
//     const docParagraphs = paragraphs.map(
//         (para: string) =>
//             new Paragraph({
//                 children: [
//                     new TextRun({
//                         text: para,
//                         size: 22, // 11pt (docx uses half-points)
//                     }),
//                 ],
//                 spacing: {
//                     after: 200, // space between paragraphs
//                 },
//             })
//     );
//     const document = new Document({
//         sections: [
//             {
//                 properties: {},
//                 children: docParagraphs,
//             },
//         ],
//     });
//     const buffer = await Packer.toBuffer(document);
//     res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//     );
//     res.setHeader(
//         "Content-Disposition",
//         "attachment; filename=cover-letter.docx"
//     );
//     return res.send(buffer);
// }
const generatePreview = async (req, res) => {
    const cvInstruction = `
You are a professional CV writing assistant.

Your task is to generate a tailored professional summary based on:
- The candidate's technical skills
- The job requirements

Rules:
- Maximum 120 words
- Use only the provided skills
- Do NOT invent technologies or experience
- Emphasize skills that match the job requirements
- Keep tone professional,concise and human written
- Return structured JSON matching the required schema
  `;
    const coverLetterInstruction = `
You are a professional cover letter writing assistant.

Your task is to generate a tailored cover letter based on:
- The candidate's technical skills
- The job description

Rules:
- Write 3 to 5 paragraphs.
- Each paragraph must be a separate string in the output array.
- Do NOT merge paragraphs.
- Maximum total length: 350 words.
- Use only the provided skills.
- Do NOT invent technologies, experience, or qualifications.
- Emphasize skills that match the job requirements.
- Keep tone professional, confident, and natural.
- Avoid generic phrases like "I am writing to apply".
- Do not include placeholders.
- Return structured JSON matching the required schema.
`;
    let profile;
    const { success, data, error } = schema_1.previewSchema.safeParse(req.body);
    if (!success)
        throw new api_error_1.AppError(400, undefined, error);
    else {
        const { extraInformation, jobRequirements, type, profileId: id } = data;
        if (type === "cv") {
            const doc = await firebase_config_1.db.collection("profiles").doc(id).get();
            if (!doc.exists) {
                return res.status(400).json({ id: "no profile found" });
            }
            profile = doc.data();
        }
        const response = await openai_1.default.responses.parse({
            model: "gpt-4.1-mini",
            instructions: type === "cv" ? cvInstruction : coverLetterInstruction,
            input: `
            ${type === "cv" ? `Candidate Technical Skills:${JSON.stringify(profile.technicalSkills, null, 2)}` : ""}

Job Description(copied from Indeed):
            ${jobRequirements}

Additional Information:
            ${extraInformation ?? "None provided"}
    `,
            text: {
                format: type === "cv" ? (0, zod_1.zodTextFormat)(schema_1.openAICVSchema, "cv") : (0, zod_1.zodTextFormat)(schema_1.openAILetterSchema, "cover-letter")
            }
        });
        if (!response.output_parsed)
            throw new Error("unable to generate cv to desired schema");
        const content = await firebase_config_1.db.collection("contents").add({ type, ...response.output_parsed, profile: profile ? profile : null });
        return res.json(content.id);
    }
};
exports.generatePreview = generatePreview;
const updateGeneratedContent = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new api_error_1.AppError(400, "id is required");
    // Fetch profile from DB
    const doc = await firebase_config_1.db.collection("contents").doc(id).get();
    if (!doc.exists)
        throw new api_error_1.AppError(404, "Content not found");
    const profile = doc.data();
    if (!profile?.type)
        throw new api_error_1.AppError(400, "Content type is missing");
    // Pick schema based on type
    const schema = profile.type === "cv" ? schema_1.openAICVSchema : schema_1.openAILetterSchema;
    // Validate input
    const { success, data, error } = schema.safeParse(req.body);
    if (!success)
        throw new api_error_1.AppError(400, undefined, error);
    // Update the relevant field
    await firebase_config_1.db.collection("contents").doc(id).update(data);
    return res.sendStatus(201);
};
exports.updateGeneratedContent = updateGeneratedContent;
const getGeneratedContent = async (req, res) => {
    const { id } = req.params;
    // console.log(id);
    const doc = await firebase_config_1.db.collection("contents").doc(id).get();
    if (!doc.exists)
        return res.sendStatus(404);
    return res.json({ id: doc.id, ...doc.data() });
};
exports.getGeneratedContent = getGeneratedContent;
