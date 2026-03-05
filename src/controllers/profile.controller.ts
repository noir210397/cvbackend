import { RequestHandler } from "express";
import { db } from "src/config/firebase.config";
import { AppError } from "src/errors/api.error";
import { profileSchema } from "src/schema/schema";

const profilesRef = db.collection("profiles")

const createProfile: RequestHandler = async (req, res) => {
    const { success, data, error } = profileSchema.safeParse(req.body)
    if (!success) throw new AppError(400, "Bad Request", error)
    await profilesRef.add(data)
    return res.sendStatus(200)

}
const updateProfile: RequestHandler = async (req, res) => {
    const { success, data, error } = profileSchema.safeParse(req.body)
    if (!success) throw new AppError(400, "Bad Request", error)
    await profilesRef.add(data)
    return res.sendStatus(201)

}
const deleteProfile: RequestHandler = async (req, res) => {
    const id = req.params.id as string
    const profile = await profilesRef.doc(id).get()
    if (!profile.exists) throw new AppError(404, "product not found")
    await profilesRef.doc(id).delete()
    return res.sendStatus(204)
}
const getProfile: RequestHandler = async (req, res) => {
    const id = req.params.id as string
    const profile = await profilesRef.doc(id).get()
    if (!profile.exists) throw new AppError(404, "product not found")
    return res.json({
        id: profile.id, ...profile.data
    })
}

const getAllProfiles: RequestHandler = async (_req, res) => {
    const profiles = await profilesRef.get()
    if (profiles.empty) return res.json([])
    else {
        return res.json(profiles.docs.map(doc => {
            return {
                id: doc.id, ...doc.data()
            }
        }))
    }
}
export { createProfile, getAllProfiles, getProfile, updateProfile, deleteProfile }