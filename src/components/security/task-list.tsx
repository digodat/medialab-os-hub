"use client";

import {
  Fragment,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowRightIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import {
  appendSecurityChangeAction,
  upsertSecurityFindingAction,
} from "@/app/(hub)/security/actions";
import { ChangeModal } from "@/components/security/change-modal";
import {
  FindingModal,
  type FindingFormValues,
} from "@/components/security/finding-modal";
import { STATUS_OPTIONS, StatusSelect } from "@/components/security/status-select";
import {
  SECURITY_CATEGORIES,
  type NumberedSecurityFinding,
} from "@/lib/security/security-catalog";
import {
  type SecurityFindingRecord,
  type Severity,
  type TaskStatus,
  annotateSecurityHistory,
  formatDisplayDate,
  getDefaultStatusForSeverity,
  getLatestHistoryEntry,
} from "@/lib/security/security-status";

const SEVERITY_STYLES: Record<Severity, string> = {
  CRÍTICO: "bg-red-500/10 text-red-600",
  ALTO: "bg-orange-500/10 text-orange-600",
  MEDIO: "bg-amber-500/10 text-amber-700",
  BAJO: "bg-foreground/5 text-foreground/45",
  OK: "bg-emerald-500/10 text-emerald-600",
};

const SEVERITY_ORDER: Severity[] = ["CRÍTICO", "ALTO", "MEDIO", "BAJO", "OK"];

const STATUS_ORDER: TaskStatus[] = STATUS_OPTIONS.map((option) => option.value);

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; dot: string }> =
  Object.fromEntries(
    STATUS_OPTIONS.map((option) => [
      option.value,
      { bg: option.bg, text: option.text, dot: option.dot },
    ]),
  ) as Record<TaskStatus, { bg: string; text: string; dot: string }>;

type PendingChange = {
  findingId: string;
  findingTitle: string;
  status: TaskStatus;
  previousStatus: TaskStatus;
  mode: "status" | "note";
};

type TaskListProps = {
  findings: NumberedSecurityFinding[];
  initialRecords: Record<string, SecurityFindingRecord>;
};

type FindingModalState = {
  mode: "create" | "edit";
  id?: string;
  values: FindingFormValues;
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightRegex(query: string): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const pattern = [...normalize(trimmed)]
    .map((char) => `${escapeRegex(char)}\\p{M}*`)
    .join("");

  return new RegExp(`(${pattern})`, "giu");
}

function matchesField(text: string, query: string) {
  return normalize(text).includes(normalize(query));
}

// Build the searchable strings for a record's full change history: status,
// author, both raw and display date formats, and reason.
function getHistorySearchFields(record?: SecurityFindingRecord | null) {
  if (!record?.history.length) {
    return [];
  }

  return record.history.flatMap((entry) => [
    entry.status,
    entry.author,
    entry.date,
    formatDisplayDate(entry.date),
    entry.reason,
  ]);
}

function matchesHistory(
  record: SecurityFindingRecord | undefined,
  query: string,
) {
  return getHistorySearchFields(record).some((field) =>
    matchesField(field, query),
  );
}

function matchesFinding(
  finding: NumberedSecurityFinding,
  record: SecurityFindingRecord | undefined,
  query: string,
) {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return (
    matchesField(finding.title, trimmed) ||
    matchesField(finding.detail, trimmed) ||
    matchesHistory(record, trimmed)
  );
}

function HighlightText({
  text,
  regex,
}: {
  text: string;
  regex: RegExp | null;
}) {
  if (!regex) return <>{text}</>;

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded-sm bg-brand-subtle text-foreground font-semibold"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function StatusPill({
  status,
  regex,
  muted = false,
}: {
  status: TaskStatus;
  regex: RegExp | null;
  muted?: boolean;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ${style.bg} ${style.text} ${
        muted ? "opacity-60" : ""
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      <HighlightText text={status} regex={regex} />
    </span>
  );
}

// Split text into tokens preserving whitespace; each word becomes an animated
// span with a sequential --word-index for the dissolve stagger.
function renderDissolveTokens(text: string) {
  const tokens = text.split(/(\s+)/);
  let wordIndex = 0;

  return tokens.map((token, i) => {
    if (token === "" || /^\s+$/.test(token)) {
      return <Fragment key={i}>{token}</Fragment>;
    }

    const index = wordIndex++;

    return (
      <span
        key={i}
        className="t-input-dissolve__word"
        style={{ "--word-index": index } as CSSProperties}
      >
        {token}
      </span>
    );
  });
}

