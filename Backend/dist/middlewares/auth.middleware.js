import jwt from "jsonwebtoken";
function getToken(req) {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    return cookieToken || bearerToken;
}
export function requireAuth(req, res, next) {
    try {
        const token = getToken(req);
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
export function optionalAuth(req, _res, next) {
    try {
        const token = getToken(req);
        if (!token)
            return next();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    }
    catch {
        return next();
    }
}
