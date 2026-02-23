import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    try {
        const cookieToken = req.cookies?.access_token;
        const header = req.headers.authorization;
        const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
        const token = cookieToken || bearerToken;
        if (!token)
            return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}
// auth.middleware.ts
export function optionalAuth(req, _res, next) {
    try {
        const cookieToken = req.cookies?.access_token;
        const header = req.headers.authorization;
        const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
        const token = cookieToken || bearerToken;
        if (!token)
            return next(); // ✅ guest allowed
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    }
    catch {
        return next(); // ✅ invalid token → treat as guest
    }
}
