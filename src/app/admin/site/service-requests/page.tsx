import { ServiceRequestsPanel } from "@/components/admin/ServiceRequestsPanel";

export default function AdminSiteServiceRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Заяўкі на паслугі</h1>
        <p className="text-sm text-muted-foreground">
          Звароты з формы паслуг на сайце (не блытаць з заявамі на рэліз — яны ў раздзеле «Дыстрыбуцыя» лэйбла).
        </p>
      </div>
      <ServiceRequestsPanel />
    </div>
  );
}
