import { Router } from "express";
import {
  createLead,
  deleteLead,
  getLeadById,
  getLeadsByTenant,
  updateLead,
  type LeadFilters
} from "../services/leadService";
import { authMiddleware } from "../middleware/auth";
import { manualLeadSchema, updateLeadSchema } from "../validators/lead";

const router = Router();

router.use(authMiddleware);

function currentTenantId(req: { user?: { tenantId: string } }) {
  return req.user?.tenantId ?? "";
}

router.post("/", async (req, res, next) => {
  try {
    const parsed = manualLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid lead data"
      });
    }

    const lead = await createLead({
      ...parsed.data,
      tenantId: currentTenantId(req),
      assignedTo: req.user?.userId
    });

    return res.status(201).json({ success: true, lead });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filters: LeadFilters = {
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      source: typeof req.query.source === "string" ? req.query.source : undefined,
      qualification:
        typeof req.query.qualification === "string" ? req.query.qualification : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      page: typeof req.query.page === "string" ? Number(req.query.page) : undefined,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined
    };

    const result = await getLeadsByTenant(currentTenantId(req), filters);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const lead = await getLeadById(req.params.id, currentTenantId(req));

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: "Lead not found"
      });
    }

    return res.status(200).json({ success: true, lead });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const parsed = updateLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid lead data"
      });
    }

    const lead = await updateLead(req.params.id, currentTenantId(req), parsed.data);

    return res.status(200).json({ success: true, lead });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteLead(req.params.id, currentTenantId(req));

    return res.status(200).json({
      success: true,
      message: "Lead deleted"
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
