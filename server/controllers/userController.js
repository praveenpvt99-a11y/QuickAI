import { getAuth } from "@clerk/express";
import sql from "../configs/db.js";


// ========================================
// Get user's creations
// ========================================
export const getUserCreations = async (req, res) => {
    try {
        const { userId } = getAuth(req);

        const creations = await sql`
            SELECT *
            FROM creations
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

        return res.json({
            success: true,
            creations
        });

    } catch (error) {
        console.log("GET USER CREATIONS ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// Get all published creations
// ========================================
export const getPublishedCreations = async (req, res) => {
    try {
        const creations = await sql`
            SELECT *
            FROM creations
            WHERE publish = true
            ORDER BY created_at DESC
        `;

        return res.json({
            success: true,
            creations
        });

    } catch (error) {
        console.log("GET PUBLISHED CREATIONS ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// Like / Unlike creation
// ========================================
export const toggleLikeCreation = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.body;

        // Find creation
        const [creation] = await sql`
            SELECT *
            FROM creations
            WHERE id = ${id}
        `;

        if (!creation) {
            return res.json({
                success: false,
                message: "Creation not found"
            });
        }

        // Make sure likes is always an array
        const currentLikes = Array.isArray(creation.likes)
            ? creation.likes
            : [];

        const userIdStr = String(userId);

        let updatedLikes;
        let message;

        // Unlike
        if (currentLikes.includes(userIdStr)) {
            updatedLikes = currentLikes.filter(
                (user) => user !== userIdStr
            );

            message = "Creation Unliked";
        }

        // Like
        else {
            updatedLikes = [
                ...currentLikes,
                userIdStr
            ];

            message = "Creation Liked";
        }

        // Convert JS array to PostgreSQL text[] format
        const formattedArray = `{${updatedLikes.join(",")}}`;

        await sql`
            UPDATE creations
            SET likes = ${formattedArray}::text[]
            WHERE id = ${id}
        `;

        return res.json({
            success: true,
            message,
            likes: updatedLikes
        });

    } catch (error) {
        console.log("TOGGLE LIKE ERROR:", error);

        return res.json({
            success: false,
            message: error.message
        });
    }
};