import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser, JwtPayload } from "../types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid authorization header"
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user: AuthUser = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token"
    });
  }
};
