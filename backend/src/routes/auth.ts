import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { loginSchema, registerSchema } from "../validators/auth";

const router = Router();

const tokenOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
};

function signAuthToken(payload: { userId: string; tenantId: string; role: string }) {
  return jwt.sign(payload, env.JWT_SECRET, tokenOptions);
}

function authUserResponse(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId
  };
}

function tenantResponse(tenant: {
  id: string;
  name: string;
  plan: string;
  isActive?: boolean;
}) {
  return {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    ...(typeof tenant.isActive === "boolean" ? { isActive: tenant.isActive } : {})
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid registration data"
      });
    }

    const { tenantName, email, password, name, industry } = parsed.data;
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: tenantName,
          email,
          industry,
          plan: "starter"
        }
      });

      const createdUser = await tx.user.create({
        data: {
          tenantId: createdTenant.id,
          email,
          passwordHash,
          name,
          role: "owner"
        }
      });

      return {
        tenant: createdTenant,
        user: createdUser
      };
    });

    const token = signAuthToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      token,
      user: authUserResponse(user),
      tenant: tenantResponse(tenant)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid login data"
      });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    const token = signAuthToken({
      userId: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role
    });

    return res.status(200).json({
      success: true,
      token,
      user: authUserResponse(updatedUser),
      tenant: tenantResponse(user.tenant)
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { tenant: true }
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    return res.status(200).json({
      success: true,
      user: authUserResponse(user),
      tenant: tenantResponse(user.tenant)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", authMiddleware, (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

export default router;
