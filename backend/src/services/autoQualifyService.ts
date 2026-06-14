import { runQualificationWorkflow } from "../agents/qualificationAgent";

export function triggerAutoQualification(leadId: string, tenantId: string): void {
  void runQualificationWorkflow(leadId, tenantId).catch((error) => {
    console.error(
      `[AutoQualifyService] Failed to qualify lead ${leadId}:`,
      error instanceof Error ? error.message : error
    );
  });
}
