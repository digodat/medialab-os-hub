import { connection } from "next/server";

import { SecurityConnectionError } from "@/components/security/security-connection-error";
import { TaskList } from "@/components/security/task-list";
import type { NumberedSecurityFinding } from "@/lib/security/security-catalog";
import { getAllSecurityFindings } from "@/lib/security/security-persistence";
import type { SecurityFindingRecord } from "@/lib/security/security-status";

export const metadata = {
  title: "Seguridad — Medialab OS Hub",
};

export default async function SecurityPage() {
  await connection();

  let findings: NumberedSecurityFinding[];
  let initialRecords: Record<string, SecurityFindingRecord>;

  try {
    const findingsWithState = await getAllSecurityFindings();

    findings = findingsWithState.map((item) => item.finding);
    initialRecords = {};

    for (const item of findingsWithState) {
      if (item.record) {
        initialRecords[item.finding.id] = item.record;
      }
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido.";

    return (
      <div className="py-16">
        <SecurityConnectionError detail={detail} />
      </div>
    );
  }

  return (
    <div className="py-16">
      <TaskList findings={findings} initialRecords={initialRecords} />
    </div>
  );
}
