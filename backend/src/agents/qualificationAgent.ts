import { z } from "zod";
import { generateGeminiJson } from "../lib/googleAI";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { getLeadById } from "../services/leadService";

export type QualificationInput = {
  leadId: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  service?: string | null;
  notes?: string | null;
  existingMessages?: string[];
};

export type QualificationOutput = {
  service: string | null;
  urgency: "low" | "medium" | "high" | null;
  budget: string | null;
  intent: string | null;
  leadScore: number;
  qualification: "cold" | "warm" | "hot";
  reasoning: string;
  suggestedResponse: string;
};

const qualificationOutputSchema = z.object({
  service: z.string().nullable(),
  urgency: z.enum(["low", "medium", "high"]).nullable(),
  budget: z.string().nullable(),
  intent: z.string().nullable(),
  leadScore: z.coerce.number().min(0).max(100),
  qualification: z.enum(["cold", "warm", "hot"]),
  reasoning: z.string().min(1),
  suggestedResponse: z.string().min(1)
});

const systemPrompt = `You are an expert sales qualification AI assistant for a CRM platform.
Your job is to analyze incoming lead information and produce a structured qualification report.

Scoring criteria:
- Budget mentioned (high value): +25 points
- Urgency is high: +25 points
- Specific service requested: +20 points
- Contact info complete (email + phone): +15 points
- Clear intent/need expressed: +15 points
- Base score: 0

Qualification tiers:
- Hot Lead: score 75-100 (ready to buy, high urgency, budget confirmed)
- Warm Lead: score 45-74 (interested, needs nurturing)
- Cold Lead: score 0-44 (early stage, low signals)

You MUST respond with ONLY valid JSON. No markdown. No explanation outside JSON.`;

function buildUserPrompt(input: QualificationInput) {
  const previousMessages = input.existingMessages?.length
    ? input.existingMessages.join("\n")
    : "None";

  return `Analyze this lead and return a qualification JSON object.

Lead Information:
- Name: ${input.name}
- Email: ${input.email || "Not provided"}
- Phone: ${input.phone || "Not provided"}
- Source: ${input.source}
- Service Interested In: ${input.service || "Not specified"}
- Notes/Message: ${input.notes || "None"}
- Previous Messages: ${previousMessages}

Return this exact JSON structure:
{
  "service": "detected service or null",
  "urgency": "low|medium|high or null",
  "budget": "budget string or null",
  "intent": "one sentence describing the lead's intent",
  "leadScore": 0-100,
  "qualification": "cold|warm|hot",
  "reasoning": "2-3 sentences explaining the score",
  "suggestedResponse": "A personalized first response message to send this lead (2-3 sentences, friendly and professional)"
}`;
}

function fallbackQualification(reasoning: string): QualificationOutput {
  return {
    service: null,
    urgency: null,
    budget: null,
    intent: null,
    leadScore: 0,
    qualification: "cold",
    reasoning,
    suggestedResponse:
      "Hi, thanks for reaching out. I would be happy to learn more about what you need and help point you in the right direction."
  };
}

function normalizeQualification(score: number): "cold" | "warm" | "hot" {
  if (score >= 75) {
    return "hot";
  }

  if (score >= 45) {
    return "warm";
  }

  return "cold";
}

function extractJson(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

export async function qualifyLead(input: QualificationInput): Promise<QualificationOutput> {
  try {
    const content = await generateGeminiJson({
      systemPrompt,
      userPrompt: buildUserPrompt(input),
      temperature: 0.3,
      maxOutputTokens: 500
    });

    const parsedJson = JSON.parse(extractJson(content));
    const parsed = qualificationOutputSchema.safeParse(parsedJson);

    if (!parsed.success) {
      return fallbackQualification("Unable to validate AI response");
    }

    const leadScore = Math.max(0, Math.min(100, Math.round(parsed.data.leadScore)));

    return {
      ...parsed.data,
      leadScore,
      qualification: normalizeQualification(leadScore)
    };
  } catch (error) {
    return fallbackQualification(
      error instanceof Error ? error.message : "Unable to parse Google Gemini response"
    );
  }
}

export async function saveQualificationResult(
  leadId: string,
  tenantId: string,
  result: QualificationOutput
): Promise<void> {
  const existingLead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    select: {
      id: true,
      service: true
    }
  });

  if (!existingLead) {
    throw new AppError("Lead not found", 404);
  }

  await prisma.$transaction([
    prisma.leadQualification.upsert({
      where: { leadId },
      create: {
        leadId,
        service: result.service,
        urgency: result.urgency,
        budget: result.budget,
        intent: result.intent,
        leadScore: result.leadScore,
        qualification: result.qualification,
        rawResponse: JSON.stringify(result)
      },
      update: {
        service: result.service,
        urgency: result.urgency,
        budget: result.budget,
        intent: result.intent,
        leadScore: result.leadScore,
        qualification: result.qualification,
        rawResponse: JSON.stringify(result)
      }
    }),
    prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        leadScore: result.leadScore,
        qualification: result.qualification,
        urgency: result.urgency,
        service: result.service || existingLead.service,
        ...(result.qualification === "hot" ? { status: "qualified" } : {})
      }
    })
  ]);
}

export async function runQualificationWorkflow(
  leadId: string,
  tenantId: string
): Promise<QualificationOutput> {
  const lead = await getLeadById(leadId, tenantId);

  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  const recentMessages = await prisma.message.findMany({
    where: {
      leadId,
      tenantId
    },
    orderBy: { sentAt: "desc" },
    take: 5,
    select: {
      direction: true,
      channel: true,
      content: true
    }
  });

  const result = await qualifyLead({
    leadId,
    tenantId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    service: lead.service,
    notes: lead.notes,
    existingMessages: recentMessages
      .reverse()
      .map((message) => `${message.direction} ${message.channel}: ${message.content}`)
  });

  await saveQualificationResult(leadId, tenantId, result);
  console.log(
    `[QualificationAgent] Lead ${leadId} scored ${result.leadScore} - ${result.qualification}`
  );

  return result;
}
