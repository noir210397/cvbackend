import z, { string } from "zod"

export const validateId = z.string("provide a valid Id").regex(/^[A-Za-z0-9]{20}$/, "Invalid Firestore auto ID");


export const profileSchema = z.object({
    fullName: z.string(),
    title: z.string(),
    address: z.string(),
    githubUrl: z.string(),
    email: z.email(),
    linkedUrl: z.string().nullable().default(null),
    experience: z.array(z.object({
        companyName: z.string(),
        role: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        workDone: z.array(z.string())
    })),
    technicalSkills: z.array(z.object({ header: z.string(), skills: z.array(z.string()) })),
    projects: z.array(z.object({
        name: z.string(),
        role: z.string(),
        workDone: z.array(z.string()),
        stack: z.array(z.string()),
    })),
    education: z.array(z.object({
        schoolName: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        degree: z.string(),
    })),
    attributes: z.array(z.string()),
    references: z.array(z.object({
        name: z.string(),
        emailAddress: z.email()
    })).nullable()
        .default(null)
})
export const cvSchema = profileSchema.extend({
    professionalSummary: z.string(),
    requirements: z.string().min(1),
    extraInformation: z.string().nullable()
        .default(null)
})
export const previewCVSchema = cvSchema.pick({
    extraInformation: true, requirements: true
}).extend({
    technicalSkills: z.array(z.object({ header: z.string(), skills: z.array(z.string()) })),
})
export const previewSchema = z.object({
    type: z.enum(["cv", "cover letter"]),
    jobRequirements: z
        .string()
        .min(4, "Job requirements must be at least 4 characters"),

    extraInformation: z
        .string()
        // .min(4, "Extra information must be at least 4 characters")
        .optional(),

    profileId: z.string().optional(),
})
    .superRefine((data, ctx) => {
        if (data.type === "cv" && !data.profileId) {
            ctx.addIssue({
                path: ["profileId"],
                code: z.ZodIssueCode.custom,
                message: "Profile is required when generating a CV",
            });
        }
    });

export const coverLetterPreviewSchema = z.object({
    paragraphs: z.array(z.string())
});

export const openAICVSchema = cvSchema.pick({
    professionalSummary: true,

})
export const openAILetterSchema = z.object({
    paragraphs: z.array(z.string())
});
// export type LetterValues = z.infer<typeof letterSchema>
export type CVValues = z.infer<typeof cvSchema>
export type ProfileType = z.infer<typeof profileSchema>
export type PreviewType = z.infer<typeof previewSchema>