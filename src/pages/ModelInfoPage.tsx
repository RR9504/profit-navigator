import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ModelInfoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-[900px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Så fungerar modellen</h1>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Skriv ut / PDF
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] p-8 space-y-10 print:p-0 print:space-y-6">
        {/* Title */}
        <div className="text-center border-b pb-8">
          <h1 className="text-3xl font-bold">Profit Navigator — Beräkningsmodell</h1>
          <p className="text-lg text-muted-foreground mt-2">Så beräknas kundintjäning och lönsamhet</p>
          <p className="text-sm text-muted-foreground mt-1">Intern dokumentation — Sparbanken</p>
        </div>

        {/* Overview */}
        <Section title="Översikt">
          <p>
            Modellen beräknar lönsamheten per kund genom att summera alla intäkter,
            dra av alla kostnader och risk, och slutligen avgöra om affären skapar
            värde efter avkastningskrav på kapital. Resultatet uttrycks som
            <strong> ekonomiskt resultat</strong> — det som avgör om affären är grön, gul eller röd.
          </p>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm mt-4 space-y-1">
            <p>Intäkter (räntenetto + inlåning + sparande + produkter)</p>
            <p>− Kostnader (KRES + OH + regulatoriskt)</p>
            <p>− Förväntad förlust (PD × LGD × EAD)</p>
            <p>= Rörelseresultat</p>
            <p>− Skatt (20,6%)</p>
            <p>= Resultat efter skatt</p>
            <p>− Kapitalkostnad (allokerat kapital × avkastningskrav)</p>
            <p className="font-bold border-t pt-1">= Ekonomiskt resultat</p>
          </div>
        </Section>

        {/* Income */}
        <Section title="Steg 1 — Intäkter">
          <SubSection title="Räntenetto">
            <p>Kärnintäkten. Beror på lånetyp:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Swedbank Hypotek:</strong> Lånet sitter på Hypoteks balansräkning.
                Vi får en <em>provision</em> (t.ex. 0,20% av lånevolymen per år).
                Om vi ger kunden rabatt under listränta minskar provisionen — rabatten
                kommer ur vår del.
              </li>
              <li>
                <strong>Bolån i banken:</strong> Lånet sitter på vår egen balansräkning.
                Vi behåller hela spreaden: kundränta minus fundingkostnad (FTP).
                Högre intjäning men kräver eget kapital och vi tar kreditrisken.
              </li>
            </ul>
          </SubSection>

          <SubSection title="Inlåningsintjäning">
            <p>
              Kunden har pengar på konto hos oss. Vi betalar kunden en ränta (t.ex. 0,50%)
              men kan placera pengarna till en högre avkastning (FTP-ränta, t.ex. 1,80%).
              Mellanskillnaden är vår intjäning.
            </p>
            <Formula>Inlåningsintjäning = Saldo × (FTP inlåning − kundränta inlåning)</Formula>
            <p className="text-sm text-muted-foreground mt-2">
              FTP-systemet förhindrar dubbelräkning: utlåningssidan betalar FTP (kostnad),
              inlåningssidan får FTP (intäkt). På banknivå nollas det ut.
            </p>
          </SubSection>

          <SubSection title="Sparandeintjäning">
            <p>
              Om kunden har fond, ISK, sparkonto eller pension hos oss tjänar vi en
              marginal på förvaltad volym. Varje spartyp har sin egen marginalssats.
            </p>
            <Formula>Sparandeintjäning = Volym × marginal per spartyp</Formula>
          </SubSection>

          <SubSection title="Övriga produktintäkter">
            <p>
              Varje produkt kunden har (försäkring, kort, internetbank, Swish, etc.)
              genererar en årlig intäkt. Produktrabatten på räntan är <em>valfri</em> —
              rådgivaren väljer hur mycket att ge via en slider.
            </p>
          </SubSection>
        </Section>

        {/* Costs */}
        <Section title="Steg 2 — Kostnader">
          <SubSection title="Årliga kostnader">
            <table className="w-full text-sm mt-2">
              <tbody className="divide-y">
                <TR label="Kreditkostnad" desc="KRES-internpris per lånetyp. Hypotek: 283 kr. Egen bok: 800 kr." />
                <TR label="Fast kundkostnad" desc="Årlig kostnad per kund med kundansvarig. Default: 3 000 kr." />
                <TR label="Rådgivningskostnad" desc="Kostnad per rådgivningstillfälle. Default: 1 235 kr (KRES)." />
                <TR label="Produktkostnader" desc="Summa av aktiva produkters interna årskostnader från KRES-prislistan." />
                <TR label="OH-kostnad" desc="Aktivitetsbaserad overhead fördelad på: övriga produktintäkter, finansiering, lånevolym och allokerat kapital. Kalibrerad mot faktisk Swedbank-faktura." />
                <TR label="Regulatoriska kostnader" desc="Insättningsgaranti, bankskatt (utlåning + inlåning), resolutionsfondsavgift." />
              </tbody>
            </table>
          </SubSection>

          <SubSection title="Engångskostnader (separerade)">
            <p>
              Uppläggskostnad (intern) och avslutskostnad redovisas separat från den
              årliga resultaträkningen. Uppläggningsavgift till kund motbokas som intäkt.
              Dessa ingår i nuvärdesberäkningen (NPV) men inte i årlig P&L.
            </p>
          </SubSection>
        </Section>

        {/* Risk */}
        <Section title="Steg 3 — Risk">
          <SubSection title="Förväntad förlust (EL)">
            <Formula>EL = PD × LGD × EAD</Formula>
            <table className="w-full text-sm mt-2">
              <tbody className="divide-y">
                <TR label="PD (Probability of Default)" desc="Bas-sannolikhet justerad uppåt med multiplikatorer för hög belåningsgrad (LTV > 70%) och hög skuldkvot (DTI > 450%)." />
                <TR label="LGD (Loss Given Default)" desc="Förlustandel vid fallissemang. Default: 12% (svensk säkerställd obligation)." />
                <TR label="EAD (Exposure at Default)" desc="Lånets belopp." />
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground mt-2">
              Vid Hypotek-lån skalas EL ner med en faktor (default 0,10) eftersom Hypotek
              bär huvuddelen av kreditrisken.
            </p>
          </SubSection>

          <SubSection title="Riskvikt & kapitalallokering">
            <p>Riskvikten varierar med belåningsgrad (5 LTV-band):</p>
            <div className="grid grid-cols-5 gap-2 mt-2 text-center text-sm">
              <div className="rounded bg-muted p-2"><div className="text-xs text-muted-foreground">≤50%</div><div className="font-mono font-semibold">10%</div></div>
              <div className="rounded bg-muted p-2"><div className="text-xs text-muted-foreground">≤60%</div><div className="font-mono font-semibold">15%</div></div>
              <div className="rounded bg-muted p-2"><div className="text-xs text-muted-foreground">≤70%</div><div className="font-mono font-semibold">20%</div></div>
              <div className="rounded bg-muted p-2"><div className="text-xs text-muted-foreground">≤85%</div><div className="font-mono font-semibold">25%</div></div>
              <div className="rounded bg-muted p-2"><div className="text-xs text-muted-foreground">≤100%</div><div className="font-mono font-semibold">35%</div></div>
            </div>
            <Formula>Allokerat kapital = Lån × riskvikt × kapitalkrav (8%)</Formula>
          </SubSection>
        </Section>

        {/* Bottom line */}
        <Section title="Steg 4 — Ekonomiskt resultat">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
            <p>Rörelseresultat = Intäkter − Kostnader − Förväntad förlust</p>
            <p>Skatt = max(0, Rörelseresultat × 20,6%)</p>
            <p>Resultat efter skatt = Rörelseresultat − Skatt</p>
            <p>Kapitalkostnad = Allokerat kapital × Avkastningskrav (10%)</p>
            <p className="font-bold border-t pt-1">Ekonomiskt resultat = Resultat efter skatt − Kapitalkostnad</p>
          </div>
          <p className="mt-2">
            <strong>Ekonomiskt resultat</strong> visar om affären skapar värde utöver vad
            aktieägarna kräver i avkastning. Positivt = värdeskapande. Negativt = värdeförstörande.
          </p>
        </Section>

        {/* NPV */}
        <Section title="Steg 5 — Nuvärde (NPV)">
          <p>
            Ekonomiskt resultat diskonteras över förväntad lånetid (default 7 år) med
            avkastningskravet som diskonteringsränta. Engångsposter (upplägg, avslut)
            läggs in i rätt period.
          </p>
          <Formula>NPV = Engångsposter(år 0) + Σ EP / (1 + r)^t − Avslutskostnad / (1 + r)^N</Formula>
          <p className="text-sm text-muted-foreground mt-2">
            NPV ger en samlad bild av affärens totala värde över hela löptiden,
            inte bara ett enskilt år.
          </p>
        </Section>

        {/* Signal */}
        <Section title="Steg 6 — Signal (trafikljus)">
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="rounded-lg p-4 bg-signal-green-bg text-center">
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--signal-green))' }}>Grön</div>
              <p className="text-sm mt-1">Marginal ≥ 0,40%</p>
              <p className="text-sm">KALP godkänd</p>
              <p className="text-sm">Stresstest godkänt</p>
              <p className="text-xs text-muted-foreground mt-2">Affären kan genomföras</p>
            </div>
            <div className="rounded-lg p-4 bg-signal-yellow-bg text-center">
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--signal-yellow))' }}>Gul</div>
              <p className="text-sm mt-1">Marginal 0,15–0,40%</p>
              <p className="text-sm">eller stresstest underkänt</p>
              <p className="text-xs text-muted-foreground mt-2">Kräver chefsbeslut</p>
            </div>
            <div className="rounded-lg p-4 bg-signal-red-bg text-center">
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--signal-red))' }}>Röd</div>
              <p className="text-sm mt-1">Marginal &lt; 0,15%</p>
              <p className="text-sm">eller KALP underskott</p>
              <p className="text-xs text-muted-foreground mt-2">Kan inte godkännas</p>
            </div>
          </div>
        </Section>

        {/* KALP */}
        <Section title="KALP — Kvar att leva på">
          <p>
            Kontrollerar att kunden har råd med boendekostnaden. Beräknas enligt
            Finansinspektionens riktlinjer med Konsumentverkets schablonkostnader.
          </p>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1 mt-2">
            <p>Bruttoinkomst (hushåll/mån)</p>
            <p>− Skatt (30%)</p>
            <p>= Nettoinkomst</p>
            <p>− Levnadskostnader (ensamstående/par + barn)</p>
            <p>− Boendekostnader:</p>
            <p className="pl-4">Ränta (efter 30%/21% avdrag)</p>
            <p className="pl-4">+ Amortering (LTV/DTI-baserad)</p>
            <p className="pl-4">+ Drift & underhåll</p>
            <p>− Övriga lånekostnader</p>
            <p className="font-bold border-t pt-1">= KALP-överskott (måste vara ≥ 0)</p>
          </div>
        </Section>

        {/* Stress test */}
        <Section title="Stresstest">
          <p>
            Finansinspektionens krav: kunden ska klara boendekostnaden vid ränteuppgång.
            Modellen beräknar KALP vid +1%, +2% och +3% ränta. Primärt stresstest
            är +3 procentenheter (FI-krav).
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ett underkänt stresstest vid +3% ger gul eller röd signal, beroende på marginal.
          </p>
        </Section>

        {/* Amortization */}
        <Section title="Amorteringsregler">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 text-left font-medium">Villkor</th>
                <th className="pb-2 text-right font-medium">Amorteringskrav</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-2">Belåningsgrad &gt; 70%</td><td className="py-2 text-right font-mono">2%/år</td></tr>
              <tr><td className="py-2">Belåningsgrad 50–70%</td><td className="py-2 text-right font-mono">1%/år</td></tr>
              <tr><td className="py-2">Belåningsgrad &lt; 50%</td><td className="py-2 text-right font-mono">0%</td></tr>
              <tr><td className="py-2">Skuldkvot &gt; 450%</td><td className="py-2 text-right font-mono">+1%/år (tillägg)</td></tr>
            </tbody>
          </table>
          <p className="text-sm text-muted-foreground mt-2">
            Medsökandes inkomst ingår i skuldkvotberäkningen och kan sänka amorteringskravet.
          </p>
        </Section>

        {/* Data sources */}
        <Section title="Datakällor & kalibrering">
          <table className="w-full text-sm mt-2">
            <tbody className="divide-y">
              <TR label="KRES-priser" desc="Sparbankernas kalkylpriser 2022 (upplägg, årskostnad, avslut per produkt)" />
              <TR label="Swedbank internpriser 2023" desc="Kostnadspriser för Swedbank-koncernen" />
              <TR label="Swedbank-faktura" desc="Faktisk månadsfaktura nov 2024 (BankId 8321) — kalibrering av OH-modell och produktkostnader" />
              <TR label="Profitability Schema" desc="Swedbanks officiella lönsamhetsschema (Financing/Deposit/Ancillary Income)" />
              <TR label="Current Framework" desc="Beräkningsregler för Current-periodicitet (balance × rate, RV12, PV×12)" />
            </tbody>
          </table>
        </Section>

        {/* All configurable */}
        <Section title="Alla parametrar är justerbara">
          <p>
            Samtliga värden i modellen kan ändras via admin-sidan: räntor, FTP-satser,
            riskvikter, PD/LGD, OH-modell, regulatoriska kostnader, KALP-parametrar,
            produktkatalogens priser och rabatter, sparandemarginaler, tröskelvärden
            och lånetypsparametrar.
          </p>
        </Section>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-xs text-muted-foreground print:mt-8">
          <p>Profit Navigator — Beräkningsmodell</p>
          <p>Sparbanken · Intern dokumentation</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="text-xl font-bold border-b pb-2 mb-4">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-primary/5 px-4 py-2 font-mono text-sm text-center my-2">
      {children}
    </div>
  );
}

function TR({ label, desc }: { label: string; desc: string }) {
  return (
    <tr>
      <td className="py-2 font-medium pr-4 align-top whitespace-nowrap">{label}</td>
      <td className="py-2 text-muted-foreground">{desc}</td>
    </tr>
  );
}
