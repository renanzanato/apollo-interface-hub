import { useState, useEffect } from "react";
import {
  Zap, Plus, X, ChevronDown, ChevronUp, Target,
  TrendingUp, Flame, BarChart2, RefreshCw, Trophy,
  Skull, Play, Archive, Edit2, Check,
} from "lucide-react";
import { GrowthWeekDB, GrowthExperimentDB } from "@/lib/db";
import type { GrowthWeek, GrowthExperiment, GrowthCategory, GrowthStatus } from "@/types";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────

function currentWeekStr() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(w: string) {
  // "2026-W12" → "Semana 12 / 2026"
  const [year, wk] = w.split("-W");
  return `Semana ${wk} / ${year}`;
}

function iceColor(score: number) {
  if (score >= 8) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300";
  if (score >= 6) return "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-300";
  return "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300";
}

const CATEGORY_LABELS: Record<GrowthCategory, string> = {
  acquisition: "Aquisição",
  activation:  "Ativação",
  retention:   "Retenção",
  revenue:     "Receita",
  referral:    "Indicação",
};

const CATEGORY_COLORS: Record<GrowthCategory, string> = {
  acquisition: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  activation:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  retention:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  revenue:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  referral:    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

const STATUS_COLS: { status: GrowthStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: "backlog", label: "Backlog",    icon: Archive, color: "border-slate-300 dark:border-slate-600" },
  { status: "running", label: "Rodando",    icon: Play,    color: "border-blue-400 dark:border-blue-500" },
  { status: "done",    label: "Concluído",  icon: Trophy,  color: "border-emerald-400 dark:border-emerald-500" },
  { status: "killed",  label: "Cancelado",  icon: Skull,   color: "border-red-300 dark:border-red-600" },
];

// ── ICE Slider ───────────────────────────────────────────────

function IceSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium text-foreground">
        <span>{label}</span>
        <span className="text-primary font-bold">{value}</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Baixo</span><span>Alto</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────

