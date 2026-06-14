import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import {
  runQualificationWorkflow,
  type QualificationOutput
} from "../agents/qualificationAgent";
import { getLeadById } from "../services/leadService";

const router = Router();

router.use(authMiddleware);

function parseRawQualification(rawResponse?: string | null) {
  if (!rawResponse) {
    return {};
  }

  try {
    return JSON.parse(rawResponse) as Partial<QualificationOutput>;
  } catch {
    return {};
  }
}

function normalizeLegacyReasoning<T extends Partial<QualificationOutput>>(qualification: T) {
  if (qualification.reasoning === "OpenAI API key is not configured") {
    return {
      ...qualification,
      reasoning:
        "This lead was qualified before Google Gemini was enabled. Re-run AI Qualification to score it with your Google API key."
    };
  }

  return qualification;
}

function enrichQualification<T extends { rawResponse?: string | null }>(qualification: T) {
  return normalizeLegacyReasoning({
    ...qualification,
    ...parseRawQualification(qualification.rawResponse)
  });
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

router.post("/qualify/:leadId", async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId ?? "";
    const lead = await getLeadById(req.params.leadId, tenantId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: "Lead not found"
      });
    }

    const qualification = await runQualificationWorkflow(req.params.leadId, tenantId);

    return res.status(200).json({
      success: true,
      qualification
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/qualify-batch", async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId ?? "";
    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        qualificationResult: null
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true
      }
    });
    const results: Array<{ leadId: string; score: number; qualification: string }> = [];

    for (const lead of leads) {
      const result = await runQualificationWorkflow(lead.id, tenantId);
      results.push({
        leadId: lead.id,
        score: result.leadScore,
        qualification: result.qualification
      });
      await delay(500);
    }

    return res.status(200).json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/qualification/:leadId", async (req, res, next) => {
  try {
    const qualification = await prisma.leadQualification.findFirst({
      where: {
        leadId: req.params.leadId,
        lead: {
          tenantId: req.user?.tenantId
        }
      }
    });

    if (!qualification) {
      return res.status(404).json({
        success: false,
        error: "Qualification not found"
      });
    }

    return res.status(200).json({
      success: true,
      qualification: enrichQualification(qualification)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
