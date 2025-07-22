
import admin from '../firebase/firebase.js';

// Firebase Auth Middleware
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No token provided");
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            // uid: decodedToken.uid,
            email: decodedToken.email,
            username: decodedToken.name || "",
            avatar_url: decodedToken.picture || "",
            provider: decodedToken.firebase?.sign_in_provider || "unknown",
            role: "user",
        };
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
};
