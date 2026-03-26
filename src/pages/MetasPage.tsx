import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target, TrendingUp, Calendar, Users, Video,
  ChevronDown, ChevronUp, Edit3, Check, AlertTriangle,
  Zap, FlaskConical, Plus, Trash2, Clock, Loader2,
} from "lucide-react";
import {
  SprintConfigDB, SprintProgressDB, DailyLogDB, ConversionStageDB,
  type DailyLogRow, type ConversionStageRow,
} from "@/lib/db";
import { toast } from "sonner";

// ── Brazilian holidays 2026 ───────────────────────────────────
const BR_HOLIDAYS_2026 = new Set([
  "2026-01-01","2026-02-16","2026-02-17","2026-02-18",
  "2026-04-03","2026-04-21","2026-05-01","2026-06-04",
  "2026-09-07","2026-10-12","2026-11-02","2026-11-15","2026-12-25",
]);
const DAY_ABBR = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isBusinessDay(d: Date) {
  const day = d.getDay();
  return day !== 0 && day !== 6 && !BR_HOLIDAYS_2026.has(toISO(d));
}
function businessDaysUntil(dateStr: string) {
  const end = new Date(dateStr + "T00:00:00");
  const cur = new Date(); cur.setHours(0,0,0,0);
  let count = 0; const it = new Date(cur);
  while (it < end) { if (isBusinessDay(it)) count++; it.setDate(it.getDate()+1); }
  return count;
}
function businessDaysBetween(startStr: string, endExclStr: string) {
  const start = new Date(startStr + "T00:00:00");
  const end   = new Date(endExclStr + "T00:00:00");
  let count = 0; const it = new Date(start);
  while (it < end) { if (isBusinessDay(it)) count++; it.setDate(it.getDate()+1); }
  return count;
}
function sprintBusinessDays(startStr: string, endStr: string): Date[] {
  const days: Date[] = [];
  const end = new Date(endStr + "T00:00:00");
  const it  = new Date(startStr + "T00:00:00");
  while (it <= end) {
    if (isBusinessDay(it)) days.push(new Date(it));
    it.setDate(it.getDate()+1);
  }
  return days;
}
function daysUntil(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(0, Math.round((d.getTime() - now.getTime()) / 86400000));
}
const weekOfMonth = (d: Date) => Math.ceil(d.getDate()/7);

// ── Default values ────────────────────────────────────────────
const DEFAULT_CONFIG = {
  startDate:"", endDate:"",
  revenueGoal:0, avgTicket:0,
  rateReunToSale:0, rateProspToReun:0, targetCompanies:0,
};
const DEFAULT_STAGES: Omit<ConversionStageRow,"id"|"createdAt">[] = [
  { name:"Contato inicial",        currentRate:0, targetRate:80, avgDays:1, sortOrder:0 },
  { name:"Resposta / Engajamento", currentRate:0, targetRate:30, avgDays:3, sortOrder:1 },
  { name:"Reunião agendada",       currentRate:0, targetRate:50, avgDays:5, sortOrder:2 },
  { name:"Show (comparecimento)",  currentRate:0, targetRate:80, avgDays:0, sortOrder:3 },
  { name:"Proposta enviada",       currentRate:0, targetRate:90, avgDays:3, sortOrder:4 },
  { name:"Fechamento",             currentRate:0, targetRate:30, avgDays:7, sortOrder:5 },
];

// ── Helpers ───────────────────────────────────────────────────
const fmt  = (n:number) => n.toLocaleString("pt-BR",{maximumFractionDigits:0});
const fmtR = (n:number) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});

// ── NumInput ─────────────────────────────────────────────────
function NumInput({ label, value, onChange, prefix="", suffix="", min=0, max=9999999, small=false }:{
  label?:string; value:number; onChange:(v:number)=>void;
  prefix?:string; suffix?:string; min?:number; max?:number; small?:boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));
  useEffect(()=>{ if(!editing) setRaw(String(value)); },[value,editing]);
  const commit = () => {
    const n = parseFloat(raw.replace(",","."));
    if(!isNaN(n)) onChange(Math.min(max,Math.max(min,n)));
    setEditing(false);
  };
  const sz = small?"text-xs":"text-sm";
  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-[11px] text-[#91918e] uppercase tracking-wide">{label}</span>}
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className={`${sz} text-[#37352f] dark:text-[#e8e8e5]`}>{prefix}</span>}
          <input autoFocus type="number" value={raw}
            onChange={e=>setRaw(e.target.value)} onBlur={commit}
            onKeyDown={e=>e.key==="Enter"&&commit()}
            className={`w-16 bg-transparent border-b border-[#37352f] dark:border-[#e8e8e5] ${sz} text-[#37352f] dark:text-[#e8e8e5] focus:outline-none`}/>
          {suffix && <span className={`${sz} text-[#37352f] dark:text-[#e8e8e5]`}>{suffix}</span>}
          <button onClick={commit}><Check className="h-3 w-3 text-green-600"/></button>
        </div>
      ):(
        <button onClick={()=>{setRaw(String(value));setEditing(true);}}
          className={`flex items-center gap-1 ${sz} font-semibold text-[#37352f] dark:text-[#e8e8e5] hover:opacity-60 transition-opacity text-left`}>
          {prefix}{prefix==="R$ "?fmt(value):value}{suffix}
          <Edit3 className="h-2.5 w-2.5 opacity-20"/>
        </button>
      )}
    </div>
  );
}

