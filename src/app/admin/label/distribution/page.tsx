import { LabelReleaseSubmissionsPanel } from "@/components/admin/LabelReleaseSubmissionsPanel";

export default function AdminLabelDistributionPage() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Дыстрыбуцыя</h1>
        <p className="text-sm text-muted-foreground">
          Заяўкі на публікацыю рэлізаў з кабінета артыста: статусы, архіў, мадэрацыя.
        </p>
      </div>
      <LabelReleaseSubmissionsPanel />
    </div>
  );
}
