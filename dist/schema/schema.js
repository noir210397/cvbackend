"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAILetterSchema = exports.openAICVSchema = exports.coverLetterPreviewSchema = exports.previewSchema = exports.previewCVSchema = exports.cvSchema = exports.profileSchema = exports.validateId = void 0;
const zod_1 = __importDefault(require("zod"));
exports.validateId = zod_1.default.string("provide a valid Id").regex(/^[A-Za-z0-9]{20}$/, "Invalid Firestore auto ID");
exports.profileSchema = zod_1.default.object({
    fullName: zod_1.default.string(),
    title: zod_1.default.string(),
    address: zod_1.default.string(),
    githubUrl: zod_1.default.string(),
    email: zod_1.default.email(),
    linkedUrl: zod_1.default.string().nullable().default(null),
    experience: zod_1.default.array(zod_1.default.object({
        companyName: zod_1.default.string(),
        role: zod_1.default.string(),
        startDate: zod_1.default.coerce.date(),
        endDate: zod_1.default.coerce.date(),
        workDone: zod_1.default.array(zod_1.default.string())
    })),
    technicalSkills: zod_1.default.array(zod_1.default.object({ header: zod_1.default.string(), skills: zod_1.default.array(zod_1.default.string()) })),
    projects: zod_1.default.array(zod_1.default.object({
        name: zod_1.default.string(),
        role: zod_1.default.string(),
        workDone: zod_1.default.array(zod_1.default.string()),
        stack: zod_1.default.array(zod_1.default.string()),
    })),
    education: zod_1.default.array(zod_1.default.object({
        schoolName: zod_1.default.string(),
        startDate: zod_1.default.coerce.date(),
        endDate: zod_1.default.coerce.date(),
        degree: zod_1.default.string(),
    })),
    attributes: zod_1.default.array(zod_1.default.string()),
    references: zod_1.default.array(zod_1.default.object({
        name: zod_1.default.string(),
        emailAddress: zod_1.default.email()
    })).nullable()
        .default(null)
});
exports.cvSchema = exports.profileSchema.extend({
    professionalSummary: zod_1.default.string(),
    requirements: zod_1.default.string().min(1),
    extraInformation: zod_1.default.string().nullable()
        .default(null)
});
exports.previewCVSchema = exports.cvSchema.pick({
    extraInformation: true, requirements: true
}).extend({
    technicalSkills: zod_1.default.array(zod_1.default.object({ header: zod_1.default.string(), skills: zod_1.default.array(zod_1.default.string()) })),
});
exports.previewSchema = zod_1.default.object({
    type: zod_1.default.enum(["cv", "cover letter"]),
    jobRequirements: zod_1.default
        .string()
        .min(4, "Job requirements must be at least 4 characters"),
    extraInformation: zod_1.default
        .string()
        // .min(4, "Extra information must be at least 4 characters")
        .optional(),
    profileId: zod_1.default.string().optional(),
})
    .superRefine((data, ctx) => {
    if (data.type === "cv" && !data.profileId) {
        ctx.addIssue({
            path: ["profileId"],
            code: zod_1.default.ZodIssueCode.custom,
            message: "Profile is required when generating a CV",
        });
    }
});
exports.coverLetterPreviewSchema = zod_1.default.object({
    paragraphs: zod_1.default.array(zod_1.default.string())
});
exports.openAICVSchema = exports.cvSchema.pick({
    professionalSummary: true,
});
exports.openAILetterSchema = zod_1.default.object({
    paragraphs: zod_1.default.array(zod_1.default.string())
});
