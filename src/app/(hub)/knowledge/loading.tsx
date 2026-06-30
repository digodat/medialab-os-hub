import MathCurveLoader from "@/components/ui/math-curve-loader";

export default function KnowledgeLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <MathCurveLoader curve="Rose Four" size={140} color="var(--brand)" />
    </div>
  );
}
