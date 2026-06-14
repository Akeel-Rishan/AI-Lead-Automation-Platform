import type { Lead, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export type CreateLeadInput = {
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  service?: string | null;
  urgency?: string | null;
  budget?: string | null;
  notes?: string | null;
  assignedTo?: string | null;
};

export type LeadFilters = {
  status?: string;
  source?: string;
  qualification?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type LeadListResult = {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
};

export async function createLead(data: CreateLeadInput): Promise<Lead> {
  return prisma.lead.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      service: data.service,
      urgency: data.urgency,
      budget: data.budget,
      notes: data.notes,
      assignedTo: data.assignedTo
    }
  });
}

export async function getLeadsByTenant(
  tenantId: string,
  filters: LeadFilters = {}
): Promise<LeadListResult> {
  const page = Number.isFinite(filters.page) && Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit =
    Number.isFinite(filters.limit) && Number(filters.limit) > 0
      ? Math.min(Number(filters.limit), 100)
      : 20;
  const search = filters.search?.trim();

  const where: Prisma.LeadWhereInput = {
    tenantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.qualification ? { qualification: filters.qualification } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        qualificationResult: true,
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1
        },
        appointments: {
          orderBy: { scheduledAt: "asc" },
          take: 1
        }
      }
    }),
    prisma.lead.count({ where })
  ]);

  return { leads, total, page, limit };
}

export async function getLeadById(leadId: string, tenantId: string) {
  return prisma.lead.findFirst({
    where: {
      id: leadId,
      tenantId
    },
    include: {
      qualificationResult: true,
      messages: {
        orderBy: { sentAt: "asc" }
      },
      appointments: {
        orderBy: { scheduledAt: "asc" }
      },
      followUps: {
        orderBy: { scheduledAt: "asc" }
      }
    }
  });
}

export async function updateLead(
  leadId: string,
  tenantId: string,
  data: Partial<Lead>
): Promise<Lead> {
  const existingLead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    select: { id: true }
  });

  if (!existingLead) {
    throw new AppError("Lead not found", 404);
  }

  const allowedData: Prisma.LeadUpdateInput = {
    ...(typeof data.name === "string" ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(typeof data.source === "string" ? { source: data.source } : {}),
    ...(typeof data.status === "string" ? { status: data.status } : {}),
    ...(data.service !== undefined ? { service: data.service } : {}),
    ...(data.urgency !== undefined ? { urgency: data.urgency } : {}),
    ...(data.budget !== undefined ? { budget: data.budget } : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    ...(data.leadScore !== undefined ? { leadScore: data.leadScore } : {}),
    ...(data.qualification !== undefined ? { qualification: data.qualification } : {}),
    ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {})
  };

  return prisma.lead.update({
    where: { id: existingLead.id },
    data: allowedData
  });
}

export async function deleteLead(leadId: string, tenantId: string): Promise<void> {
  const existingLead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    select: { id: true }
  });

  if (!existingLead) {
    throw new AppError("Lead not found", 404);
  }

  await prisma.lead.delete({
    where: { id: existingLead.id }
  });
}
