"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfile = exports.updateProfile = exports.getProfile = exports.getAllProfiles = exports.createProfile = void 0;
const firebase_config_1 = require("../config/firebase.config");
const api_error_1 = require("../errors/api.error");
const schema_1 = require("../schema/schema");
const profilesRef = firebase_config_1.db.collection("profiles");
const createProfile = async (req, res) => {
    const { success, data, error } = schema_1.profileSchema.safeParse(req.body);
    if (!success)
        throw new api_error_1.AppError(400, "Bad Request", error);
    await profilesRef.add(data);
    return res.sendStatus(200);
};
exports.createProfile = createProfile;
const updateProfile = async (req, res) => {
    const { success, data, error } = schema_1.profileSchema.safeParse(req.body);
    if (!success)
        throw new api_error_1.AppError(400, "Bad Request", error);
    await profilesRef.add(data);
    return res.sendStatus(201);
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res) => {
    const id = req.params.id;
    const profile = await profilesRef.doc(id).get();
    if (!profile.exists)
        throw new api_error_1.AppError(404, "product not found");
    await profilesRef.doc(id).delete();
    return res.sendStatus(204);
};
exports.deleteProfile = deleteProfile;
const getProfile = async (req, res) => {
    const id = req.params.id;
    const profile = await profilesRef.doc(id).get();
    if (!profile.exists)
        throw new api_error_1.AppError(404, "product not found");
    return res.json({
        id: profile.id, ...profile.data
    });
};
exports.getProfile = getProfile;
const getAllProfiles = async (_req, res) => {
    const profiles = await profilesRef.get();
    if (profiles.empty)
        return res.json([]);
    else {
        return res.json(profiles.docs.map(doc => {
            return {
                id: doc.id, ...doc.data()
            };
        }));
    }
};
exports.getAllProfiles = getAllProfiles;
