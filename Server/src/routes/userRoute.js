import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { addCommentToProblem, deleteComment, getCommentsForProblem, loginUser, logout, signupUser, getUserProfile, updateUserProfile } from "../controller/userController.js";
import { assignProblem, createProblem, deleteProblem, getAllProblems, getOfficialProblems, rateProblem, getUserComplaints } from "../controller/problemController.js";
import { loginOfficial, signupOfficial } from "../controller/officialController.js";



const router = Router();

// local user
router.route("/signupUser").post(signupUser);
router.route("/loginUser").post(loginUser);
router.route("/logout").post(verifyJWT, logout);
router.route("/userProfile/:userId").get(verifyJWT, getUserProfile);
router.route("/updateUserProfile/:userId").put(verifyJWT, updateUserProfile);
router.route("/addComment/:problemId/:userId").post(verifyJWT, addCommentToProblem);
router.route("/comments/:commentId/:userId").delete(verifyJWT, deleteComment)
router.route("/getComment/:problemId").get(getCommentsForProblem)

// problem
router.route("/createProblem/:userId").post(verifyJWT, createProblem);
router.route("/problems/:problemId/rate/:userId").post(verifyJWT, rateProblem);
router.route("/assign/:problemId").post(assignProblem)
router.route("/problem/:problemId/user/:userId").delete(verifyJWT, deleteProblem)
router.route("/getAllproblems").get(getAllProblems)
router.route("/userComplaints/:userId").get(verifyJWT, getUserComplaints)



// official
router.route("/signupOfficial").post(signupOfficial)
router.route("/loginOfficial").post(loginOfficial)
router.route("/getProblemOfficial").get(verifyJWT, getOfficialProblems);

export default router;