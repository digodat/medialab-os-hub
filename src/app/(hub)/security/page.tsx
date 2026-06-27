import { connection } from "next/server";

import { SecurityConnectionError } from "@/components/security/security-connection-error";
import { TaskList } from "@/components/security/task-list";
import { getAllSecurityRecords } from "@/lib/security/security-persistence";
import type { SecurityFindingRecord } from "@/lib/security/security-status";

export const metadata = {
  title: "Seguridad — Medialab OS Hub",
};

export default async function SecurityPage() {
  await connection();

  let initialRecords: Record<string, SecurityFindingRecord>;

  try {
    initialRecords = await getAllSecurityRecords();
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
      <TaskList initialRecords={initialRecords} />
    </div>
  );
}
