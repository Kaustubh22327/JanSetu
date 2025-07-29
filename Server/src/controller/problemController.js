import ProblemReport from "../models/problemModel.js";
import Vote from "../models/voteModel.js";
import User from "../models/userModel.js";
import Official from "../models/officialModel.js";
import Comment from "../models/commentModel.js";
import mongoose from "mongoose";

export const createProblem = async (req, res) => {
    try {
        const { title, description, category, coordinates, rating } = req.body;
        const userId = req.params.userId;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" })
        }

        const voteCount = rating >= 3 ? 1 : 0;

        const newProblem = await ProblemReport.create({
            title,
            description,
            category,
            location: {
                type: "Point",
                coordinates: coordinates,
            },
            createdBy: userId,
            voteCount,
            averageRating: rating
        })

        await Vote.create({
            user: userId,
            problem: newProblem._id,
            rating
        })

        res.status(201).json({
            success: true,
            message: "Problem reported successfully",
            problem: newProblem,
        });

    } catch (error) {
        console.error("Error creating problem report:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}


export const rateProblem = async (req, res) => {
    try {
        const userId = req.params.userId;
        const problemId = req.params.problemId;

        const { rating } = req.body;


        // console.log(userId)
        // console.log(problemId)

        if (!mongoose.Types.ObjectId.isValid(problemId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid IDs" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        const alreadyRated = await Vote.findOne({ user: userId, problem: problemId });

        if (alreadyRated) {
            return res.status(400).json({ success: false, message: "You already rated this problem" });
        }

        await Vote.create({
            user: userId,
            problem: problemId,
            rating,
        });

        if (rating >= 3) {
            await ProblemReport.findByIdAndUpdate(problemId, {
                $inc: { voteCount: 1 },
            });
        }

        const allVotes = await Vote.find({ problem: problemId });

        if (allVotes.length > 0) {
            const totalRating = allVotes.reduce((sum, vote) => sum + vote.rating, 0);
            const avgRating = totalRating / allVotes.length;

            // console.log(avgRating)
            await ProblemReport.findByIdAndUpdate(problemId, {
                averageRating: Number(avgRating.toFixed(2)),
            });
        }


        res.status(200).json({
            success: true,
            message: "Rating submitted successfully",
        });

    } catch (error) {
        console.error("Error rating problem:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}


export const assignProblem = async (req, res) => {
    try {
        const problemId = req.params.problemId;
        const problem = await ProblemReport.findById(problemId);

        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }

        if (problem.voteCount < 5) {
            return res.status(400).json({ success: false, message: "Votes are less than 5. Not eligible for assignment." });
        }

        if (problem.assignedTo) {
            return res.status(400).json({ success: false, message: "Problem is already assigned" });
        }

        const official = await Official.findOne({ department: problem.category });

        if (!official) {
            return res.status(404).json({ success: false, message: "No official found for this department" });
        }

        problem.assignedTo = official._id;
        problem.status = "assigned";
        await problem.save();

        official.assignedProblems.push(problemId);
        await official.save();


        res.status(200).json({
            success: true,
            message: `Problem assigned to official of ${problem.category} department`,
            problem
        });

    } catch (error) {
        console.error("Error assigning problem:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


export const deleteProblem = async (req, res) => {
    try {
        const { problemId, userId } = req.params;

        const problem = await ProblemReport.findById(problemId);

        if (!problem) {
            return res.status(404).json({ success: false, message: "No problem exists" });
        }

        if (problem.createdBy.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own problem" });
        }

        if (problem.assignedTo) {
            await Official.findByIdAndUpdate(problem.assignedTo, {
                $pull: { assignedProblems: problemId }
            });
        }

        await ProblemReport.findByIdAndDelete(problemId);

        await Vote.deleteMany({ problem: problemId });
        await Comment.deleteMany({ toProblem: problemId });

        res.status(200).json({ success: true, message: "Problem deleted successfully" });
    } catch (error) {
        console.error("Error deleting problem:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const getAllProblems = async (req, res) => {
    try {
        
        const problems = await ProblemReport.find().lean();

        
        const formattedProblems = problems.map((problem) => ({
            ...problem,
            createdBy: problem.createdBy.toString(), 
        }));    
        console.log(formattedProblems)
        res.status(200).json({
            success: true,
            count: formattedProblems.length,
            problems: formattedProblems,
        });
    } catch (error) {
        console.error("Error fetching all problems:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};




export const getOfficialProblems = async (req, res) => {
    try {
        const officialId = req.params;

        const problems = await ProblemReport.find({ assignedTo: officialId })


        res.status(200).json({
            success: true,
            count: problems.length,
            problems,
        });
    } catch (error) {
        console.error("Error fetching official's problems:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getUserComplaints = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const complaints = await ProblemReport.find({ createdBy: userId })
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        const formattedComplaints = complaints.map((complaint) => ({
            ...complaint,
            createdBy: complaint.createdBy.toString(),
            _id: complaint._id.toString(),
            createdAt: complaint.createdAt,
        }));

        res.status(200).json({
            success: true,
            count: formattedComplaints.length,
            complaints: formattedComplaints,
        });
    } catch (error) {
        console.error("Error fetching user complaints:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
