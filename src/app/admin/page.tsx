export default async function AdminPage() {
  return (
    <div className="glass rounded-2xl border border-border p-8">
      <h1 className="font-display text-3xl font-semibold text-foreground mb-2 italic">
        Адмінка SPEU
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Панэль кіравання кантэнтам, каталогам артыстаў і заяўкамі.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Раздзелы", value: "5" },
          { label: "Кантэнт-блокі", value: "CMS" },
          { label: "Артысты", value: "Catalog" },
          { label: "Заяўкі", value: "Inbox" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border p-4 bg-background/40">
            <p className="text-xs text-muted-foreground/70">{item.label}</p>
            <p className="text-lg font-semibold text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
