import { useState, useMemo, useCallback } from 'react';
import type { AdminConfig } from '@/lib/types';
import { loadConfig } from '@/lib/configStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, ArrowLeft, Shield, AlertTriangle, TrendingUp, Users, BarChart3, Zap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  type PortfolioCustomer, type PortfolioSummary, type CrossSellingOpportunity,
  type PortfolioStressResult, type SegmentGroup,
  parseImportData, summarizePortfolio, analyzeCrossSelling, analyzeRepricing,
  stressTestPortfolio, segmentBy, generateCSVTemplate,
} from '@/lib/portfolioAnalysis';
import { generateMockCSV } from '@/lib/mockPortfolioData';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';

function fmt(n: number): string { return Math.round(n).toLocaleString('sv-SE'); }
function fmtM(n: number): string { return (n / 1e6).toFixed(1) + 'M'; }
function fmtPct(n: number): string { return n.toFixed(2) + '%'; }

const SIGNAL_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
const TABS = [
  { id: 'overview', label: 'Översikt', icon: BarChart3 },
  { id: 'customers', label: 'Kunder', icon: Users },
  { id: 'losses', label: 'Förlustanalys', icon: AlertTriangle },
  { id: 'crosssell', label: 'Merförsäljning', icon: TrendingUp },
  { id: 'repricing', label: 'Prisoptimering', icon: Zap },
  { id: 'stress', label: 'Stresstest', icon: Shield },
  { id: 'segments', label: 'Segmentering', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [config] = useState<AdminConfig>(loadConfig);
  const [customers, setCustomers] = useState<PortfolioCustomer[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [importing, setImporting] = useState(false);

  const summary = useMemo(() => summarizePortfolio(customers), [customers]);

  const handleFileUpload = useCallback((file: File) => {
    setImporting(true);
    Papa.parse(file, {
      complete: (result) => {
        const rows = result.data as string[][];
        const parsed = parseImportData(rows, config);
        setCustomers(parsed);
        setImporting(false);
      },
      delimiter: '',
      skipEmptyLines: true,
    });
  }, [config]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const loadMockData = useCallback(() => {
    setImporting(true);
    setTimeout(() => {
      const csv = generateMockCSV(500);
      Papa.parse(csv, {
        complete: (result) => {
          const rows = result.data as string[][];
          const parsed = parseImportData(rows, config);
          setCustomers(parsed);
          setImporting(false);
        },
        delimiter: ';',
        skipEmptyLines: true,
      });
    }, 50);
  }, [config]);

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio_mall.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (customers.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-6 py-4">
          <div className="mx-auto flex max-w-[1200px] items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Portföljanalys</h1>
              <p className="text-sm text-muted-foreground">Importera avidentifierad data — allt bearbetas lokalt</p>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[800px] p-6">
          <div
            className="rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Dra och släpp CSV-fil här</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Avidentifierad data med finansiella parametrar. Ingen persondata behövs.
            </p>
            <div className="flex justify-center gap-3">
              <label>
                <input type="file" accept=".csv,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                <Button variant="default" asChild><span><Upload className="mr-2 h-4 w-4" />Välj fil</span></Button>
              </label>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Ladda ner mall
              </Button>
            </div>
            <div className="mt-4 border-t pt-4">
              <Button variant="secondary" onClick={loadMockData} disabled={importing}>
                <Users className="mr-2 h-4 w-4" /> Ladda 500 testkunder
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Genererar slumpmässig avidentifierad data för demo</p>
            </div>
            {importing && <p className="mt-4 text-sm text-muted-foreground">Bearbetar...</p>}
          </div>
          <div className="mt-6 rounded-lg bg-signal-green-bg p-4 text-sm" style={{ color: 'hsl(var(--signal-green))' }}>
            <Shield className="inline h-4 w-4 mr-2" />
            All data bearbetas lokalt i din webbläsare. Inget skickas till någon server. Stäng fliken = data borta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Portföljanalys</h1>
              <p className="text-sm text-muted-foreground">{fmt(summary.totalCustomers)} kunder · {fmtM(summary.totalLoanVolume)} kr lånevolym</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCustomers([])}>Ny import</Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-[1600px] px-6 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] p-6">
        {activeTab === 'overview' && <OverviewTab summary={summary} customers={customers} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} />}
        {activeTab === 'losses' && <LossesTab customers={customers} />}
        {activeTab === 'crosssell' && <CrossSellTab customers={customers} config={config} />}
        {activeTab === 'repricing' && <RepricingTab customers={customers} config={config} />}
        {activeTab === 'stress' && <StressTab customers={customers} config={config} />}
        {activeTab === 'segments' && <SegmentsTab customers={customers} />}
      </div>
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================

function OverviewTab({ summary: s, customers }: { summary: PortfolioSummary; customers: PortfolioCustomer[] }) {
  const signalData = [
    { name: 'Grön', value: s.signalDistribution.green, fill: SIGNAL_COLORS.green },
    { name: 'Gul', value: s.signalDistribution.yellow, fill: SIGNAL_COLORS.yellow },
    { name: 'Röd', value: s.signalDistribution.red, fill: SIGNAL_COLORS.red },
  ];
  const incomeData = [
    { name: 'Räntenetto', value: Math.max(0, s.incomeMix.netInterest) },
    { name: 'Equity FTP', value: Math.max(0, s.incomeMix.equityFTP) },
    { name: 'Inlåning', value: Math.max(0, s.incomeMix.deposit) },
    { name: 'Sparande', value: Math.max(0, s.incomeMix.savings) },
    { name: 'Produkter', value: Math.max(0, s.incomeMix.crossSelling) },
  ];
  const marginBuckets = useMemo(() => {
    const buckets = [
      { range: '< 0%', count: 0 }, { range: '0-0.15%', count: 0 }, { range: '0.15-0.40%', count: 0 },
      { range: '0.40-0.80%', count: 0 }, { range: '> 0.80%', count: 0 },
    ];
    for (const c of customers) {
      const m = c.result.netMarginPercent;
      if (m < 0) buckets[0].count++;
      else if (m < 0.15) buckets[1].count++;
      else if (m < 0.40) buckets[2].count++;
      else if (m < 0.80) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <KPICard label="Kunder" value={fmt(s.totalCustomers)} />
        <KPICard label="Lånevolym" value={fmtM(s.totalLoanVolume)} />
        <KPICard label="Årligt ekon. resultat" value={`${fmt(s.totalAnnualEP)} kr`} warn={s.totalAnnualEP < 0} />
        <KPICard label="Snitt nettomarginal" value={fmtPct(s.avgNetMargin)} warn={s.avgNetMargin < 0.15} />
        <KPICard label="KALP-underkända" value={`${s.kalpFailCount}`} warn={s.kalpFailCount > 0} />
        <KPICard label="Stresstest-underkända" value={`${s.stressFailCount}`} warn={s.stressFailCount > 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Signal distribution */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Signalfördelning</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={signalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {signalData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span style={{ color: SIGNAL_COLORS.green }}>{s.signalDistribution.green} gröna ({s.totalCustomers > 0 ? Math.round(s.signalDistribution.green / s.totalCustomers * 100) : 0}%)</span>
            <span style={{ color: SIGNAL_COLORS.yellow }}>{s.signalDistribution.yellow} gula</span>
            <span style={{ color: SIGNAL_COLORS.red }}>{s.signalDistribution.red} röda</span>
          </div>
        </div>

        {/* Margin distribution */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Marginalfördelning</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={marginBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="count" fill="hsl(220, 60%, 35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Income mix */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Intäktsmix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={v => fmtM(v)} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <RechartsTooltip formatter={(v: number) => `${fmt(v)} kr`} />
              <Bar dataKey="value" fill="hsl(220, 60%, 35%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Customers Tab
// ============================================

function CustomersTab({ customers }: { customers: PortfolioCustomer[] }) {
  const [sortKey, setSortKey] = useState<string>('ep');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<string>('all');

  const sorted = useMemo(() => {
    let list = [...customers];
    if (signalFilter !== 'all') list = list.filter(c => c.result.signal === signalFilter);
    if (search) list = list.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

    list.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortKey === 'ep') { va = a.result.annualEconomicProfit; vb = b.result.annualEconomicProfit; }
      else if (sortKey === 'margin') { va = a.result.netMarginPercent; vb = b.result.netMarginPercent; }
      else if (sortKey === 'loan') { va = a.input.loanAmount; vb = b.input.loanAmount; }
      else if (sortKey === 'rate') { va = a.result.effectiveCustomerRate; vb = b.result.effectiveCustomerRate; }
      else if (sortKey === 'ltv') { va = a.result.ltvPercent; vb = b.result.ltvPercent; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [customers, sortKey, sortDir, search, signalFilter]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök kund..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={signalFilter} onValueChange={setSignalFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Signal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla</SelectItem>
            <SelectItem value="green">Grön</SelectItem>
            <SelectItem value="yellow">Gul</SelectItem>
            <SelectItem value="red">Röd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">Signal</th>
              <th className="pb-2 text-left font-medium">Kund</th>
              <th className="pb-2 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('loan')}>Lån {sortKey === 'loan' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="pb-2 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('rate')}>Ränta {sortKey === 'rate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="pb-2 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('ltv')}>LTV {sortKey === 'ltv' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="pb-2 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('margin')}>Marginal {sortKey === 'margin' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="pb-2 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('ep')}>Ekon. resultat {sortKey === 'ep' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="pb-2 text-center font-medium">KALP</th>
              <th className="pb-2 text-left font-medium">Segment</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 200).map(c => (
              <tr key={c.rowIndex} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: SIGNAL_COLORS[c.result.signal] }} /></td>
                <td className="py-2 font-medium">{c.label}</td>
                <td className="py-2 text-right font-mono">{fmtM(c.input.loanAmount)}</td>
                <td className="py-2 text-right font-mono">{c.result.effectiveCustomerRate.toFixed(2)}%</td>
                <td className="py-2 text-right font-mono">{c.result.ltvPercent.toFixed(0)}%</td>
                <td className={`py-2 text-right font-mono ${c.result.netMarginPercent < 0 ? 'text-signal-red' : ''}`}>{fmtPct(c.result.netMarginPercent)}</td>
                <td className={`py-2 text-right font-mono ${c.result.annualEconomicProfit < 0 ? 'text-signal-red' : ''}`}>{fmt(c.result.annualEconomicProfit)}</td>
                <td className="py-2 text-center">{c.result.kalp.approved ? '✓' : '✗'}</td>
                <td className="py-2 text-xs text-muted-foreground">{c.segment}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && <p className="text-xs text-muted-foreground mt-2">Visar 200 av {sorted.length} kunder</p>}
      </div>
    </div>
  );
}

// ============================================
// Losses Tab
// ============================================

function LossesTab({ customers }: { customers: PortfolioCustomer[] }) {
  const losses = useMemo(() =>
    customers.filter(c => c.result.annualEconomicProfit < 0)
      .sort((a, b) => a.result.annualEconomicProfit - b.result.annualEconomicProfit),
    [customers]
  );
  const totalLoss = losses.reduce((s, c) => s + c.result.annualEconomicProfit, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard label="Förlustaffärer" value={`${losses.length}`} warn />
        <KPICard label="Andel av portfölj" value={`${customers.length > 0 ? Math.round(losses.length / customers.length * 100) : 0}%`} warn />
        <KPICard label="Total förlust/år" value={`${fmt(totalLoss)} kr`} warn />
      </div>

      <div className="metric-card">
        <h3 className="section-header mb-4">Förlustaffärer (sorterade sämst först)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">Kund</th>
              <th className="pb-2 text-right font-medium">Lån</th>
              <th className="pb-2 text-right font-medium">Ränta</th>
              <th className="pb-2 text-right font-medium">Ekon. resultat</th>
              <th className="pb-2 text-right font-medium">Marginal</th>
              <th className="pb-2 text-left font-medium">Orsak</th>
            </tr>
          </thead>
          <tbody>
            {losses.slice(0, 100).map(c => {
              const reasons: string[] = [];
              if (c.result.spread < 0.5) reasons.push('Låg spread');
              if (c.result.ltvPercent > 85) reasons.push('Hög LTV');
              if (!c.result.kalp.approved) reasons.push('KALP underskott');
              if (c.result.annualIncome.crossSellingIncome === 0) reasons.push('Inga produkter');
              if (c.result.rateDeviation < -0.3) reasons.push('Stor rabatt');
              if (reasons.length === 0) reasons.push('Låg volym/hög kostnad');
              return (
                <tr key={c.rowIndex} className="border-b border-border/50">
                  <td className="py-2 font-medium">{c.label}</td>
                  <td className="py-2 text-right font-mono">{fmtM(c.input.loanAmount)}</td>
                  <td className="py-2 text-right font-mono">{c.result.effectiveCustomerRate.toFixed(2)}%</td>
                  <td className="py-2 text-right font-mono text-signal-red">{fmt(c.result.annualEconomicProfit)}</td>
                  <td className="py-2 text-right font-mono text-signal-red">{fmtPct(c.result.netMarginPercent)}</td>
                  <td className="py-2 text-xs text-muted-foreground">{reasons.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Cross-sell Tab
// ============================================

function CrossSellTab({ customers, config }: { customers: PortfolioCustomer[]; config: AdminConfig }) {
  const opportunities = useMemo(() => analyzeCrossSelling(customers, config), [customers, config]);
  const totalPotential = opportunities.reduce((s, o) => s + o.potentialIncome, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard label="Kunder med potential" value={`${opportunities.length}`} />
        <KPICard label="Total potentiell intäkt" value={`${fmt(totalPotential)} kr/år`} />
        <KPICard label="Snitt per kund" value={`${opportunities.length > 0 ? fmt(totalPotential / opportunities.length) : 0} kr/år`} />
      </div>

      <div className="metric-card">
        <h3 className="section-header mb-4">Topp merförsäljningsmöjligheter</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">Kund</th>
              <th className="pb-2 text-right font-medium">Lån</th>
              <th className="pb-2 text-right font-medium">Potentiell intäkt</th>
              <th className="pb-2 text-left font-medium">Saknade produkter</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.slice(0, 50).map(o => (
              <tr key={o.customer.rowIndex} className="border-b border-border/50">
                <td className="py-2 font-medium">{o.customer.label}</td>
                <td className="py-2 text-right font-mono">{fmtM(o.customer.input.loanAmount)}</td>
                <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--signal-green))' }}>+{fmt(o.potentialIncome)} kr/år</td>
                <td className="py-2 text-xs text-muted-foreground">{o.missingProducts.slice(0, 5).map(p => p.name).join(', ')}{o.missingProducts.length > 5 ? ` +${o.missingProducts.length - 5}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Repricing Tab
// ============================================

function RepricingTab({ customers, config }: { customers: PortfolioCustomer[]; config: AdminConfig }) {
  const opportunities = useMemo(() => analyzeRepricing(customers, config), [customers, config]);
  const discounted = opportunities.filter(o => o.deviation < -0.05);
  const totalRecovery = discounted.reduce((s, o) => s + Math.abs(o.deviation) * o.customer.input.loanAmount / 100, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard label="Kunder med omsättningsdatum" value={`${opportunities.length}`} />
        <KPICard label="Kunder under listränta" value={`${discounted.length}`} />
        <KPICard label="Potentiell intäktsåterhämtning" value={`${fmt(totalRecovery)} kr/år`} />
      </div>

      <div className="metric-card">
        <h3 className="section-header mb-4">Kunder med rabatterad ränta (vid omsättning)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">Kund</th>
              <th className="pb-2 text-right font-medium">Lån</th>
              <th className="pb-2 text-right font-medium">Kundränta</th>
              <th className="pb-2 text-right font-medium">Listränta</th>
              <th className="pb-2 text-right font-medium">Avvikelse</th>
              <th className="pb-2 text-left font-medium">Omsättning</th>
              <th className="pb-2 text-right font-medium">Intäkt vid listpris</th>
            </tr>
          </thead>
          <tbody>
            {discounted.slice(0, 50).map(o => (
              <tr key={o.customer.rowIndex} className="border-b border-border/50">
                <td className="py-2 font-medium">{o.customer.label}</td>
                <td className="py-2 text-right font-mono">{fmtM(o.customer.input.loanAmount)}</td>
                <td className="py-2 text-right font-mono">{o.currentRate.toFixed(2)}%</td>
                <td className="py-2 text-right font-mono">{o.listRate.toFixed(2)}%</td>
                <td className="py-2 text-right font-mono text-signal-red">{o.deviation.toFixed(2)}%</td>
                <td className="py-2 text-xs">{o.customer.bindingMaturity || '—'}</td>
                <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--signal-green))' }}>+{fmt(Math.abs(o.deviation) * o.customer.input.loanAmount / 100)} kr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Stress Test Tab
// ============================================

function StressTab({ customers, config }: { customers: PortfolioCustomer[]; config: AdminConfig }) {
  const results = useMemo(() => stressTestPortfolio(customers, config), [customers, config]);
  const baseEP = customers.reduce((s, c) => s + c.result.annualEconomicProfit, 0);

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="section-header mb-4">Portföljstresstest — ränteuppgång</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">Scenario</th>
              <th className="pb-2 text-right font-medium">Total EP/år</th>
              <th className="pb-2 text-right font-medium">Förändring</th>
              <th className="pb-2 text-center font-medium">Gröna</th>
              <th className="pb-2 text-center font-medium">Gula</th>
              <th className="pb-2 text-center font-medium">Röda</th>
              <th className="pb-2 text-right font-medium">KALP-underkända</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50 bg-muted/50 font-semibold">
              <td className="py-2">Nuvarande</td>
              <td className="py-2 text-right font-mono">{fmt(baseEP)} kr</td>
              <td className="py-2 text-right">—</td>
              <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.green }}>{customers.filter(c => c.result.signal === 'green').length}</td>
              <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.yellow }}>{customers.filter(c => c.result.signal === 'yellow').length}</td>
              <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.red }}>{customers.filter(c => c.result.signal === 'red').length}</td>
              <td className="py-2 text-right">{customers.filter(c => !c.result.kalp.approved).length}</td>
            </tr>
            {results.map(r => (
              <tr key={r.rateAddon} className={`border-b border-border/50 ${r.rateAddon === 3 ? 'font-semibold' : ''}`}>
                <td className="py-2">+{r.rateAddon}% ränta{r.rateAddon === 3 ? ' (FI-krav)' : ''}</td>
                <td className="py-2 text-right font-mono">{fmt(r.totalEP)} kr</td>
                <td className={`py-2 text-right font-mono ${r.epChange < 0 ? 'text-signal-red' : ''}`}>{fmt(r.epChange)} kr</td>
                <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.green }}>{r.customersGreen}</td>
                <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.yellow }}>{r.customersYellow}</td>
                <td className="py-2 text-center" style={{ color: SIGNAL_COLORS.red }}>{r.customersRed}</td>
                <td className={`py-2 text-right ${r.kalpFailCount > 0 ? 'text-signal-red' : ''}`}>{r.kalpFailCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="metric-card">
        <h3 className="section-header mb-4">EP-påverkan vid ränteuppgång</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ name: 'Nu', ep: baseEP }, ...results.map(r => ({ name: `+${r.rateAddon}%`, ep: r.totalEP }))]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => fmtM(v)} />
            <RechartsTooltip formatter={(v: number) => `${fmt(v)} kr`} />
            <Bar dataKey="ep" fill="hsl(220, 60%, 35%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// Segments Tab
// ============================================

function SegmentsTab({ customers }: { customers: PortfolioCustomer[] }) {
  const [segField, setSegField] = useState<'segment' | 'region' | 'advisor' | 'signal'>('segment');
  const groups = useMemo(() => segmentBy(customers, segField), [customers, segField]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['segment', 'region', 'advisor', 'signal'] as const).map(f => (
          <Button key={f} variant={segField === f ? 'default' : 'outline'} size="sm" onClick={() => setSegField(f)}>
            {{ segment: 'Segment', region: 'Region/Kontor', advisor: 'Rådgivare', signal: 'Signal' }[f]}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="pb-2 text-left font-medium">{segField === 'signal' ? 'Signal' : 'Grupp'}</th>
              <th className="pb-2 text-right font-medium">Kunder</th>
              <th className="pb-2 text-right font-medium">Lånevolym</th>
              <th className="pb-2 text-right font-medium">Ekon. resultat</th>
              <th className="pb-2 text-right font-medium">Snitt marginal</th>
              <th className="pb-2 text-right font-medium">Snitt RAROC</th>
              <th className="pb-2 text-right font-medium">K/I-tal</th>
              <th className="pb-2 text-center font-medium">Grön/Gul/Röd</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.key} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-2 font-medium">{g.key}</td>
                <td className="py-2 text-right font-mono">{g.summary.totalCustomers}</td>
                <td className="py-2 text-right font-mono">{fmtM(g.summary.totalLoanVolume)}</td>
                <td className={`py-2 text-right font-mono ${g.summary.totalAnnualEP < 0 ? 'text-signal-red' : ''}`}>{fmt(g.summary.totalAnnualEP)}</td>
                <td className="py-2 text-right font-mono">{fmtPct(g.summary.avgNetMargin)}</td>
                <td className="py-2 text-right font-mono">{g.summary.avgRAROC.toFixed(1)}%</td>
                <td className="py-2 text-right font-mono">{g.summary.avgCostIncome.toFixed(1)}%</td>
                <td className="py-2 text-center text-xs">
                  <span style={{ color: SIGNAL_COLORS.green }}>{g.summary.signalDistribution.green}</span>{' / '}
                  <span style={{ color: SIGNAL_COLORS.yellow }}>{g.summary.signalDistribution.yellow}</span>{' / '}
                  <span style={{ color: SIGNAL_COLORS.red }}>{g.summary.signalDistribution.red}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// KPI Card
// ============================================

function KPICard({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`metric-card text-center ${warn ? 'border-signal-red/30' : ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${warn ? 'text-signal-red' : ''}`}>{value}</div>
    </div>
  );
}
