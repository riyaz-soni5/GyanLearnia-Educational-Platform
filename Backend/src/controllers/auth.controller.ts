import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

export const register = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      expertise,
      institution,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      expertise: role === "instructor" ? expertise : undefined,
      institution: role === "instructor" ? institution : undefined,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};