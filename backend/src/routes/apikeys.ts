import crypto from "crypto";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey() {
  return `lf_${uuid().replace(/-/g, "")}${uuid().replace(/-/g, "")}`;
}

router.post("/", async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "API key name is required"
      });
    }

    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: req.user?.tenantId ?? "",
        name,
        keyHash: hashApiKey(key)
      },
      select: {
        id: true,
        name: true
      }
    });

    return res.status(201).json({
      success: true,
      key,
      name: apiKey.name,
      id: apiKey.id
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId: req.user?.tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      success: true,
      apiKeys
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user?.tenantId
      },
      select: { id: true }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: "API key not found"
      });
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { isActive: false }
    });

    return res.status(200).json({
      success: true,
      message: "API key deactivated"
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
