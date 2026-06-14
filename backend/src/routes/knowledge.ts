import fs from "fs";
import path from "path";
import multer from "multer";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { answerQuestion } from "../agents/knowledgeAgent";
import { prisma } from "../lib/prisma";
import { extractText } from "../lib/textExtractor";
import { authMiddleware } from "../middleware/auth";
import { deleteDocument, processDocument } from "../services/knowledgeService";

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown"
]);

const knowledgeTypeSchema = z.enum(["pdf", "txt", "docx", "faq", "pricing", "policy", "product", "general"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    callback(null, `${uuid()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Only PDF, DOCX, TXT, and MD files are allowed"));
  }
});

const textKnowledgeSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  type: knowledgeTypeSchema.default("general"),
  content: z.string().trim().min(50, "Content must be at least 50 characters")
});

const askSchema = z.object({
  question: z.string().trim().min(3, "Question must be at least 3 characters"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "inbound", "outbound"]),
        content: z.string().trim().min(1)
      })
    )
    .optional()
});

function tenantId(req: { user?: { tenantId: string } }) {
  return req.user?.tenantId ?? "";
}

function triggerProcessing(docId: string, currentTenantId: string) {
  void processDocument(docId, currentTenantId).catch((error) => {
    console.error(
      `[KnowledgeRoute] Failed to process doc ${docId}:`,
      error instanceof Error ? error.message : error
    );
  });
}

router.use(authMiddleware);

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File is required"
      });
    }

    const parsedType = knowledgeTypeSchema.safeParse(req.body.type ?? "general");

    if (!parsedType.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid document type"
      });
    }

    const name =
      typeof req.body.name === "string" && req.body.name.trim()
        ? req.body.name.trim()
        : path.basename(req.file.originalname, path.extname(req.file.originalname));
    const content = await extractText(req.file.path, req.file.mimetype);
    const doc = await prisma.knowledgeDoc.create({
      data: {
        tenantId: tenantId(req),
        name,
        type: parsedType.data,
        content,
        fileUrl: req.file.path,
        isActive: false
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true
      }
    });

    triggerProcessing(doc.id, tenantId(req));

    return res.status(201).json({
      success: true,
      doc,
      message: "Document uploaded and processing started"
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/text", async (req, res, next) => {
  try {
    const parsed = textKnowledgeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid knowledge data"
      });
    }

    const doc = await prisma.knowledgeDoc.create({
      data: {
        tenantId: tenantId(req),
        name: parsed.data.name,
        type: parsed.data.type,
        content: parsed.data.content,
        isActive: false
      }
    });

    triggerProcessing(doc.id, tenantId(req));

    return res.status(201).json({
      success: true,
      doc
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const docs = await prisma.knowledgeDoc.findMany({
      where: { tenantId: tenantId(req) },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      docs
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/ask", async (req, res, next) => {
  try {
    const parsed = askSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid question"
      });
    }

    const conversationHistory = parsed.data.conversationHistory?.map((message) => ({
      id: "",
      leadId: "",
      tenantId: tenantId(req),
      direction: message.role === "assistant" || message.role === "outbound" ? "outbound" : "inbound",
      channel: "chat",
      content: message.content,
      status: "sent",
      sentAt: new Date(),
      metadata: null
    }));
    const answer = await answerQuestion(tenantId(req), parsed.data.question, conversationHistory);

    return res.status(200).json({
      success: true,
      ...answer
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doc = await prisma.knowledgeDoc.findFirst({
      where: {
        id: req.params.id,
        tenantId: tenantId(req)
      },
      include: {
        _count: {
          select: { chunks: true }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: "Document not found"
      });
    }

    return res.status(200).json({
      success: true,
      doc
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteDocument(req.params.id, tenantId(req));

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
