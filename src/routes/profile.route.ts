import { Router } from "express";
import { createProfile, deleteProfile, getAllProfiles, getProfile } from "src/controllers/profile.controller";
import { validateIdParam } from "src/middlewares/validate-id.middleware";

const profileRouter = Router()

profileRouter.get("/:id", validateIdParam, getProfile)
profileRouter.get("/", getAllProfiles)
profileRouter.post("/", createProfile)
profileRouter.put("/:id", validateIdParam, getProfile)
profileRouter.delete("/:id", validateIdParam, deleteProfile)

export default profileRouter