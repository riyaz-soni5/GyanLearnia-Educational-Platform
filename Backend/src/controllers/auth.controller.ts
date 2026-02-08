// controllers/auth.controller.ts (updated)
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: rememberMe ? "7d" : "2h" }
    );

    // ✅ httpOnly cookie (session cookie if rememberMe is false)
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true in production https
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}), // no maxAge => session cookie
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch {
    return res.status(500).json({ message: "Login failed" });
  }
};


export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, expertise, institution } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role,
      expertise: role === "instructor" ? String(expertise || "").trim() || undefined : undefined,
      institution: role === "instructor" ? String(institution || "").trim() || undefined : undefined,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};