function Bar({value,max,color="bg-blue-500",h="h-1.5"}:{value:number;max:number;color?:string;h?:string}){
  const pct = max>0?Math.min(100,(value/max)*100):0;
  return (
    <div className={`w-full ${h} rounded-full bg-[#e9e9e7] dark:bg-[#2f2f2f] overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{width:`${pct}%`}}/>
    </div>
  );
}

function StatCard({title,subtitle,value,goal,color,icon:Icon,unit=""}:{
  title:string;subtitle:string;value:number;goal:number;color:string;icon:React.ElementType;unit?:string;
}){
  const pct = goal>0?Math.min(100,Math.round((value/goal)*100)):0;
  const ok=pct>=100; const warn=pct>=70&&!ok;
  return (
    <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-[#91918e] uppercase tracking-wide font-medium">{title}</p>
          <p className="text-[11px] text-[#b5b3ae] mt-0.5">{subtitle}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4 text-white"/>
        </div>
      </div>
      <div>
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-bold text-[#37352f] dark:text-[#e8e8e5]">{unit}{fmt(value)}</span>
          <span className={`text-xs font-medium ${ok?"text-green-600":warn?"text-amber-500":"text-[#91918e]"}`}>
            {pct}% · meta {unit}{fmt(goal)}
          </span>
        </div>
        <Bar value={value} max={goal} color={ok?"bg-green-500":warn?"bg-amber-400":"bg-blue-500"}/>
      </div>
    </div>
  );
}

// ── Ritmo Diário (Supabase) ───────────────────────────────────
function RitmoSection({prospDay,reunioesDay,sprintStart,sprintEnd}:{
  prospDay:number; reunioesDay:number; sprintStart:string; sprintEnd:string;
}) {
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayProsp, setTodayProsp] = useState(0);
  const [todayMeet,  setTodayMeet]  = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const today = toISO(new Date());

  const load = async () => {
    try {
      const all = await DailyLogDB.getAll();
      setLogs(all.filter(l=>l.logDate>=sprintStart&&l.logDate<=sprintEnd));
      const todayLog = all.find(l=>l.logDate===today);
      if(todayLog){ setTodayProsp(todayLog.prospected); setTodayMeet(todayLog.meetings); }
    } catch { toast.error("Erro ao carregar logs diários"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[sprintStart,sprintEnd]);

  async function saveToday() {
    setSaving(true);
    try {
      await DailyLogDB.upsertDay(today, todayProsp, todayMeet);
      await load();
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  const allDays = sprintBusinessDays(sprintStart, sprintEnd);
  const bizElapsed  = businessDaysBetween(sprintStart, today);
  const bizTotal    = businessDaysBetween(sprintStart, sprintEnd) + (isBusinessDay(new Date(sprintEnd+"T00:00:00"))?1:0);
  const bizRemaining= businessDaysUntil(sprintEnd);

  const actualProsp = logs.reduce((s,l)=>s+l.prospected,0);
  const actualMeet  = logs.reduce((s,l)=>s+l.meetings,0);
  const expectedProsp = prospDay   * bizElapsed;
  const expectedMeet  = reunioesDay* bizElapsed;
  const deficitProsp  = Math.max(0, expectedProsp - actualProsp);
  const deficitMeet   = Math.max(0, expectedMeet  - actualMeet);
  const recoveryProsp = bizRemaining>0?Math.ceil((prospDay*bizTotal    - actualProsp   )/bizRemaining):0;
  const recoveryMeet  = bizRemaining>0?Math.ceil((reunioesDay*bizTotal - actualMeet    )/bizRemaining):0;
  const onTrack = deficitProsp===0&&deficitMeet===0;

  if(loading) return (
    <div className="flex items-center gap-2 text-[#91918e] text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin"/> Carregando ritmo...
    </div>
  );

  return (
    <div className="space-y-3">
      <h2 className="text-[15px] font-semibold text-[#37352f] dark:text-[#e8e8e5]">Ritmo Diário</h2>

      {/* Deficit / on-track banner */}
      {bizElapsed>0&&(
        <div className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
          onTrack?"bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                 :"bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
        }`}>
          <span className="text-xl shrink-0 mt-0.5">{onTrack?"🟢":"🔴"}</span>
          <div className="flex-1 min-w-0">
            {onTrack?(
              <>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">No ritmo — continue assim!</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Meta de hoje: <strong>{prospDay} prospecções</strong> · <strong>{reunioesDay} reuniões</strong>
                </p>
              </>
            ):(
              <>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Déficit: {deficitProsp>0?`${deficitProsp} prospecções`:""}{deficitProsp>0&&deficitMeet>0?" · ":""}{deficitMeet>0?`${deficitMeet} reuniões`:""}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  <strong>Recuperação:</strong> precisa de <strong>{recoveryProsp} prospecções/dia</strong> e{" "}
                  <strong>{recoveryMeet} reuniões/dia</strong> nos próximos {bizRemaining} dias úteis
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Log today */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#91918e] uppercase tracking-wide mb-3">
          Lançar hoje — {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          {[
            {label:"Prospecções",val:todayProsp,set:setTodayProsp,goal:prospDay},
            {label:"Reuniões",   val:todayMeet, set:setTodayMeet, goal:reunioesDay},
          ].map(f=>(
            <div key={f.label} className="flex-1 min-w-32">
              <label className="text-[11px] text-[#91918e] uppercase tracking-wide">{f.label}</label>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={()=>f.set(Math.max(0,f.val-1))}
                  className="w-7 h-7 rounded-md border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#91918e] hover:bg-[#f1f1ef] flex items-center justify-center text-base">−</button>
                <span className="w-8 text-center text-lg font-bold text-[#37352f] dark:text-[#e8e8e5]">{f.val}</span>
                <button onClick={()=>f.set(f.val+1)}
                  className="w-7 h-7 rounded-md border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#91918e] hover:bg-[#f1f1ef] flex items-center justify-center text-base">+</button>
                <span className={`text-xs ${f.val>=f.goal?"text-green-600":"text-[#91918e]"}`}>
                  meta {f.goal}
                </span>
              </div>
            </div>
          ))}
          <button onClick={saveToday} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saved?"bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                   :"bg-[#37352f] dark:bg-[#e8e8e5] text-white dark:text-[#191919] hover:opacity-80"
            }`}>
            {saving?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:saved?<><Check className="h-3.5 w-3.5"/>Salvo</>:"Salvar dia"}
          </button>
        </div>
      </div>

      {/* All sprint days list */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#f7f6f3] dark:bg-[#252525]">
          <div className="grid grid-cols-[80px_1fr_90px_90px_60px]">
            {["Data","Dia","Prospecções","Reuniões","Status"].map(h=>(
              <span key={h} className="text-[10px] text-[#91918e] uppercase tracking-wide font-medium">{h}</span>
            ))}
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#e9e9e7] dark:divide-[#2f2f2f]">
          {allDays.map(d=>{
            const iso = toISO(d);
            const isToday = iso===today;
            const isPast  = iso<today;
            const log = logs.find(l=>l.logDate===iso);
            const hP = log?log.prospected>=prospDay:false;
            const hM = log?log.meetings>=reunioesDay:false;
            const hit = hP&&hM; const partial = (hP||hM)&&!hit;
            const isFuture = iso>today;

            return (
              <div key={iso} className={`grid grid-cols-[80px_1fr_90px_90px_60px] px-4 py-2.5 items-center text-sm ${
                isToday?"bg-blue-50/60 dark:bg-blue-900/10 font-medium":
                isPast&&log&&!hit?"bg-red-50/30 dark:bg-red-900/5":""
              }`}>
                <span className={`text-xs font-mono ${isToday?"text-blue-600":"text-[#91918e]"}`}>
                  {d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
                </span>
                <span className={`text-sm ${isToday?"text-blue-700 dark:text-blue-400 font-semibold":"text-[#5f5e5b] dark:text-[#8b8985]"}`}>
                  {DAY_ABBR[d.getDay()]}
                  {isToday&&<span className="ml-1.5 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">hoje</span>}
                </span>
                <span className={`text-sm font-medium ${
                  isFuture?"text-[#b5b3ae]":hP?"text-green-600":"text-red-400"
                }`}>
                  {isFuture?`— meta ${prospDay}`:log?`${log.prospected} / ${prospDay}`:`0 / ${prospDay}`}
                </span>
                <span className={`text-sm font-medium ${
                  isFuture?"text-[#b5b3ae]":hM?"text-green-600":"text-red-400"
                }`}>
                  {isFuture?`— meta ${reunioesDay}`:log?`${log.meetings} / ${reunioesDay}`:`0 / ${reunioesDay}`}
                </span>
                <span className="text-base">
                  {isFuture?"·":hit?"✅":partial?"🟡":log?"❌":"⚪"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#e9e9e7] dark:border-[#2f2f2f] flex gap-4 text-[10px] text-[#91918e]">
          <span>✅ meta batida</span><span>🟡 parcial</span><span>❌ déficit</span><span>⚪ sem dados</span>
          <span className="ml-auto">{allDays.length} dias úteis no sprint</span>
        </div>
      </div>
    </div>
  );
}

// ── Funnel Section (Supabase) ─────────────────────────────────
function FunnelSection() {
  const navigate = useNavigate();
  const [stages,  setStages]  = useState<ConversionStageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<string|null>(null);
  const [nameRaw, setNameRaw] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const load = async () => {
    try {
      let data = await ConversionStageDB.getAll();
      if(data.length===0){
        await ConversionStageDB.replaceAll(DEFAULT_STAGES);
        data = await ConversionStageDB.getAll();
      }
      setStages(data);
    } catch { toast.error("Erro ao carregar funil"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const patchStage = async (id:string, p:Partial<ConversionStageRow>) => {
    setStages(prev=>prev.map(s=>s.id===id?{...s,...p}:s));
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async()=>{
      try { await ConversionStageDB.patch(id,p); }
      catch { toast.error("Erro ao salvar etapa"); }
    },800);
  };

  const addStage = async () => {
    try {
      const newStage = await ConversionStageDB.save({
        name:"Nova etapa",currentRate:0,targetRate:50,avgDays:3,sortOrder:stages.length,
      });
      await load();
      setEditingName(newStage.id); setNameRaw("Nova etapa");
    } catch { toast.error("Erro ao criar etapa"); }
  };

  const removeStage = async (id:string) => {
    setStages(prev=>prev.filter(s=>s.id!==id));
    try { await ConversionStageDB.remove(id); }
    catch { toast.error("Erro ao remover etapa"); load(); }
  };

  const analyzed = useMemo(()=>{
    const finalConv = stages.reduce((acc,s)=>acc*(s.currentRate/100),1);
    return stages.map(s=>{
      const gap = s.targetRate-s.currentRate;
      const improvedConv = stages.reduce((acc,st)=>acc*((st.id===s.id?s.targetRate:st.currentRate)/100),1);
      const impact = finalConv>0?Math.round(((improvedConv-finalConv)/finalConv)*100):0;
      return {...s,gap,impact};
    });
  },[stages]);

  const bottleneck = analyzed.filter(s=>s.gap>0&&s.currentRate>0).sort((a,b)=>b.impact-a.impact)[0]??null;
  const totalCycleDays = stages.reduce((acc,s)=>acc+s.avgDays,0);
  const targetCycleDays = stages.reduce((acc,s)=>acc+Math.max(0,s.avgDays-1),0);

  if(loading) return (
    <div className="flex items-center gap-2 text-[#91918e] text-sm py-4">
      <Loader2 className="h-4 w-4 animate-spin"/> Carregando funil...
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#37352f] dark:text-[#e8e8e5]">Funil de Conversão</h2>
          <p className="text-xs text-[#91918e] mt-0.5">Taxas mutáveis — atualize mensalmente conforme o histórico evoluir</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#91918e] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1f1f1f]">
            <Clock className="h-3 w-3"/>
            Ciclo: <strong className="text-[#37352f] dark:text-[#e8e8e5] ml-1">{totalCycleDays}d</strong>
            &nbsp;→ meta: <strong className="text-green-600">{targetCycleDays}d</strong>
          </div>
          <button onClick={addStage}
            className="flex items-center gap-1 text-xs text-[#91918e] hover:text-[#37352f] dark:hover:text-[#e8e8e5] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1f1f1f] hover:border-[#b5b3ae] transition-colors">
            <Plus className="h-3 w-3"/> Etapa
          </button>
        </div>
      </div>

      {bottleneck&&(
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Gargalo: <strong>{bottleneck.name}</strong>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Taxa atual {bottleneck.currentRate}% vs meta {bottleneck.targetRate}% · melhorar aumentaria a conversão final em ~{bottleneck.impact}%
            </p>
          </div>
          <button onClick={()=>{
            localStorage.setItem("pipa_growth_suggest",JSON.stringify({
              title:`Melhorar ${bottleneck.name}`,
              hypothesis:`Aumentar taxa de ${bottleneck.name} de ${bottleneck.currentRate}% para ${bottleneck.targetRate}%`,
              category:"Activation",
            }));
            navigate("/growth-lab");
          }}
            className="flex items-center gap-1.5 shrink-0 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors">
            <FlaskConical className="h-3 w-3"/> Criar experimento
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_70px_110px_32px] gap-x-3 px-4 py-2 border-b border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#f7f6f3] dark:bg-[#252525]">
          {["Etapa","Real atual","Meta","Dias médios","Oportunidade",""].map(h=>(
            <span key={h} className="text-[10px] text-[#91918e] uppercase tracking-wide font-medium">{h}</span>
          ))}
        </div>
        {analyzed.map((s,idx)=>{
          const isBottleneck = bottleneck?.id===s.id;
          const noData = s.currentRate===0;
          const barColor = noData?"bg-[#d3d3d0]":s.currentRate>=s.targetRate?"bg-green-400":s.gap>15?"bg-red-400":"bg-amber-400";
          return (
            <div key={s.id} className={`grid grid-cols-[1fr_90px_90px_70px_110px_32px] gap-x-3 px-4 py-3 items-center border-b border-[#e9e9e7] dark:border-[#2f2f2f] last:border-b-0 transition-colors ${
              isBottleneck?"bg-amber-50/50 dark:bg-amber-900/5":"hover:bg-[#f7f6f3] dark:hover:bg-[#252525]"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-[#b5b3ae] w-4 shrink-0">{idx+1}</span>
                {editingName===s.id?(
                  <input autoFocus value={nameRaw} onChange={e=>setNameRaw(e.target.value)}
                    onBlur={()=>{patchStage(s.id,{name:nameRaw||s.name});setEditingName(null);}}
                    onKeyDown={e=>{if(e.key==="Enter"){patchStage(s.id,{name:nameRaw||s.name});setEditingName(null);}}}
                    className="flex-1 bg-transparent border-b border-[#37352f] dark:border-[#e8e8e5] text-sm text-[#37352f] dark:text-[#e8e8e5] focus:outline-none"/>
                ):(
                  <button onClick={()=>{setEditingName(s.id);setNameRaw(s.name);}}
                    className="text-sm text-[#37352f] dark:text-[#e8e8e5] hover:opacity-60 text-left truncate">
                    {s.name}
                    {isBottleneck&&<span className="ml-1.5 text-[10px] font-medium text-amber-500 bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">gargalo</span>}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <NumInput value={s.currentRate} onChange={v=>patchStage(s.id,{currentRate:v})} suffix="%" max={100} small/>
                <Bar value={s.currentRate} max={s.targetRate>0?s.targetRate:100} color={barColor}/>
              </div>
              <NumInput value={s.targetRate} onChange={v=>patchStage(s.id,{targetRate:v})} suffix="%" max={100} small/>
              <NumInput value={s.avgDays}    onChange={v=>patchStage(s.id,{avgDays:v})}    suffix="d" max={365} small/>
              <div>
                {s.currentRate>0&&s.gap>0?(
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 rounded-full ${s.gap>20?"bg-red-400":s.gap>10?"bg-amber-400":"bg-yellow-300"}`}
                      style={{width:`${Math.min(100,s.gap*2)}px`}}/>
                    <span className={`text-xs font-medium ${s.gap>20?"text-red-500":s.gap>10?"text-amber-500":"text-yellow-600"}`}>
                      +{s.impact}%
                    </span>
                  </div>
                ):s.currentRate===0?(
                  <span className="text-[10px] text-[#b5b3ae]">sem dados</span>
                ):(
                  <span className="text-[10px] text-green-500">✓ na meta</span>
                )}
              </div>
              <button onClick={()=>removeStage(s.id)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-[#c7c6c2] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <Trash2 className="h-3 w-3"/>
              </button>
            </div>
          );
        })}
      </div>

      {stages.some(s=>s.currentRate>0)&&(
        <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl">
          <div className="flex-1">
            <p className="text-xs text-[#91918e] uppercase tracking-wide">Conversão final (ponta a ponta)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#37352f] dark:text-[#e8e8e5]">
                {(analyzed.reduce((acc,s)=>acc*(s.currentRate/100),1)*100).toFixed(2)}%
              </span>
              <span className="text-xs text-[#91918e]">atual</span>
              <span className="text-[#b5b3ae] mx-1">→</span>
              <span className="text-xl font-bold text-green-600">
                {(analyzed.reduce((acc,s)=>acc*(s.targetRate/100),1)*100).toFixed(2)}%
              </span>
              <span className="text-xs text-[#91918e]">meta</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#91918e]">Ciclo de conversão</p>
            <p className="text-lg font-bold text-[#37352f] dark:text-[#e8e8e5]">{totalCycleDays} dias</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page (Supabase) ──────────────────────────────────────
export default function MetasPage() {
  const [sprintId,  setSprintId]  = useState<string|null>(null);
  const [config,    setConfig]    = useState(DEFAULT_CONFIG);
  const [progress,  setProgress]  = useState({revenueClosed:0,forecastValue:0,prospectedTotal:0,reunioesTotal:0});
  const [loading,   setLoading]   = useState(true);
  const [showConfig,setShowConfig]= useState(false);
  const saveConfigTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const now = new Date();

  const load = async () => {
    try {
      let sprint = await SprintConfigDB.getActive();
      if(!sprint){
        sprint = await SprintConfigDB.upsert({...DEFAULT_CONFIG,active:true});
      }
      setSprintId(sprint.id);
      setConfig({
        startDate:sprint.startDate, endDate:sprint.endDate,
        revenueGoal:sprint.revenueGoal, avgTicket:sprint.avgTicket,
        rateReunToSale:sprint.rateReunToSale, rateProspToReun:sprint.rateProspToReun,
        targetCompanies:sprint.targetCompanies,
      });
      const prog = await SprintProgressDB.get(sprint.id);
      if(prog){
        setProgress({revenueClosed:prog.revenueClosed,forecastValue:prog.forecastValue,
          prospectedTotal:prog.prospectedTotal,reunioesTotal:prog.reunioesTotal});
      }
    } catch(e){ toast.error("Erro ao carregar configuração do sprint"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const patchConfig = (patch:Partial<typeof config>) => {
    const updated = {...config,...patch};
    setConfig(updated);
    if(saveConfigTimer.current) clearTimeout(saveConfigTimer.current);
    saveConfigTimer.current = setTimeout(async()=>{
      if(!sprintId) return;
      try { await SprintConfigDB.patch(sprintId, patch); }
      catch { toast.error("Erro ao salvar configuração"); }
    },800);
  };

  const patchProgress = async (patch:Partial<typeof progress>) => {
    const updated = {...progress,...patch};
    setProgress(updated);
    if(!sprintId) return;
    try { await SprintProgressDB.upsert(sprintId,{
      revenueClosed:updated.revenueClosed, forecastValue:updated.forecastValue,
      prospectedTotal:updated.prospectedTotal, reunioesTotal:updated.reunioesTotal,
    }); }
    catch { toast.error("Erro ao salvar progresso"); }
  };

  const totalDays = daysUntil(config.endDate);
  const bizDays   = businessDaysUntil(config.endDate);
  const bizWeeks  = Math.ceil(bizDays/5);
  const currentWeek = weekOfMonth(now);

  const {salesNeeded,reunioesNeeded,prospNeeded,reunioesMeta,reunioesDay,
         prospMeta,prospDay,projectedRevenue,onTrack} = useMemo(()=>{
    const salesNeeded    = Math.ceil(config.revenueGoal/config.avgTicket);
    const reunioesNeeded = Math.ceil(salesNeeded/(config.rateReunToSale/100));
    const prospNeeded    = Math.ceil(reunioesNeeded/(config.rateProspToReun/100));
    const reunioesMeta   = Math.ceil(reunioesNeeded/Math.max(1,bizWeeks));
    const reunioesDay    = Math.ceil(reunioesNeeded/Math.max(1,bizDays));
    const prospMeta      = Math.ceil(prospNeeded/Math.max(1,bizWeeks));
    const prospDay       = Math.ceil(prospNeeded/Math.max(1,bizDays));
    const start  = new Date(config.startDate);
    const end    = new Date(config.endDate);
    const totalSprintDays = Math.round((end.getTime()-start.getTime())/86400000);
    const elapsed = Math.max(1,Math.round((now.getTime()-start.getTime())/86400000));
    const projectedRevenue = (progress.revenueClosed/elapsed)*totalSprintDays;
    const onTrack = projectedRevenue>=config.revenueGoal*0.8;
    return {salesNeeded,reunioesNeeded,prospNeeded,reunioesMeta,reunioesDay,prospMeta,prospDay,projectedRevenue,onTrack};
  },[config,bizDays,bizWeeks,progress]);

  const revenuePct  = Math.min(100,Math.round((progress.revenueClosed/config.revenueGoal)*100));
  const forecastPct = Math.min(100,Math.round(((progress.revenueClosed+progress.forecastValue)/config.revenueGoal)*100));

  if(loading) return (
    <div className="flex-1 flex items-center justify-center text-[#91918e] gap-2">
      <Loader2 className="h-5 w-5 animate-spin"/> Carregando metas...
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f6f3] dark:bg-[#191919] min-h-full">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#37352f] dark:text-[#e8e8e5] tracking-tight">Metas do Sprint</h1>
            <p className="text-sm text-[#91918e] mt-0.5">
              {new Date(config.startDate).toLocaleDateString("pt-BR")} → {new Date(config.endDate).toLocaleDateString("pt-BR")}
              &nbsp;·&nbsp;<strong>{totalDays}</strong> dias restantes
              &nbsp;·&nbsp;<strong>{bizDays}</strong> dias úteis
            </p>
          </div>
          <button onClick={()=>setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 text-sm text-[#91918e] hover:text-[#37352f] dark:hover:text-[#e8e8e5] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-lg px-3 py-1.5 bg-white dark:bg-[#1f1f1f] hover:border-[#b5b3ae] transition-colors">
            <Edit3 className="h-3.5 w-3.5"/>
            Configurar
            {showConfig?<ChevronUp className="h-3.5 w-3.5"/>:<ChevronDown className="h-3.5 w-3.5"/>}
          </button>
        </div>

        {/* Config panel */}
        {showConfig&&(
          <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-5">
            <p className="text-xs font-semibold text-[#91918e] uppercase tracking-wide mb-4">Configurações do Sprint</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-[#91918e] uppercase tracking-wide">Data início</span>
                <input type="date" value={config.startDate} onChange={e=>patchConfig({startDate:e.target.value})}
                  className="text-sm text-[#37352f] dark:text-[#e8e8e5] bg-transparent border-b border-[#e9e9e7] dark:border-[#2f2f2f] focus:outline-none"/>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-[#91918e] uppercase tracking-wide">Data fim</span>
                <input type="date" value={config.endDate} onChange={e=>patchConfig({endDate:e.target.value})}
                  className="text-sm text-[#37352f] dark:text-[#e8e8e5] bg-transparent border-b border-[#e9e9e7] dark:border-[#2f2f2f] focus:outline-none"/>
              </div>
              <NumInput label="Meta de receita" value={config.revenueGoal} onChange={v=>patchConfig({revenueGoal:v})} prefix="R$ "/>
              <NumInput label="Ticket médio"     value={config.avgTicket}   onChange={v=>patchConfig({avgTicket:v})}   prefix="R$ "/>
              <NumInput label="Taxa reunião → venda"     value={config.rateReunToSale}  onChange={v=>patchConfig({rateReunToSale:v})}  suffix="%" max={100}/>
              <NumInput label="Taxa prospecção → reunião" value={config.rateProspToReun} onChange={v=>patchConfig({rateProspToReun:v})} suffix="%" max={100}/>
              <NumInput label="Universo de empresas" value={config.targetCompanies} onChange={v=>patchConfig({targetCompanies:v})}/>
            </div>
          </div>
        )}

        {/* Revenue goal */}
        <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#91918e]"/>
              <span className="text-sm font-semibold text-[#37352f] dark:text-[#e8e8e5]">Meta de Receita</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              onTrack?"bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                     :"bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            }`}>
              {onTrack?<Zap className="h-3 w-3"/>:<AlertTriangle className="h-3 w-3"/>}
              {onTrack?"No ritmo":"Abaixo do ritmo"}
            </div>
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold text-[#37352f] dark:text-[#e8e8e5]">{fmtR(progress.revenueClosed)}</p>
              <p className="text-xs text-[#91918e] mt-0.5">de {fmtR(config.revenueGoal)} · {salesNeeded} vendas necessárias</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#37352f] dark:text-[#e8e8e5]">{revenuePct}%</p>
              <p className="text-xs text-[#91918e]">fechado</p>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#e9e9e7] dark:bg-[#2f2f2f] overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{width:`${forecastPct}%`,opacity:0.3}}/>
            <div className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{width:`${revenuePct}%`}}/>
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-[#91918e]">
            <span>🔵 Fechado&nbsp;·&nbsp;░ Forecast {fmtR(progress.forecastValue)}</span>
            <span>Projeção: {fmtR(projectedRevenue)}</span>
          </div>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:"Vendas necessárias",       value:salesNeeded,    sub:`ticket médio ${fmtR(config.avgTicket)}`},
            {label:"Reuniões necessárias",      value:reunioesNeeded, sub:`taxa ${config.rateReunToSale}% fechamento`},
            {label:"Prospecções necessárias",   value:prospNeeded,    sub:`taxa ${config.rateProspToReun}% p/ reunião`},
          ].map(c=>(
            <div key={c.label} className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-4 text-center">
              <p className="text-[11px] text-[#91918e] uppercase tracking-wide mb-1">{c.label}</p>
              <p className="text-3xl font-bold text-[#37352f] dark:text-[#e8e8e5]">{c.value}</p>
              <p className="text-xs text-[#b5b3ae] mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e9e9e7] dark:border-[#2f2f2f]">
            <p className="text-sm font-semibold text-[#37352f] dark:text-[#e8e8e5]">Breakdown por período</p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-[#e9e9e7] dark:divide-[#2f2f2f]">
            {[
              {label:"Sprint total",        prosp:prospNeeded, reun:reunioesNeeded},
              {label:"Por semana",          prosp:prospMeta,   reun:reunioesMeta},
              {label:"Por dia útil",        prosp:prospDay,    reun:reunioesDay},
              {label:`Semana ${currentWeek}`,prosp:prospMeta,  reun:reunioesMeta},
            ].map(col=>(
              <div key={col.label} className="px-4 py-4 text-center">
                <p className="text-[11px] text-[#91918e] uppercase tracking-wide mb-3">{col.label}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xl font-bold text-[#37352f] dark:text-[#e8e8e5]">{col.prosp}</p>
                    <p className="text-[10px] text-[#b5b3ae]">prospecções</p>
                  </div>
                  <div className="w-8 h-px bg-[#e9e9e7] dark:bg-[#2f2f2f] mx-auto"/>
                  <div>
                    <p className="text-xl font-bold text-[#37352f] dark:text-[#e8e8e5]">{col.reun}</p>
                    <p className="text-[10px] text-[#b5b3ae]">reuniões</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ritmo diário */}
        <RitmoSection prospDay={prospDay} reunioesDay={reunioesDay}
          sprintStart={config.startDate} sprintEnd={config.endDate}/>

        {/* Funil */}
        <FunnelSection/>

        {/* Progress cards */}
        <div>
          <p className="text-sm font-semibold text-[#37352f] dark:text-[#e8e8e5] mb-3">Progresso Acumulado</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Receita fechada" subtitle="no sprint"
              value={progress.revenueClosed} goal={config.revenueGoal} color="bg-blue-500" icon={TrendingUp} unit="R$ "/>
            <StatCard title="Forecast" subtitle="pipeline qualificado"
              value={progress.revenueClosed+progress.forecastValue} goal={config.revenueGoal} color="bg-purple-500" icon={Target} unit="R$ "/>
            <StatCard title="Empresas prospectadas" subtitle="no sprint"
              value={progress.prospectedTotal} goal={prospNeeded} color="bg-orange-400" icon={Users}/>
            <StatCard title="Reuniões realizadas" subtitle="no sprint"
              value={progress.reunioesTotal} goal={reunioesNeeded} color="bg-green-500" icon={Video}/>
          </div>
        </div>

        {/* Manual update */}
        <div className="bg-white dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[#91918e]"/>
            <p className="text-sm font-semibold text-[#37352f] dark:text-[#e8e8e5]">Atualizar progresso acumulado</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumInput label="Receita fechada (R$)" value={progress.revenueClosed}
              onChange={v=>patchProgress({revenueClosed:v})} prefix="R$ "/>
            <NumInput label="Forecast (R$)" value={progress.forecastValue}
              onChange={v=>patchProgress({forecastValue:v})} prefix="R$ "/>
            <NumInput label="Empresas prospectadas" value={progress.prospectedTotal}
              onChange={v=>patchProgress({prospectedTotal:v})}/>
            <NumInput label="Reuniões realizadas" value={progress.reunioesTotal}
              onChange={v=>patchProgress({reunioesTotal:v})}/>
          </div>
        </div>

      </div>
    </div>
  );
}
