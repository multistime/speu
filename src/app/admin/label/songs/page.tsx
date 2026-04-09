import { LabelCatalogClient } from "@/components/admin/label/LabelCatalogClient";

export default function AdminLabelSongsPage() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Песні</h1>
        <p className="text-sm text-muted-foreground">Каталог трэкаў лэйбла.</p>
      </div>
      <LabelCatalogClient section="songs" />
    </div>
  );
}