function getRecordStatus(
  finding: NumberedSecurityFinding,
  records: Record<string, SecurityFindingRecord>,
): TaskStatus {
  return (
    records[finding.id]?.currentStatus ??
    getDefaultStatusForSeverity(finding.severity)
  );
}

export function TaskList({ findings, initialRecords }: TaskListProps) {
  const router = useRouter();
  const [records, setRecords] =
    useState<Record<string, SecurityFindingRecord>>(initialRecords);
  const [findingModal, setFindingModal] = useState<FindingModalState | null>(
    null,
  );
  const [findingError, setFindingError] = useState<string | null>(null);
  const [findingSuccess, setFindingSuccess] = useState(false);
  const [isFindingPending, startFindingTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(SECURITY_CATEGORIES.map((category) => category.key)),
  );
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const clearTimerRef = useRef<number | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  // Clear the search with a per-word dissolve: keep the value while the mirror
  // animates the words out, then reset once the animation finishes.
  const handleClearSearch = () => {
    if (isClearing) {
      return;
    }

    const text = query;

    if (!text.trim()) {
      setQuery("");
      return;
    }

    setIsClearing(true);

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const totalMs = 400 + Math.max(0, wordCount - 1) * 55 + 80;

    clearTimerRef.current = window.setTimeout(() => {
      setQuery("");
      setIsClearing(false);
      clearTimerRef.current = null;
    }, totalMs);
  };

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const isFiltering =
    isSearching || severityFilter !== null || statusFilter !== null;

  const highlightRegex = useMemo(
    () => buildHighlightRegex(trimmedQuery),
    [trimmedQuery],
  );

  const filteredFindings = useMemo(
    () =>
      findings.filter(
        (finding) =>
          (severityFilter === null || finding.severity === severityFilter) &&
          (statusFilter === null ||
            getRecordStatus(finding, records) === statusFilter) &&
          (!isSearching ||
            matchesFinding(finding, records[finding.id], trimmedQuery)),
      ),
    [findings, isSearching, trimmedQuery, severityFilter, statusFilter, records],
  );

  const grouped = useMemo(
    () =>
      SECURITY_CATEGORIES.map((category) => ({
        ...category,
        items: filteredFindings.filter(
          (finding) => finding.category === category.key,
        ),
      })).filter((category) => category.items.length > 0),
    [filteredFindings],
  );

  const resultCount = filteredFindings.length;

  const counts = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: findings.filter((finding) => finding.severity === severity).length,
  }));

  const statusCounts = useMemo(() => {
    const tally = new Map<TaskStatus, number>(
      STATUS_ORDER.map((status) => [status, 0]),
    );

    for (const finding of findings) {
      const status = getRecordStatus(finding, records);
      tally.set(status, (tally.get(status) ?? 0) + 1);
    }

    return STATUS_ORDER.map((status) => ({
      status,
      count: tally.get(status) ?? 0,
    }));
  }, [findings, records]);

  // Progress = finished tasks over the full set of findings (including "No
  // Aplica" in the denominator).
  const progress = useMemo(() => {
    const total = findings.length;
    let finalizadas = 0;

    for (const finding of findings) {
      if (getRecordStatus(finding, records) === "Finalizada") {
        finalizadas += 1;
      }
    }

    const percent = total === 0 ? 0 : Math.round((finalizadas / total) * 100);

    return { finalizadas, total, percent };
  }, [findings, records]);

  const toggleSeverity = (severity: Severity) => {
    setSeverityFilter((prev) => (prev === severity ? null : severity));
  };

  const toggleStatus = (status: TaskStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const toggleCategory = (key: string) => {
    if (isFiltering) return;
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleRow = (index: number) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const isRowExpanded = (finding: NumberedSecurityFinding) => {
    if (openRows.has(finding.number)) return true;
    if (!isSearching) return false;
    // Auto-expand when the match is only in the expandable content (detail or
    // change history), not when the title already matches.
    return (
      (matchesField(finding.detail, trimmedQuery) ||
        matchesHistory(records[finding.id], trimmedQuery)) &&
      !matchesField(finding.title, trimmedQuery)
    );
  };

  const openStatusChange = (
    finding: NumberedSecurityFinding,
    nextStatus: TaskStatus,
  ) => {
    setModalError(null);
    setPendingChange({
      findingId: finding.id,
      findingTitle: finding.title,
      status: nextStatus,
      previousStatus: getRecordStatus(finding, records),
      mode: "status",
    });
  };

  const openNoteChange = (finding: NumberedSecurityFinding) => {
    setModalError(null);
    const currentStatus = getRecordStatus(finding, records);
    setPendingChange({
      findingId: finding.id,
      findingTitle: finding.title,
      status: currentStatus,
      previousStatus: currentStatus,
      mode: "note",
    });
  };

  const closeModal = () => {
    if (isSubmitting || showSuccess) {
      return;
    }

    setPendingChange(null);
    setModalError(null);
  };

  const handleSubmitChange = ({
    date,
    reason,
  }: {
    date: string;
    reason: string;
  }) => {
    if (!pendingChange) {
      return;
    }

    const { findingId, status, previousStatus, mode } = pendingChange;
    const previousRecord = records[findingId];
    const optimisticEntry = {
      id: `optimistic-${crypto.randomUUID()}`,
      status,
      previousStatus,
      kind: mode,
      reason: reason.trim(),
      author: "Guardando...",
      date,
      createdAt: new Date().toISOString(),
    };

    setModalError(null);
    setRecords((prev) => {
      const current = prev[findingId];
      const history = [...(current?.history ?? []), optimisticEntry];

      return {
        ...prev,
        [findingId]: {
          findingId,
          currentStatus: status,
          updatedAt: optimisticEntry.createdAt,
          history,
        },
      };
    });

    startTransition(async () => {
      const result = await appendSecurityChangeAction({
        findingId,
        status,
        reason,
        date,
        mode,
      });

      if (!result.success) {
        setRecords((prev) => {
          if (!previousRecord) {
            const next = { ...prev };
            delete next[findingId];
            return next;
          }

          return {
            ...prev,
            [findingId]: previousRecord,
          };
        });
        setModalError(result.error);
        return;
      }

      setRecords((prev) => {
        const current = prev[findingId];
        const historyWithoutOptimistic = (current?.history ?? []).filter(
          (entry) => !entry.id.startsWith("optimistic-"),
        );

        return {
          ...prev,
          [findingId]: {
            findingId,
            currentStatus: result.currentStatus,
            updatedAt: result.entry.createdAt,
            history: [...historyWithoutOptimistic, result.entry],
          },
        };
      });

      setModalError(null);
      setShowSuccess(true);

      window.setTimeout(() => {
        setShowSuccess(false);
        setPendingChange(null);
        router.refresh();
      }, 1600);
    });
  };

  const openCreateFinding = () => {
    setFindingError(null);
    setFindingSuccess(false);
    setFindingModal({
      mode: "create",
      values: {
        code: "",
        severity: "MEDIO",
        category: "platform",
        title: "",
        detail: "",
      },
    });
  };

  const openEditFinding = (finding: NumberedSecurityFinding) => {
    setFindingError(null);
    setFindingSuccess(false);
    setFindingModal({
      mode: "edit",
      id: finding.id,
      values: {
        code: finding.code,
        severity: finding.severity,
        category: finding.category,
        title: finding.title,
        detail: finding.detail,
      },
    });
  };

  const closeFindingModal = () => {
    if (isFindingPending || findingSuccess) {
      return;
    }

    setFindingModal(null);
    setFindingError(null);
  };

  const handleSubmitFinding = (values: FindingFormValues) => {
    if (!findingModal) {
      return;
    }

    setFindingError(null);

    startFindingTransition(async () => {
      const result = await upsertSecurityFindingAction({
        id: findingModal.id,
        ...values,
      });

      if (!result.success) {
        setFindingError(result.error);
        return;
      }

      setFindingSuccess(true);

      window.setTimeout(() => {
        setFindingSuccess(false);
        setFindingModal(null);
        router.refresh();
      }, 1600);
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="section-title text-base font-semibold tracking-tight text-foreground">
            Tareas
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openCreateFinding}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar tarea
            </button>
            <div
              className="t-input-dissolve relative w-full sm:w-64"
              data-clearing={isClearing ? "true" : "false"}
            >
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-[2] h-4 w-4 -translate-y-1/2 text-foreground/35" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className={`relative z-[2] w-full rounded-full border border-foreground/10 bg-white/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-brand ${
                  isClearing
                    ? "[-webkit-text-fill-color:transparent] caret-transparent"
                    : ""
                }`}
              />
              {isClearing && (
                <div className="t-input-dissolve__mirror" aria-hidden="true">
                  {renderDissolveTokens(query)}
                </div>
              )}
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 rounded-full p-1 text-foreground/35 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm border border-foreground/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Progreso
            </span>
            <span className="font-mono text-xs text-foreground/55">
              <span className="font-bold text-foreground">
                {progress.finalizadas}/{progress.total}
              </span>{" "}
              finalizadas
              <span className="ml-2 text-foreground/40">{progress.percent}%</span>
            </span>
          </div>
          <div
            className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.finalizadas}
            aria-label="Tareas finalizadas"
          >
            <div
              className="h-full rounded-full bg-teal-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-foreground/35">
              Estado
            </span>
            {statusCounts.map(({ status, count }) => {
              const isActive = statusFilter === status;
              const style = STATUS_STYLES[status];
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleStatus(status)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${style.bg} ${style.text} ${
                    isActive
                      ? "ring-2 ring-current ring-offset-1 ring-offset-[var(--app-background)]"
                      : statusFilter !== null
                        ? "opacity-45 hover:opacity-100"
                        : "hover:opacity-80"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                  {count} {status}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-foreground/35">
              Severidad
            </span>
            {counts.map(({ severity, count }) => {
              const isActive = severityFilter === severity;
              return (
                <button
                  key={severity}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleSeverity(severity)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${SEVERITY_STYLES[severity]} ${
                    isActive
                      ? "ring-2 ring-current ring-offset-1 ring-offset-[var(--app-background)]"
                      : severityFilter !== null
                        ? "opacity-45 hover:opacity-100"
                        : "hover:opacity-80"
                  }`}
                >
                  {count} {severity}
                </button>
              );
            })}
          </div>
        </div>

        {isFiltering && (
          <p className="text-right font-mono text-xs text-foreground/40">
            {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
          </p>
        )}

        {isFiltering && resultCount === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/45">
            Sin tareas que coincidan con los filtros.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((category) => {
              const isCategoryOpen =
                isFiltering || openCategories.has(category.key);
              return (
                <div
                  key={category.key}
                  className="bg-white/50 backdrop-blur-sm border border-foreground/10 rounded-xl"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isCategoryOpen}
                    onClick={() => toggleCategory(category.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCategory(category.key);
                      }
                    }}
                    className={[
                      "flex items-center justify-between gap-3 p-4 outline-none rounded-xl transition-colors",
                      isFiltering
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-white/40 focus-visible:bg-white/40",
                    ].join(" ")}
                  >
                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
                      <ChevronRightIcon
                        className={`h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-150 ${
                          isCategoryOpen ? "rotate-90" : ""
                        }`}
                      />
                      {category.name}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-foreground/5 text-foreground/45">
                      {category.items.length}
                    </span>
                  </div>

                  {isCategoryOpen && (
                    <div className="border-t border-foreground/10">
                      {category.items.map((finding, i) => {
                        const isRowOpen = isRowExpanded(finding);
                        const isLast = i === category.items.length - 1;
                        const record = records[finding.id];
                        const currentStatus = getRecordStatus(finding, records);
                        const latestEntry = getLatestHistoryEntry(record);
                        const annotatedHistory = annotateSecurityHistory(
                          record?.history ?? [],
                          finding.severity,
                        );

                        return (
                          <div
                            key={finding.id}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isRowOpen}
                            onClick={() => toggleRow(finding.number)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleRow(finding.number);
                              }
                            }}
                            className={[
                              "p-4 pl-5 cursor-pointer outline-none transition-all duration-150 hover:bg-white/40 focus-visible:bg-white/40",
                              isLast
                                ? "rounded-b-xl"
                                : "border-b border-foreground/5",
                            ].join(" ")}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1">
                                <h5 className="flex items-start gap-2 text-sm font-semibold tracking-tight text-foreground">
                                  <ChevronRightIcon
                                    className={`h-4 w-4 mt-0.5 shrink-0 text-foreground/35 transition-transform duration-150 ${
                                      isRowOpen ? "rotate-90" : ""
                                    }`}
                                  />
                                  <span>
                                    <span className="font-mono text-foreground/35 mr-2">
                                      #{String(finding.number).padStart(2, "0")}
                                    </span>
                                    <HighlightText
                                      text={finding.title}
                                      regex={highlightRegex}
                                    />
                                  </span>
                                </h5>
                                {latestEntry ? (
                                  <p className="mt-1 pl-6 text-[11px] text-foreground/45">
                                    Última actualización:{" "}
                                    <HighlightText
                                      text={latestEntry.author}
                                      regex={highlightRegex}
                                    />{" "}
                                    ·{" "}
                                    <HighlightText
                                      text={formatDisplayDate(latestEntry.date)}
                                      regex={highlightRegex}
                                    />
                                  </p>
                                ) : null}
                              </div>
                              <div
                                className="flex shrink-0 items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  aria-label="Editar hallazgo"
                                  onClick={() => openEditFinding(finding)}
                                  className="rounded-full border border-foreground/10 p-1.5 text-foreground/50 transition-colors hover:bg-white/70 hover:text-foreground"
                                >
                                  <PencilSquareIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => openNoteChange(finding)}
                                  className="rounded-full border border-foreground/10 px-2.5 py-1 text-[11px] font-semibold text-foreground/60 transition-colors hover:bg-white/70 hover:text-foreground disabled:opacity-50"
                                >
                                  Agregar actualización
                                </button>
                                <StatusSelect
                                  value={currentStatus}
                                  disabled={isSubmitting}
                                  onChangeRequest={(nextStatus) =>
                                    openStatusChange(finding, nextStatus)
                                  }
                                />
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${SEVERITY_STYLES[finding.severity]}`}
                                >
                                  {finding.severity}
                                </span>
                              </div>
                            </div>

                            {isRowOpen && (
                              <div className="mt-2 space-y-4 pl-6">
                                <p className="text-xs text-foreground/45 leading-relaxed">
                                  <HighlightText
                                    text={finding.detail}
                                    regex={highlightRegex}
                                  />
                                </p>

                                {annotatedHistory.length > 0 ? (
                                  <div className="space-y-2">
                                    <h6 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                                      Historial de cambios
                                    </h6>
                                    <div className="space-y-2">
                                      {[...annotatedHistory]
                                        .reverse()
                                        .map(({ entry, kind, previousStatus }) => (
                                          <div
                                            key={entry.id}
                                            className="rounded-xl border border-foreground/8 bg-white/60 px-3 py-2.5"
                                          >
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/55">
                                              {kind === "note" ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 font-semibold text-foreground/60">
                                                  <ChatBubbleLeftEllipsisIcon className="h-3 w-3" />
                                                  Comentario
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5">
                                                  <StatusPill
                                                    status={previousStatus}
                                                    regex={highlightRegex}
                                                    muted
                                                  />
                                                  <ArrowRightIcon className="h-3 w-3 shrink-0 text-foreground/35" />
                                                  <StatusPill
                                                    status={entry.status}
                                                    regex={highlightRegex}
                                                  />
                                                </span>
                                              )}
                                              <span className="text-foreground/30">
                                                ·
                                              </span>
                                              <span>
                                                <HighlightText
                                                  text={entry.author}
                                                  regex={highlightRegex}
                                                />
                                              </span>
                                              <span className="text-foreground/30">
                                                ·
                                              </span>
                                              <span>
                                                <HighlightText
                                                  text={formatDisplayDate(
                                                    entry.date,
                                                  )}
                                                  regex={highlightRegex}
                                                />
                                              </span>
                                            </div>
                                            <p className="mt-1.5 text-xs leading-relaxed text-foreground/65">
                                              <HighlightText
                                                text={entry.reason}
                                                regex={highlightRegex}
                                              />
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChangeModal
        open={pendingChange !== null}
        title={
          pendingChange?.mode === "note"
            ? "Agregar actualización"
            : "Registrar cambio de estado"
        }
        description={
          pendingChange
            ? pendingChange.mode === "note"
              ? `Vas a agregar una nota al hallazgo "${pendingChange.findingTitle}".`
              : `Vas a actualizar el estado del hallazgo "${pendingChange.findingTitle}".`
            : ""
        }
        statusLabel={pendingChange?.status ?? "No comenzada"}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
        successMessage={
          pendingChange?.mode === "note"
            ? "Actualización agregada"
            : "Estado actualizado"
        }
        errorMessage={modalError}
        onClose={closeModal}
        onSubmit={handleSubmitChange}
      />

      <FindingModal
        open={findingModal !== null}
        mode={findingModal?.mode ?? "create"}
        initialValues={findingModal?.values}
        isSubmitting={isFindingPending}
        showSuccess={findingSuccess}
        errorMessage={findingError}
        onClose={closeFindingModal}
        onSubmit={handleSubmitFinding}
      />
    </>
  );
}
