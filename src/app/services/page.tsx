import { ServicesForm } from "@/components/ServicesForm";
import { Music, Sliders, FileText, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Паслугі — Спеў",
  description: "Замовіце музыку на беларускай мове: ад аўтарскай кампазіцыі да гатовай песні з вашага тэксту. Спеў — беларускі музычны лейбл.",
};

const SERVICES_INFO = [
  {
    icon: Music,
    title: "Аўтарская кампазіцыя",
    description:
      "Ствараем арыгінальную музыку на беларускай мове ў любым жанры і стылі. Ад ідэі да гатовага трэка — з вакалам, аранжыроўкай і размяшчэннем на пляцоўках.",
    color: "#4A7CB5",
    glowRgb: "74, 124, 181",
    features: ["Любы жанр і настрой", "Вакал на беларускай мове", "Размяшчэнне на стрымінг-пляцоўках"],
  },
  {
    icon: FileText,
    title: "Тэкст у песню",
    description:
      "Маеце верш, тэкст ці ідэю? Мы ператворым яго ў гатовую песню. Вы пацвярджаеце аўтарства і перадаяце правы — мы займаемся астатнім.",
    color: "#C07A30",
    glowRgb: "192, 122, 48",
    features: ["Ваш тэкст — наша музыка", "Афармленне правоў аўтарства", "Размяшчэнне на пляцоўках"],
  },
  {
    icon: Sliders,
    title: "Мікшынг і мастэрынг",
    description:
      "Прафесійны мікшынг і мастэрынг для вашых запісаў. Атмасферная апрацоўка, прасторавы гук, падрыхтоўка для стрымінгу.",
    color: "#7B5EA7",
    glowRgb: "123, 94, 167",
    features: ["Стэрэа і імерсіўны мікс", "Мастэрынг для стрымінгу", "2 раўнды правак"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
            Замовіць
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 leading-tight italic">
            Паслугі і замовы
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Ствараем арыгінальную музыку на беларускай мове. Ад тэксту да гатовага
            трэка — мы дапаможам здзейсніць ваш музычны праект.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {SERVICES_INFO.map(({ icon: Icon, title, description, color, glowRgb, features }) => (
            <div
              key={title}
              className="glass rounded-2xl border border-border p-6 hover:border-primary/20 transition-all duration-300 group"
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `rgba(${glowRgb}, 0.09)`,
                  border: `1px solid rgba(${glowRgb}, 0.22)`,
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} style={{ color }} />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground/80">
                    <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Order form */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2 italic">
              Пакінуць заяўку
            </h2>
            <p className="text-muted-foreground text-sm">
              Запоўніце форму — мы адкажам у цягу 24 гадзін.
            </p>
          </div>
          <div className="glass rounded-2xl border border-border p-6 sm:p-8">
            <ServicesForm />
          </div>
        </div>
      </div>
    </div>
  );
}
