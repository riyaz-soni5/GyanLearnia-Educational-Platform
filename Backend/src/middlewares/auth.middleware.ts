import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { id: string; role: "student" | "instructor" | "admin" };

export type AuthedRequest = Request & { user?: JwtPayload };

function getToken(req: Request) {
  const cookieToken = (req as any).cookies?.access_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  return cookieToken || bearerToken;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
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

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;

    return next();
  } catch {
    return next();
  }
}
