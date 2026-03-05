import { RequestHandler } from "express";
import puppeteer, { Browser } from "puppeteer";
import client from "src/config/openai";
// import { v4 as uuidv4 } from "uuid"
import { zodTextFormat } from "openai/helpers/zod"
import { coverLetterPreviewSchema, cvSchema, CVValues, openAICVSchema, openAILetterSchema, previewCVSchema, previewSchema } from "src/schema/schema";
import { AppError } from "src/errors/api.error";
import { db } from "src/config/firebase.config";
import { Document, Packer, Paragraph, TextRun } from "docx";


const generateDocument: RequestHandler = async (req, res) => {
    const { id } = req.params
    const doc = await db.collection("contents").doc(id as string).get()
    if (!doc.exists) throw new AppError(400, undefined)
    const data = doc.data()
    if (!data) throw new AppError(400, undefined)
    if (data.type === "cv") {
        let browser: Browser
        if (process.env.NODE_ENV === "development") {
            browser = await puppeteer.launch();
        }
        else {

            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
            });
        }
        const page = await browser.newPage();
        await page.goto(process.env.URL! || `https://cvgenerator-cyan.vercel.app/cv/${doc.id}`, {
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
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=cv.pdf"
        );
        return res.send(cv)
    }
    else if (data.type === "cover letter") {
        const { paragraphs } = data as { paragraphs: string[] }; // expecting string[]

        // Map array of strings to docx Paragraphs
        const docParagraphs = paragraphs.map(
            (para: string) =>
                new Paragraph({
                    children: [
                        new TextRun({
                            text: para,
                            size: 22, // 11pt (docx uses half-points)
                        }),
                    ],
                    spacing: {
                        after: 200, // space between paragraphs
                    },
                })
        );

        const document = new Document({
            sections: [
                {
                    properties: {},
                    children: docParagraphs,
                },
            ],
        });

        const buffer = await Packer.toBuffer(document);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=cover-letter.docx"
        );

        return res.send(buffer);
    }
    else return res.status(400).send("unknown data type")
}
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
const generatePreview: RequestHandler = async (req, res) => {
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
  `
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
`
    let profile: CVValues | undefined
    const { success, data, error } = previewSchema.safeParse(req.body)
    if (!success) throw new AppError(400, undefined, error)
    else {
        const { extraInformation, jobRequirements, type, profileId: id } = data
        if (type === "cv") {
            const doc = await db.collection("profiles").doc(id!).get()
            if (!doc.exists) {
                return res.status(400).json({ id: "no profile found" });
            }
            profile = doc.data() as CVValues;
        }
        const response = await client.responses.parse({
            model: "gpt-4.1-mini",
            instructions: type === "cv" ? cvInstruction : coverLetterInstruction,
            input: `
            ${type === "cv" ? `Candidate Technical Skills:${JSON.stringify(profile!.technicalSkills, null, 2)}` : ""
                }

Job Description(copied from Indeed):
            ${jobRequirements}

Additional Information:
            ${extraInformation ?? "None provided"}
    `,
            text: {
                format: type === "cv" ? zodTextFormat(openAICVSchema, "cv") : zodTextFormat(openAILetterSchema, "cover-letter")
            }
        })
        if (!response.output_parsed) throw new Error("unable to generate cv to desired schema")
        const content = await db.collection("contents").add({ type, ...response.output_parsed, profile: profile ? profile : null })
        return res.json(content.id)
    }
}
const updateGeneratedContent: RequestHandler = async (req, res) => {
    const { id } = req.params;

    if (!id) throw new AppError(400, "id is required");

    // Fetch profile from DB
    const doc = await db.collection("contents").doc(id as string).get();
    if (!doc.exists) throw new AppError(404, "Content not found");

    const profile = doc.data();
    if (!profile?.type) throw new AppError(400, "Content type is missing");

    // Pick schema based on type
    const schema = profile.type === "cv" ? openAICVSchema : openAILetterSchema;

    // Validate input
    const { success, data, error } = schema.safeParse(req.body);
    if (!success) throw new AppError(400, undefined, error);

    // Update the relevant field
    await db.collection("contents").doc(id as string).update(data);

    return res.sendStatus(201);
};
const getGeneratedContent: RequestHandler = async (req, res) => {
    const { id } = req.params
    // console.log(id);

    const doc = await db.collection("contents").doc(id as string).get()
    if (!doc.exists) return res.sendStatus(404)
    return res.json({ id: doc.id, ...doc.data() })
}

export { generateDocument, generatePreview, updateGeneratedContent, getGeneratedContent }