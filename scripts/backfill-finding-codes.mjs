// One-time migration: backfills the human-facing identifier (`code`) on every
// security finding. The code is the category letter + the zero-padded
// sequential number derived from `order` (e.g. "P01"). Idempotent: re-running
// just rewrites the same values. Run with ADC:
//   SECURITY_FIRESTORE_DATABASE_ID=medialab-os-hub node scripts/backfill-finding-codes.mjs

import { Firestore } from "@google-cloud/firestore";

const COLLECTION = "security-findings";

// Must stay in sync with SECURITY_CATEGORIES in src/lib/security/security-catalog.ts.
const CATEGORY_LETTERS = {
  iam: "I",
  secrets: "S",
  deps: "D",
  platform: "P",
  data: "V",
  ops: "O",
};

const databaseId = process.env.SECURITY_FIRESTORE_DATABASE_ID?.trim();
if (!databaseId) {
  console.error("Falta SECURITY_FIRESTORE_DATABASE_ID");
  process.exit(1);
}

const db = new Firestore(databaseId === "(default)" ? {} : { databaseId });

function formatCode(category, number) {
  const letter = CATEGORY_LETTERS[category] ?? "";
  return `${letter}${String(number).padStart(2, "0")}`;
}

async function main() {
  const snapshot = await db.collection(COLLECTION).get();

  const rows = snapshot.docs
    .map((doc) => ({
      ref: doc.ref,
      category: doc.data().category,
      title: typeof doc.data().title === "string" ? doc.data().title : "",
      order:
        typeof doc.data().order === "number"
          ? doc.data().order
          : Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const code = formatCode(row.category, i + 1);
    await row.ref.set({ code }, { merge: true });
    updated += 1;
  }

  console.log(`Backfill completo. actualizados=${updated} db=${databaseId}`);
}

main().catch((error) => {
  console.error("Backfill falló:", error);
  process.exit(1);
});