export default function GrowthLabPage() {
  const [weeks, setWeeks]           = useState<GrowthWeek[]>([]);
  const [experiments, setExperiments] = useState<GrowthExperiment[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);

  // modals
  const [showWeekModal, setShowWeekModal]   = useState(false);
  const [showExpModal, setShowExpModal]     = useState(false);
  const [editingExp, setEditingExp]         = useState<GrowthExperiment | null>(null);
  const [showResultModal, setShowResultModal] = useState<GrowthExperiment | null>(null);

  // week form
  const [wNorthStar, setWNorthStar] = useState("");
  const [wMetric,    setWMetric]    = useState("");
  const [wTarget,    setWTarget]    = useState(0);
  const [wCurrent,   setWCurrent]   = useState(0);
  const [editingWeek, setEditingWeek] = useState(false);

  // experiment form
  const [eHypothesis,  setEHypothesis]  = useState("");
  const [eCategory,    setECategory]    = useState<GrowthCategory>("acquisition");
  const [eImpact,      setEImpact]      = useState(5);
  const [eConfidence,  setEConfidence]  = useState(5);
  const [eEase,        setEEase]        = useState(5);
  const [eOwner,       setEOwner]       = useState("");

  // result form
  const [rResult,    setRResult]    = useState("");
  const [rLearnings, setRLearnings] = useState("");

  async function reload() {
    const [w, e] = await Promise.all([GrowthWeekDB.getAll(), GrowthExperimentDB.getAll()]);
    setWeeks(w);
    setExperiments(e);
    if (!activeWeekId && w.length > 0) setActiveWeekId(w[0].id);
  }

  useEffect(() => { reload(); }, []);

  const activeWeek = weeks.find((w) => w.id === activeWeekId) ?? null;
  const weekExps   = experiments.filter((e) => e.weekId === activeWeekId);
  const progress   = activeWeek
    ? Math.min(100, Math.round((activeWeek.current / (activeWeek.target || 1)) * 100))
    : 0;

  // ── Week CRUD ──────────────────────────────────────────────

  function openNewWeek() {
    setEditingWeek(false);
    setWNorthStar(""); setWMetric(""); setWTarget(0); setWCurrent(0);
    setShowWeekModal(true);
  }

  function openEditWeek() {
    if (!activeWeek) return;
    setEditingWeek(true);
    setWNorthStar(activeWeek.northStar);
    setWMetric(activeWeek.metric);
    setWTarget(activeWeek.target);
    setWCurrent(activeWeek.current);
    setShowWeekModal(true);
  }

  async function saveWeek() {
    if (!wNorthStar.trim() || !wMetric.trim()) {
      toast.error("Preencha o objetivo e a métrica."); return;
    }
    try {
      if (editingWeek && activeWeek) {
        await GrowthWeekDB.update(activeWeek.id, {
          northStar: wNorthStar.trim(), metric: wMetric.trim(),
          target: wTarget, current: wCurrent,
        });
      } else {
        const week = await GrowthWeekDB.save({
          week: currentWeekStr(), northStar: wNorthStar.trim(),
          metric: wMetric.trim(), target: wTarget, current: wCurrent,
        });
        setActiveWeekId(week.id);
      }
      setShowWeekModal(false);
      reload();
    } catch {
      toast.error("Erro ao salvar semana.");
    }
  }

  // ── Experiment CRUD ────────────────────────────────────────

  function openNewExp() {
    setEditingExp(null);
    setEHypothesis(""); setECategory("acquisition");
    setEImpact(5); setEConfidence(5); setEEase(5); setEOwner("");
    setShowExpModal(true);
  }

  function openEditExp(exp: GrowthExperiment) {
    setEditingExp(exp);
    setEHypothesis(exp.hypothesis); setECategory(exp.category);
    setEImpact(exp.impact); setEConfidence(exp.confidence);
    setEEase(exp.ease); setEOwner(exp.owner ?? "");
    setShowExpModal(true);
  }

  async function saveExp() {
    if (!eHypothesis.trim()) { toast.error("Preencha a hipótese."); return; }
    if (!activeWeekId)        { toast.error("Selecione uma semana."); return; }
    try {
      if (editingExp) {
        await GrowthExperimentDB.update(editingExp.id, {
          hypothesis: eHypothesis.trim(), category: eCategory,
          impact: eImpact, confidence: eConfidence, ease: eEase,
          owner: eOwner.trim() || undefined,
        });
      } else {
        await GrowthExperimentDB.save({
          weekId: activeWeekId, hypothesis: eHypothesis.trim(),
          category: eCategory, status: "backlog",
          impact: eImpact, confidence: eConfidence, ease: eEase,
          owner: eOwner.trim() || undefined,
        });
      }
      setShowExpModal(false);
      reload();
    } catch {
      toast.error("Erro ao salvar experimento.");
    }
  }

  async function moveStatus(exp: GrowthExperiment, status: GrowthStatus) {
    try {
      await GrowthExperimentDB.update(exp.id, { status });
      reload();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  async function deleteExp(id: string) {
    try {
      await GrowthExperimentDB.remove(id);
      reload();
    } catch {
      toast.error("Erro ao remover experimento.");
    }
  }

  async function saveResult() {
    if (!showResultModal) return;
    try {
      await GrowthExperimentDB.update(showResultModal.id, {
        result: rResult.trim() || undefined,
        learnings: rLearnings.trim() || undefined,
        status: "done",
      });
      setShowResultModal(null);
      reload();
    } catch {
      toast.error("Erro ao salvar resultado.");
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Topbar */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="font-bold text-lg text-foreground">Growth Lab</h1>
        <span className="text-xs text-muted-foreground">Experimentos semanais · ICE Score</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Week selector */}
          {weeks.length > 0 && (
            <select
              value={activeWeekId ?? ""}
              onChange={(e) => setActiveWeekId(e.target.value)}
              className="border border-input bg-background rounded-md px-3 py-1.5 text-xs focus:outline-none"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>{weekLabel(w.week)}</option>
              ))}
            </select>
          )}
          {activeWeek && (
            <button onClick={openEditWeek} className="flex items-center gap-1 text-xs border border-input rounded-md px-2.5 py-1.5 hover:bg-muted">
              <Edit2 className="h-3 w-3" /> Editar semana
            </button>
          )}
          <button onClick={openNewWeek} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Nova semana
          </button>
        </div>
      </div>

      {/* No week state */}
      {weeks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Target className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma semana ainda.</p>
          <button onClick={openNewWeek} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Criar primeira semana
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* North Star banner */}
          {activeWeek && (
            <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Métrica Estrela</span>
                    <span className="text-xs text-muted-foreground">· {weekLabel(activeWeek.week)}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground truncate">{activeWeek.northStar}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground font-medium shrink-0">
                      {activeWeek.current} / {activeWeek.target} {activeWeek.metric} ({progress}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-center shrink-0">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{weekExps.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">experimentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{weekExps.filter((e) => e.status === "running").length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">rodando</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{weekExps.filter((e) => e.status === "done").length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">concluídos</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Board */}
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 h-full min-w-max">
              {STATUS_COLS.map((col) => {
                const colExps = weekExps
                  .filter((e) => e.status === col.status)
                  .sort((a, b) => b.iceScore - a.iceScore);
                const ColIcon = col.icon;
                return (
                  <div key={col.status} className={`w-72 flex flex-col rounded-xl border-2 ${col.color} bg-card`}>
                    {/* Column header */}
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                      <ColIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm text-foreground">{col.label}</span>
                      <span className="ml-auto text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{colExps.length}</span>
                      {col.status === "backlog" && (
                        <button
                          onClick={openNewExp}
                          disabled={!activeWeek}
                          className="p-1 rounded-md hover:bg-muted disabled:opacity-40"
                          title="Novo experimento"
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {colExps.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground/50 py-8">Vazio</div>
                      )}
                      {colExps.map((exp) => (
                        <div key={exp.id} className="bg-background border border-border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow">
                          {/* ICE + category */}
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold border rounded-md px-2 py-0.5 ${iceColor(exp.iceScore)}`}>
                              ICE {exp.iceScore.toFixed(1)}
                            </span>
                            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${CATEGORY_COLORS[exp.category]}`}>
                              {CATEGORY_LABELS[exp.category]}
                            </span>
                          </div>

                          {/* Hypothesis */}
                          <p className="text-xs text-foreground leading-relaxed line-clamp-3">{exp.hypothesis}</p>

                          {/* Owner */}
                          {exp.owner && (
                            <div className="text-[10px] text-muted-foreground">👤 {exp.owner}</div>
                          )}

                          {/* Result/learnings (if done) */}
                          {(exp.result || exp.learnings) && (
                            <div className="border-t border-border pt-2 space-y-1">
                              {exp.result && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                  <span className="font-semibold">Resultado:</span> {exp.result}
                                </p>
                              )}
                              {exp.learnings && (
                                <p className="text-[10px] text-muted-foreground">
                                  <span className="font-semibold">Aprendizado:</span> {exp.learnings}
                                </p>
                              )}
                            </div>
                          )}

                          {/* ICE breakdown */}
                          <div className="flex gap-2 text-[10px] text-muted-foreground">
                            <span>I:{exp.impact}</span>
                            <span>C:{exp.confidence}</span>
                            <span>E:{exp.ease}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 pt-1 border-t border-border flex-wrap">
                            <button onClick={() => openEditExp(exp)} className="text-[10px] px-2 py-1 border border-input rounded hover:bg-muted">
                              Editar
                            </button>
                            {exp.status === "backlog" && (
                              <button onClick={() => moveStatus(exp, "running")} className="text-[10px] px-2 py-1 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                Iniciar
                              </button>
                            )}
                            {exp.status === "running" && (
                              <>
                                <button
                                  onClick={() => { setShowResultModal(exp); setRResult(exp.result ?? ""); setRLearnings(exp.learnings ?? ""); }}
                                  className="text-[10px] px-2 py-1 border border-emerald-300 text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                >
                                  Concluir
                                </button>
                                <button onClick={() => moveStatus(exp, "killed")} className="text-[10px] px-2 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                  Cancelar
                                </button>
                              </>
                            )}
                            {(exp.status === "done" || exp.status === "killed") && (
                              <button onClick={() => moveStatus(exp, "backlog")} className="text-[10px] px-2 py-1 border border-input rounded hover:bg-muted">
                                ↩ Backlog
                              </button>
                            )}
                            <button onClick={() => deleteExp(exp.id)} className="text-[10px] px-2 py-1 text-red-400 hover:text-red-600 ml-auto">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Semana ───────────────────────────────────── */}
      {showWeekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {editingWeek ? "Editar semana" : "Nova semana"}
              </h2>
              <button onClick={() => setShowWeekModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Objetivo da semana (North Star)</label>
                <textarea
                  value={wNorthStar}
                  onChange={(e) => setWNorthStar(e.target.value)}
                  rows={2}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Ex: Fechar 5 reuniões com decisores de TI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome da métrica</label>
                <input
                  type="text"
                  value={wMetric}
                  onChange={(e) => setWMetric(e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  placeholder="Ex: Reuniões agendadas"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Meta</label>
                  <input
                    type="number" min={0}
                    value={wTarget}
                    onChange={(e) => setWTarget(Number(e.target.value))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Atual</label>
                  <input
                    type="number" min={0}
                    value={wCurrent}
                    onChange={(e) => setWCurrent(Number(e.target.value))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowWeekModal(false)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={saveWeek} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Experimento ──────────────────────────────── */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {editingExp ? "Editar experimento" : "Novo experimento"}
              </h2>
              <button onClick={() => setShowExpModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Hipótese</label>
                <textarea
                  value={eHypothesis}
                  onChange={(e) => setEHypothesis(e.target.value)}
                  rows={3}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Se eu fizer X, então Y vai acontecer, porque Z"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Categoria (AARRR)</label>
                  <select
                    value={eCategory}
                    onChange={(e) => setECategory(e.target.value as GrowthCategory)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Responsável</label>
                  <input
                    type="text"
                    value={eOwner}
                    onChange={(e) => setEOwner(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                    placeholder="Nome"
                  />
                </div>
              </div>

              {/* ICE */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">ICE Score</span>
                  <span className={`text-sm font-bold border rounded-md px-2.5 py-0.5 ${iceColor(Math.round(((eImpact + eConfidence + eEase) / 3) * 10) / 10)}`}>
                    {(Math.round(((eImpact + eConfidence + eEase) / 3) * 10) / 10).toFixed(1)}
                  </span>
                </div>
                <IceSlider label="Impacto (I)"     value={eImpact}     onChange={setEImpact} />
                <IceSlider label="Confiança (C)"   value={eConfidence} onChange={setEConfidence} />
                <IceSlider label="Facilidade (E)"  value={eEase}       onChange={setEEase} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowExpModal(false)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={saveExp} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Resultado ────────────────────────────────── */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                Registrar resultado
              </h2>
              <button onClick={() => setShowResultModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-muted-foreground italic">{showResultModal.hypothesis}</p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Resultado</label>
                <textarea
                  value={rResult}
                  onChange={(e) => setRResult(e.target.value)}
                  rows={2}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                  placeholder="O que aconteceu? Números, dados..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Aprendizado</label>
                <textarea
                  value={rLearnings}
                  onChange={(e) => setRLearnings(e.target.value)}
                  rows={2}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                  placeholder="O que aprendemos? O que fazer diferente?"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowResultModal(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={saveResult} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Concluir experimento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
