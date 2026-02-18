import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { id: string; role: "student" | "instructor" | "admin" };

export type AuthedRequest = Request & { user?: JwtPayload };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const cookieToken = (req as any).cookies?.access_token;

    const header = req.headers.authorization;
    const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

    const token = cookieToken || bearerToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// auth.middleware.ts
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const cookieToken = (req as any).cookies?.access_token;

    const header = req.headers.authorization;
    const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

    const token = cookieToken || bearerToken;
    if (!token) return next(); // ✅ guest allowed

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;

    return next();
  } catch {
    return next(); // ✅ invalid token → treat as guest
  }
}