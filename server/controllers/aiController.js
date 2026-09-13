import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient, getAuth } from "@clerk/express";
import axios from "axios";
import FormData from "form-data";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// =========================
// Generate Article
// =========================
export const generateArticle = async (req, res) => {
    try {
        const { userId } = getAuth(req);

        const { prompt, length } = req.body;

        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== "premium" && free_usage >= 10) {
            return res.json({
                success: false,
                message: "Limit reached. Upgrade to continue."
            });
        }

        const response = await AI.chat.completions.create({
            model: "gemini-3.6-flash",

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0.7,
            max_tokens: Number(length)
        });

        const content = response.choices[0].message.content;

        console.log("Generated article:");

        await sql`
            INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'article')
        `;

        if (plan !== "premium") {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }

        return res.json({
            success: true,
            content
        });

    } catch (error) {
        console.log("AI ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// =========================
// Generate Blog Title
// =========================
export const generateBlogTitle = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { prompt } = req.body;

        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== "premium" && free_usage >= 10) {
            return res.json({
                success: false,
                message: "Limit reached. Upgrade to continue."
            });
        }

        console.log("RECEIVED PROMPT:", prompt);

        const response = await AI.chat.completions.create({
            model: "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        console.log("FULL RESPONSE:", response);

        const content = response.choices?.[0]?.message?.content;

        console.log("GENERATED CONTENT:", content);

        if (!content) {
            return res.json({
                success: false,
                message: "AI returned empty content"
            });
        }

        await sql`
            INSERT INTO creations(user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
        `;

        if (plan !== "premium") {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            });
        }

        return res.json({
            success: true,
            content: content
        });

    } catch (error) {
        console.log("AI ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// =========================
// Generate Image
// =========================
export const generateImage = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { prompt, publish } = req.body;

        const plan = req.plan;

        // Only premium users can generate images
        if (plan !== "premium") {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscriptions."
            });
        }

        // Create form data for ClipDrop
        const formData = new FormData();

        formData.append("prompt", prompt);

        // Generate image using ClipDrop
        const { data } = await axios.post(
            "https://clipdrop-api.co/text-to-image/v1",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "x-api-key": process.env.CLIPDROP_API_KEY
                },
                responseType: "arraybuffer"
            }
        );

        // Convert image to base64
        const base64Image =
            `data:image/png;base64,${Buffer.from(data).toString("base64")}`;

        // Upload image to Cloudinary
        const { secure_url } = await cloudinary.uploader.upload(
            base64Image
        );

        // Save image details in database
        await sql`
            INSERT INTO creations(
                user_id,
                prompt,
                content,
                type,
                publish
            )
            VALUES (
                ${userId},
                ${prompt},
                ${secure_url},
                'image',
                ${publish ?? false}
            )
        `;

        // Send image URL back to frontend
        return res.json({
            success: true,
            content: secure_url
        });

    } catch (error) {
        console.log("IMAGE ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// =========================
// Remove Image Background
// =========================
export const removeImageBackground = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const image = req.file;

        const plan = req.plan;

        // Check premium plan
        if (plan !== "premium") {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscriptions."
            });
        }

        // Check whether file was uploaded
        if (!image) {
            return res.json({
                success: false,
                message: "Please upload an image."
            });
        }

        console.log("Uploaded image:", image.path);

        // Upload to Cloudinary with background removal
        const { secure_url } = await cloudinary.uploader.upload(
            image.path,
            {
                transformation: [
                    {
                        effect: "background_removal",
                        background_removal: "remove_the_background"
                    }
                ]
            }
        );

        console.log("Processed image:", secure_url);

        // Save to database
        await sql`
            INSERT INTO creations(
                user_id,
                prompt,
                content,
                type
            )
            VALUES (
                ${userId},
                'Remove background from image',
                ${secure_url},
                'image'
            )
        `;

        // Send URL to frontend
        return res.json({
            success: true,
            content: secure_url
        });

    } catch (error) {
        console.log("IMAGE ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// =========================
// Remove Image Object
// =========================
export const removeImageObject = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const image = req.file;
        const { object } = req.body;

        const plan = req.plan;

        // Check premium plan
        if (plan !== "premium") {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscriptions."
            });
        }

        // Check image
        if (!image) {
            return res.json({
                success: false,
                message: "Please upload an image."
            });
        }

        // Check object
        if (!object || !object.trim()) {
            return res.json({
                success: false,
                message: "Please enter an object name."
            });
        }

        const objectName = object.trim();

        // Upload image to Cloudinary
        const { public_id } = await cloudinary.uploader.upload(
            image.path
        );

        // Remove requested object
        const imageUrl = cloudinary.url(public_id, {
            transformation: [
                {
                    effect: `gen_remove:${objectName}`
                }
            ],
            resource_type: "image"
        });

        console.log("OBJECT REMOVAL URL:", imageUrl);

        // Save to database
        await sql`
            INSERT INTO creations(
                user_id,
                prompt,
                content,
                type
            )
            VALUES (
                ${userId},
                ${`Removed ${objectName} from image`},
                ${imageUrl},
                'image'
            )
        `;

        // Send result to frontend
        return res.json({
            success: true,
            content: imageUrl
        });

    } catch (error) {
        console.log("OBJECT REMOVAL ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// =========================
// Resume Review
// =========================
export const resumeReview = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const resume = req.file;

        const plan = req.plan;

        // Check premium plan
        if (plan !== "premium") {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscriptions."
            });
        }

        // Check whether file exists
        if (!resume) {
            return res.json({
                success: false,
                message: "Please upload a PDF resume."
            });
        }

        // Check file size
        if (resume.size > 5 * 1024 * 1024) {
            return res.json({
                success: false,
                message: "Resume file size exceeded (5MB)"
            });
        }

        // Read uploaded PDF
        const dataBuffer = fs.readFileSync(resume.path);

        // Parse PDF
        const pdfData = await pdf(dataBuffer);

        // Create AI prompt
        const prompt = `
Review the following resume and provide constructive feedback.

Analyze:
1. Overall resume quality
2. Strengths
3. Weaknesses
4. Technical skills
5. Projects
6. Experience
7. Education
8. ATS compatibility
9. Areas for improvement
10. Specific suggestions to make the resume stronger

Resume Content:

${pdfData.text}
`;

        // Ask Gemini for review
        const response = await AI.chat.completions.create({
            model: "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        const content = response.choices?.[0]?.message?.content;

        console.log("RESUME REVIEW:", content);

        // Check AI response
        if (!content) {
            return res.json({
                success: false,
                message: "AI returned an empty response."
            });
        }

        // Save result
        await sql`
            INSERT INTO creations(
                user_id,
                prompt,
                content,
                type
            )
            VALUES (
                ${userId},
                'Review the uploaded resume',
                ${content},
                'resume-review'
            )
        `;

        // Return result
        return res.json({
            success: true,
            content
        });

    } catch (error) {
        console.log("RESUME ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};