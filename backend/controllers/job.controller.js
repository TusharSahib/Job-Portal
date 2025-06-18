// import { Job } from "../models/job.model.js";

// // admin post job
// export const postJob = async (req, res) => {
//     try {
//         const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
//         const userId = req.id;

//         if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
//             return res.status(400).json({
//                 message: "Somethin is missing.",
//                 success: false
//             })
//         };
//         const job = await Job.create({
//             title,
//             description,
//             requirements: requirements.split(","),
//             salary: Number(salary),
//             location,
//             jobType,
//             experienceLevel: experience,
//             position,
//             company: companyId,
//             created_by: userId
//         });
//         return res.status(201).json({
//             message: "New job created successfully.",
//             job,
//             success: true
//         });
//     } catch (error) {
//         console.log(error);
//     }
// }
// // student k liye
// export const getAllJobs = async (req, res) => {
//     try {
//         const keyword = req.query.keyword || "";
//         const query = {
//             $or: [
//                 { title: { $regex: keyword, $options: "i" } },
//                 { description: { $regex: keyword, $options: "i" } },
//             ]
//         };
//         const jobs = await Job.find(query).populate({
//             path: "company"
//         }).sort({ createdAt: -1 });
//         if (!jobs) {
//             return res.status(404).json({
//                 message: "Jobs not found.",
//                 success: false
//             })
//         };
//         return res.status(200).json({
//             jobs,
//             success: true
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }
// // student
// export const getJobById = async (req, res) => {
//     try {
//         const jobId = req.params.id;
//         const job = await Job.findById(jobId).populate({
//             path:"applications"
//         });
//         if (!job) {
//             return res.status(404).json({
//                 message: "Jobs not found.",
//                 success: false
//             })
//         };
//         return res.status(200).json({ job, success: true });
//     } catch (error) {
//         console.log(error);
//     }
// }
// // admin job create 
// export const getAdminJobs = async (req, res) => {
//     try {
//         const adminId = req.id;
//         const jobs = await Job.find({ created_by: adminId }).populate({
//             path:'company',
//             createdAt:-1
//         });
//         if (!jobs) {
//             return res.status(404).json({
//                 message: "Jobs not found.",
//                 success: false
//             })
//         };
//         return res.status(200).json({
//             jobs,
//             success: true
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }


import { Job } from "../models/job.model.js";
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            });
        }

        // MongoDB query to insert new job
        const result = await Job.db.collection('jobs').insertOne({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experience,
            position,
            company: new ObjectId(companyId),
            created_by: new ObjectId(userId),
            createdAt: new Date()
        });

        // Fetch the inserted job to return in response
        const job = await Job.db.collection('jobs').findOne({ _id: result.insertedId });

        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ]
        };

        // MongoDB jobs and join with company
        const jobs = await Job.db.collection('jobs').aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "companies",
                    localField: "company",
                    foreignField: "_id",
                    as: "company"
                }
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        if (!jobs || jobs.length === 0) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            });
        }

        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        // MongoDB aggregation to find job by ID and join with applications collection
        const jobs = await Job.db.collection('jobs').aggregate([
            { $match: { _id: new ObjectId(jobId) } },
            {
                $lookup: {
                    from: "applications",
                    localField: "_id",
                    foreignField: "job",
                    as: "applications"
                }
            }
        ]).toArray();

        const job = jobs[0];

        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            });
        }

        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
    }
};

export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;

        // MongoDB jobs by created_by and join with company
        const jobs = await Job.db.collection('jobs').aggregate([
            { $match: { created_by: new ObjectId(adminId) } },
            {
                $lookup: {
                    from: "companies",
                    localField: "company",
                    foreignField: "_id",
                    as: "company"
                }
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        if (!jobs || jobs.length === 0) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            });
        }

        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};