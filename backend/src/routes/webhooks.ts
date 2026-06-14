import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { createLead } from "../services/leadService";
import { webhookLeadSchema } from "../validators/lead";

type WebhookRequest = Request & {
  webhookTenantId?: string;
  webhookLogId?: string;
};

type FacebookField = {
  name?: string;
  values?: string[];
};

const router = Router();

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function getApiKey(req: Request) {
  const queryKey = req.query.apiKey;
  const headerKey = req.header("x-api-key");

  if (typeof queryKey === "string" && queryKey.trim()) {
    return queryKey.trim();
  }

  if (headerKey?.trim()) {
    return headerKey.trim();
  }

  return null;
}

function sourceFromPath(req: Request) {
  const source = req.path.split("/").filter(Boolean)[0];
  return source || "generic";
}

async function updateWebhookLog(
  logId: string | undefined,
  status: string,
  error?: string | null
) {
  if (!logId) {
    return;
  }

  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status,
      error
    }
  });
}

async function verifyApiKey(req: WebhookRequest, res: Response, next: NextFunction) {
  const source = sourceFromPath(req);
  const log = await prisma.webhookLog.create({
    data: {
      source,
      payload: req.body ?? {},
      status: "received"
    }
  });
  req.webhookLogId = log.id;

  try {
    const apiKey = getApiKey(req);

    if (!apiKey) {
      await updateWebhookLog(log.id, "failed", "Missing API key");
      return res.status(401).json({
        success: false,
        error: "Invalid API key"
      });
    }

    const keyHash = hashApiKey(apiKey);
    const storedKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true
      },
      select: {
        id: true,
        tenantId: true
      }
    });

    if (!storedKey) {
      await updateWebhookLog(log.id, "failed", "Invalid API key");
      return res.status(401).json({
        success: false,
        error: "Invalid API key"
      });
    }

    await prisma.$transaction([
      prisma.apiKey.update({
        where: { id: storedKey.id },
        data: { lastUsed: new Date() }
      }),
      prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          tenantId: storedKey.tenantId,
          status: "verified"
        }
      })
    ]);

    req.webhookTenantId = storedKey.tenantId;
    return next();
  } catch (error) {
    await updateWebhookLog(log.id, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
}

function tenantId(req: WebhookRequest) {
  return req.webhookTenantId ?? "";
}

function firstValue(field?: FacebookField) {
  return field?.values?.[0]?.trim();
}

function facebookLeadFields(fieldData: FacebookField[]) {
  const byName = new Map(fieldData.map((field) => [field.name, firstValue(field)]));
  const firstName = byName.get("first_name");
  const lastName = byName.get("last_name");
  const fullName = byName.get("full_name") ?? [firstName, lastName].filter(Boolean).join(" ");

  return {
    name: fullName || "Unknown",
    email: byName.get("email"),
    phone: byName.get("phone_number")
  };
}

router.get("/facebook", (req, res) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    verifyToken === env.FACEBOOK_VERIFY_TOKEN &&
    typeof challenge === "string"
  ) {
    return res.status(200).type("text/plain").send(challenge);
  }

  return res.status(403).json({
    success: false,
    error: "Invalid verification token"
  });
});

router.post("/website", verifyApiKey, async (req: WebhookRequest, res, next) => {
  try {
    const parsed = webhookLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      await updateWebhookLog(req.webhookLogId, "failed", parsed.error.issues[0]?.message);
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid webhook payload"
      });
    }

    await createLead({
      tenantId: tenantId(req),
      name: parsed.data.name ?? "Unknown",
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: "website",
      service: parsed.data.service,
      notes: parsed.data.message ?? parsed.data.notes
    });

    await updateWebhookLog(req.webhookLogId, "processed");
    return res.status(200).json({
      success: true,
      message: "Lead received"
    });
  } catch (error) {
    await updateWebhookLog(req.webhookLogId, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
});

router.post("/facebook", verifyApiKey, async (req: WebhookRequest, res, next) => {
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    let createdCount = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const leads = Array.isArray(change?.value?.leads) ? change.value.leads : [change?.value].filter(Boolean);

        for (const lead of leads) {
          const fieldData = Array.isArray(lead?.field_data) ? lead.field_data : [];
          const fields = facebookLeadFields(fieldData);

          await createLead({
            tenantId: tenantId(req),
            name: fields.name,
            email: fields.email,
            phone: fields.phone,
            source: "facebook"
          });
          createdCount += 1;
        }
      }
    }

    await updateWebhookLog(req.webhookLogId, "processed");
    return res.status(200).json({
      success: true,
      created: createdCount
    });
  } catch (error) {
    await updateWebhookLog(req.webhookLogId, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
});

router.post("/google", verifyApiKey, async (req: WebhookRequest, res, next) => {
  try {
    const columns = Array.isArray(req.body?.user_column_data) ? req.body.user_column_data : [];
    const byColumn = new Map<string, string>();

    for (const column of columns) {
      if (typeof column?.column_name === "string" && typeof column?.string_value === "string") {
        byColumn.set(column.column_name, column.string_value);
      }
    }

    await createLead({
      tenantId: tenantId(req),
      name: byColumn.get("FULL_NAME") ?? "Unknown",
      email: byColumn.get("EMAIL"),
      phone: byColumn.get("PHONE_NUMBER"),
      source: "google",
      notes: byColumn.get("CITY")
    });

    await updateWebhookLog(req.webhookLogId, "processed");
    return res.status(200).json({ success: true });
  } catch (error) {
    await updateWebhookLog(req.webhookLogId, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
});

router.post("/sms", verifyApiKey, async (req: WebhookRequest, res, next) => {
  try {
    await createLead({
      tenantId: tenantId(req),
      name: "SMS Lead",
      phone: req.body?.From,
      source: "sms",
      notes: req.body?.Body
    });

    await updateWebhookLog(req.webhookLogId, "processed");
    return res.status(200).type("text/xml").send("<Response></Response>");
  } catch (error) {
    await updateWebhookLog(req.webhookLogId, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
});

router.post("/generic", verifyApiKey, async (req: WebhookRequest, res, next) => {
  try {
    const parsed = webhookLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      await updateWebhookLog(req.webhookLogId, "failed", parsed.error.issues[0]?.message);
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid webhook payload"
      });
    }

    await createLead({
      tenantId: tenantId(req),
      name: parsed.data.name ?? "Unknown",
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source ?? "website",
      service: parsed.data.service,
      notes: parsed.data.notes
    });

    await updateWebhookLog(req.webhookLogId, "processed");
    return res.status(200).json({ success: true });
  } catch (error) {
    await updateWebhookLog(req.webhookLogId, "failed", error instanceof Error ? error.message : "Webhook failed");
    return next(error);
  }
});

export default router;
