import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Home, MapPin, GraduationCap, Plane, Download, Plus, Trash2, Check, ChevronLeft, RefreshCw, CloudOff, Activity } from "lucide-react";

// =====================================================================
//  CONFIGURACAO DO BANCO DE DADOS (Supabase)
//  Cole abaixo os 2 valores que o Supabase te da (Settings -> API):
// =====================================================================
const SUPABASE_URL = "https://qxfsqgjifmdiyboqrsoh.supabase.co";       // ex: https://abcdxyz.supabase.co
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZnNxZ2ppZm1kaXlib3Fyc29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjY0MDAsImV4cCI6MjA5NjYwMjQwMH0.Yfp8bbErdSAgISxlql1KSaKrIYg8Dy7cYbETEXMcFtY";     // a chave "anon public"
// =====================================================================

const SUPA_OK = SUPABASE_URL.startsWith("http") && SUPABASE_KEY.length > 20;

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: options.method === "POST" ? "return=representation" : "",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const db = {
  list: (table) => supaFetch(`${table}?select=*&order=created_at.desc`),
  insert: (table, row) => supaFetch(table, { method: "POST", body: JSON.stringify(row) }),
  remove: (table, id) => supaFetch(`${table}?id=eq.${id}`, { method: "DELETE" }),
  update: (table, id, patch) => supaFetch(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } }),
};

const VENDEDORES = ["Charlene Pinheiro Alves", "Ednalda De Oliveira Mouta Sabi", "Fernando Cordeiro", "Natalia Ataide Sabath", "Paula Simoes"];
const MEDICOS = ["Aldo S Calaca Costa","Alexandre Mio Pos","Amanda Ambrosio Da Silva","Andre Meireles Borba","Antenor Vieira De Araujo Junio","Antonio Jorge B De Oliveira","Arnaud Macedo Oliveira Filho","Arnon Castro Alves Filho","Arthur Bernardo G Fernandes","Bruno Da Silva Moreira","Carlos Eduardo D P M Ontiveros","Carlos Eduardo De Queiroz","Cleyverton Garcia Lima","Cristiano Ricardo Martins Teix","Cristina Flavia Silva Andrada","Daniel Fonseca Oliveira","Emilson Jose De Souza Camapum","Eriko Goncalves Filgueira","Fabio De Souza Trindade","Frank Nelson Cruz Venancio","Giancarlo Augusto D. Mariano","Guilherme Cazarin De Brito","Henrique Igor Gomes Lira","Igor Brenno Campbell Borges","Jhefferson Brandao Breta","Joao Gustavo R P Dos Santos","Jorge Henrique Carlos Aires","Jose Augusto Rodrigues Flores","Kaoue Lopes","Leandro Rodrigues","Leandro Tonha De Castro","Lise Alencar","Lucas Da Silva Franca","Luise Anibal Galvano","Luiz Claudio Modesto Pereira","Marcelo Martins Teixeira","Marcos Antonio Vieira Honorato","Marcus Vinicius P Mendonca","Mariana Campos Reis","Mariana Scalia Rodrigues","Mario Humberto A Zambon","Mario Leite Bringel","Mauricio Soares Hungria","Maysa Siqueira O Pinheiro","Michal Alexander D Kossobudzki","Nilo Carrijo Melo","Paulo Ricardo F Naimayer","Rafael Rosa Canedo","Rafael Vieira Rocha","Regis Tavares Da Silva","Renato De Amorim Motta Deusdar","Roberta Cavalcante Monteiro","Rodrigo Alexandre Domingues","Rodrigo Prado Grion","Rogerio Luiz De Jesus Correia","Ronaldo Borges Tonaco","Ronny Machado","Rosana Coccoli","Tadeu Gervazoni Debom","Thiago Fortes P Cavalcanti","Tiago Da Silva Freitas","Valeria Patricia De Araujo","Veronica Lisboa Beloni","Victor Caponi Borba","Vinicius F R De Oliveira","Vitor Hugo Honorato Pereira","Wellington Andrade Freitas","William Antonio Quirino"];
const CLIENTES = ["Acolhedor", "Clindor", "Clinica Lessence Norte", "Clinica Lessence Sul", "COT", "Df Star", "Home Hospital", "Hosp Arthur Ramos", "Hosp Santa Helena", "Hosp Sirio Libanes", "Hosp Sta Lucia Norte", "Hospital Agape", "Hospital Aguas Clara", "Hospital Alvorada Br", "Hospital Anchieta", "Hospital Brasilia", "Hospital Brasiliense", "Hospital Daher", "Hospital Maria Auxil", "Hospital Santa Lucia", "Hospital Santa Luzia", "Hospital Santa Marta", "Hospital Veredas", "Hospital Vida Ltda", "Lessence Servicos M", "Neuromed", "Neurospine", "Regenera", "Santa Casa De Miseri", "Santa Luzia Clinicas", "Sesau", "SOS Neurologico", "Sirio Libanes Clinicas"];

const C = {
  ink: "#10261F", paper: "#F6F4EE", card: "#FFFFFF",
  pine: "#1F5C45", pineDk: "#16402F", sage: "#7FA38E",
  sand: "#E8E2D4", line: "#DAD3C2", amber: "#C2703D",
  mute: "#6B7A72", danger: "#B23B3B",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const brDate = (iso) => (iso ? String(iso).slice(0,10).split("-").reverse().join("/") : "");

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function downloadCSV(filename, columns, rows) {
  const header = columns.map((c) => c.label);
  const lines = [header, ...rows.map((r) => columns.map((c) => r[c.key]))];
  const csv = "\uFEFF" + lines.map((ln) => ln.map(csvEscape).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: ".04em",
        textTransform: "uppercase", color: C.mute, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = {
  width: "100%", boxSizing: "border-box", fontSize: 16, padding: "13px 14px",
  border: `1.5px solid ${C.line}`, borderRadius: 12, background: "#fff",
  color: C.ink, fontFamily: "inherit", appearance: "none", outline: "none",
};
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style||{}) }} />; }
function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={onChange} style={{ ...inputStyle, backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4l4 4 4-4' stroke='%236B7A72' stroke-width='1.5' fill='none'/></svg>\")",
      backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}>
      <option value="">{placeholder || "Selecione..."}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", margin: "0 8px 8px 0",
      borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer",
      border: `1.5px solid ${active ? C.pine : C.line}`,
      background: active ? C.pine : "#fff", color: active ? "#fff" : C.ink }}>
      {active && <Check size={15} />} {children}
    </button>
  );
}
function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "15px", fontSize: 16,
      fontWeight: 700, color: "#fff", background: disabled ? C.sage : C.pine, border: "none", borderRadius: 14,
      cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {children}
    </button>
  );
}

const VISIT_TYPES = ["Visita Tecnica", "Cirurgia", "Visita Consultorio", "Acomp. Cirurgia"];
const CONTATO = ["Celular", "Na Clinica", "Telefone", "WhatsApp", "E-mail"];
const FUP = ["Pendente", "Agendado", "Realizado", "Reagendar", "Sem retorno"];

function VisitForm({ onSave, saving }) {
  const [f, setF] = useState({ vendedora: "", data: todayISO(), cirurgiao: "", cliente: "",
    tipos: [], contato: "", followStatus: "", proxFollow: "", obs: "" });
  const toggle = (t) => setF((s) => ({ ...s, tipos: s.tipos.includes(t) ? s.tipos.filter(x=>x!==t) : [...s.tipos, t] }));
  const save = async () => {
    if (!f.vendedora || !f.cirurgiao) { alert("Preencha ao menos Vendedora e Cirurgiao."); return; }
    const ok = await onSave({
      vendedora: f.vendedora, data: f.data, cirurgiao: f.cirurgiao, cliente: f.cliente,
      tipos: f.tipos.join(" + "), contato: f.contato, follow_status: f.followStatus,
      prox_follow: f.proxFollow || null, obs: f.obs,
    });
    if (ok) setF({ vendedora: f.vendedora, data: todayISO(), cirurgiao: "", cliente: "", tipos: [], contato: "", followStatus: "", proxFollow: "", obs: "" });
  };
  return (
    <div>
      <Field label="Vendedora"><Select value={f.vendedora} onChange={(e)=>setF({...f,vendedora:e.target.value})} options={VENDEDORES} /></Field>
      <Field label="Data da visita"><TextInput type="date" value={f.data} onChange={(e)=>setF({...f,data:e.target.value})} /></Field>
      <Field label="Cirurgiao"><Select value={f.cirurgiao} onChange={(e)=>setF({...f,cirurgiao:e.target.value})} options={MEDICOS} /></Field>
      <Field label="Cliente (hospital/clinica)"><Select value={f.cliente} onChange={(e)=>setF({...f,cliente:e.target.value})} options={CLIENTES} /></Field>
      <Field label="Tipo de visita (toque pra marcar)">
        <div>{VISIT_TYPES.map((t)=><Chip key={t} active={f.tipos.includes(t)} onClick={()=>toggle(t)}>{t}</Chip>)}</div>
      </Field>
      <Field label="Contato por"><Select value={f.contato} onChange={(e)=>setF({...f,contato:e.target.value})} options={CONTATO} /></Field>
      <Field label="Status do follow-up"><Select value={f.followStatus} onChange={(e)=>setF({...f,followStatus:e.target.value})} options={FUP} /></Field>
      <Field label="Proximo follow-up"><TextInput type="date" value={f.proxFollow} onChange={(e)=>setF({...f,proxFollow:e.target.value})} /></Field>
      <Field label="Observacoes"><TextInput value={f.obs} onChange={(e)=>setF({...f,obs:e.target.value})} placeholder="Anotacoes da visita" /></Field>
      <PrimaryBtn onClick={save} disabled={saving}><Plus size={18}/> {saving ? "Salvando..." : "Salvar visita"}</PrimaryBtn>
    </div>
  );
}

const CURSO_TIPO = ["Presencial", "Online", "Hibrido", "In Company", "Workshop"];
const CURSO_STATUS = ["Planejado", "Inscrito", "Em andamento", "Concluido", "Cancelado"];
const CONV_TIPO = ["Vendedor", "Cirurgiao", "Tecnico", "Socio", "Outro"];
const CONFIRMA = ["Confirmado", "Pendente", "Recusado", "Compareceu", "Faltou"];

function CourseForm({ onSave, saving }) {
  const [f, setF] = useState({ curso: "", tipo: "", dataIni: todayISO(), local: "", status: "",
    responsavel: "", convidado: "", convTipo: "", especialidade: "", email: "", telefone: "", confirmacao: "", obs: "" });
  const save = async () => {
    if (!f.curso || !f.convidado) { alert("Preencha ao menos Curso e Nome do convidado."); return; }
    const ok = await onSave({
      curso: f.curso, tipo: f.tipo, data_ini: f.dataIni || null, local: f.local, status: f.status,
      responsavel: f.responsavel, convidado: f.convidado, conv_tipo: f.convTipo,
      especialidade: f.especialidade, email: f.email, telefone: f.telefone, confirmacao: f.confirmacao, obs: f.obs,
    });
    if (ok) setF({ ...f, convidado: "", convTipo: "", especialidade: "", email: "", telefone: "", confirmacao: "" });
  };
  return (
    <div>
      <Field label="Curso / treinamento"><TextInput value={f.curso} onChange={(e)=>setF({...f,curso:e.target.value})} placeholder="Nome do curso" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={(e)=>setF({...f,tipo:e.target.value})} options={CURSO_TIPO} /></Field>
      <Field label="Data de inicio"><TextInput type="date" value={f.dataIni} onChange={(e)=>setF({...f,dataIni:e.target.value})} /></Field>
      <Field label="Local / plataforma"><TextInput value={f.local} onChange={(e)=>setF({...f,local:e.target.value})} placeholder="Ex: Hotel X / Zoom" /></Field>
      <Field label="Status"><Select value={f.status} onChange={(e)=>setF({...f,status:e.target.value})} options={CURSO_STATUS} /></Field>
      <Field label="Vendedor responsavel"><Select value={f.responsavel} onChange={(e)=>setF({...f,responsavel:e.target.value})} options={VENDEDORES} /></Field>
      <div style={{ height: 1, background: C.line, margin: "4px 0 16px" }} />
      <Field label="Nome do convidado"><TextInput value={f.convidado} onChange={(e)=>setF({...f,convidado:e.target.value})} placeholder="Nome completo" /></Field>
      <Field label="Tipo de convidado"><Select value={f.convTipo} onChange={(e)=>setF({...f,convTipo:e.target.value})} options={CONV_TIPO} /></Field>
      <Field label="Especialidade"><TextInput value={f.especialidade} onChange={(e)=>setF({...f,especialidade:e.target.value})} placeholder="Ex: Neurocirurgia" /></Field>
      <Field label="E-mail"><TextInput type="email" value={f.email} onChange={(e)=>setF({...f,email:e.target.value})} placeholder="email@exemplo.com" /></Field>
      <Field label="Telefone"><TextInput type="tel" value={f.telefone} onChange={(e)=>setF({...f,telefone:e.target.value})} placeholder="(61) 90000-0000" /></Field>
      <Field label="Confirmacao de presenca"><Select value={f.confirmacao} onChange={(e)=>setF({...f,confirmacao:e.target.value})} options={CONFIRMA} /></Field>
      <PrimaryBtn onClick={save} disabled={saving}><Plus size={18}/> {saving ? "Salvando..." : "Salvar convidado"}</PrimaryBtn>
    </div>
  );
}

const VIA_TIPO = ["Congresso", "Curso", "Visita Tecnica", "Reuniao", "Feira", "Outro"];
const TRANSP = ["Aviao", "Carro", "Onibus", "Van", "Outro"];
const HOSP = ["Reservado", "A reservar", "Nao necessario"];
const VIA_STATUS = ["Planejado", "Confirmado", "Realizado", "Cancelado"];
const FUNCAO = ["Socio", "Vendedora", "Tecnico", "Gerente"];

function TravelForm({ onSave, saving }) {
  const [f, setF] = useState({ evento: "", tipo: "", dataIda: todayISO(), dataVolta: "", viajante: "",
    funcao: "", destino: "", transporte: "", hospedagem: "", status: "", custo: "", obs: "" });
  const save = async () => {
    if (!f.evento || !f.viajante) { alert("Preencha ao menos Evento e Viajante."); return; }
    const ok = await onSave({
      evento: f.evento, tipo: f.tipo, data_ida: f.dataIda || null, data_volta: f.dataVolta || null,
      viajante: f.viajante, funcao: f.funcao, destino: f.destino, transporte: f.transporte,
      hospedagem: f.hospedagem, status: f.status, custo: f.custo, obs: f.obs,
    });
    if (ok) setF({ ...f, evento: "", tipo: "", dataVolta: "", destino: "", transporte: "", hospedagem: "", status: "", custo: "", obs: "" });
  };
  const viajanteOpts = [...VENDEDORES, "Socio", "Equipe"];
  return (
    <div>
      <Field label="Evento / motivo"><TextInput value={f.evento} onChange={(e)=>setF({...f,evento:e.target.value})} placeholder="Nome do congresso/curso" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={(e)=>setF({...f,tipo:e.target.value})} options={VIA_TIPO} /></Field>
      <Field label="Data de ida"><TextInput type="date" value={f.dataIda} onChange={(e)=>setF({...f,dataIda:e.target.value})} /></Field>
      <Field label="Data de volta"><TextInput type="date" value={f.dataVolta} onChange={(e)=>setF({...f,dataVolta:e.target.value})} /></Field>
      <Field label="Viajante"><Select value={f.viajante} onChange={(e)=>setF({...f,viajante:e.target.value})} options={viajanteOpts} /></Field>
      <Field label="Funcao"><Select value={f.funcao} onChange={(e)=>setF({...f,funcao:e.target.value})} options={FUNCAO} /></Field>
      <Field label="Cidade / destino"><TextInput value={f.destino} onChange={(e)=>setF({...f,destino:e.target.value})} placeholder="Ex: Sao Paulo - SP" /></Field>
      <Field label="Transporte"><Select value={f.transporte} onChange={(e)=>setF({...f,transporte:e.target.value})} options={TRANSP} /></Field>
      <Field label="Hospedagem"><Select value={f.hospedagem} onChange={(e)=>setF({...f,hospedagem:e.target.value})} options={HOSP} /></Field>
      <Field label="Status"><Select value={f.status} onChange={(e)=>setF({...f,status:e.target.value})} options={VIA_STATUS} /></Field>
      <Field label="Custo estimado (R$)"><TextInput type="number" inputMode="decimal" value={f.custo} onChange={(e)=>setF({...f,custo:e.target.value})} placeholder="0,00" /></Field>
      <Field label="Observacoes"><TextInput value={f.obs} onChange={(e)=>setF({...f,obs:e.target.value})} placeholder="Anotacoes" /></Field>
      <PrimaryBtn onClick={save} disabled={saving}><Plus size={18}/> {saving ? "Salvando..." : "Salvar viagem"}</PrimaryBtn>
    </div>
  );
}

function RecordCard({ title, subtitle, tags, onDelete }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{title}</div>
          <div style={{ color: C.mute, fontSize: 13, marginTop: 2 }}>{subtitle}</div>
          {tags && tags.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.filter(Boolean).map((t, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.pineDk,
                  background: C.sand, borderRadius: 999, padding: "3px 9px" }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: 4 }}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

const TERAPIAS = ["SCS", "RF", "DBS", "DRG"];
const STATUS_BI = ["Autorizado", "Analise", "Faturado", "Realizado", "Canc.Perda"];
const REALIZ = ["Realizada", "Nao realizada"];

function diasEntre(a, b) {
  if (!a || !b) return null;
  const d = Math.round((new Date(b) - new Date(a)) / 86400000);
  return isNaN(d) ? null : d;
}

function CirurgiaCard({ c, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [realizada, setRealizada] = useState(c.realizada || "");
  const [dataCir, setDataCir] = useState(c.data_cirurgia ? String(c.data_cirurgia).slice(0,10) : "");
  const tempo = diasEntre(c.data_auto, c.data_cirurgia);
  const corStatus = { Autorizado:"#2874A6", Analise:C.amber, Faturado:C.pine, Realizado:"#117864", "Canc.Perda":C.danger }[c.status_orig] || C.mute;
  const salvar = async () => {
    await onUpdate(c.id, { realizada: realizada || null, data_cirurgia: dataCir || null });
    setEditing(false);
  };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{c.paciente || "-"}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: corStatus, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{c.status_orig}</span>
      </div>
      <div style={{ color: C.mute, fontSize: 13, marginTop: 3 }}>{c.medico} · {c.cliente}</div>
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.pineDk, background: C.sand, borderRadius: 999, padding: "3px 9px" }}>{c.terapia}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.mute, background: "#F0EEE6", borderRadius: 999, padding: "3px 9px" }}>Cotação {brDate(c.data_cotacao)}</span>
        {c.data_auto && <span style={{ fontSize: 11, fontWeight: 600, color: C.mute, background: "#F0EEE6", borderRadius: 999, padding: "3px 9px" }}>Auto. {brDate(c.data_auto)}</span>}
        {c.realizada && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: c.realizada==="Realizada"?"#117864":C.danger, borderRadius: 999, padding: "3px 9px" }}>{c.realizada}</span>}
        {tempo!=null && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.pine, borderRadius: 999, padding: "3px 9px" }}>{tempo} dias auto→cir</span>}
      </div>
      {!editing && (
        <button onClick={()=>setEditing(true)} style={{ marginTop: 12, width: "100%", padding: "10px", fontSize: 14, fontWeight: 700,
          color: C.pine, background: "#fff", border: `1.5px solid ${C.pine}`, borderRadius: 12, cursor: "pointer" }}>
          {c.realizada ? "Editar realização" : "Marcar realizada / não realizada"}
        </button>
      )}
      {editing && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
          <Field label="Cirurgia foi realizada?">
            <Select value={realizada} onChange={(e)=>setRealizada(e.target.value)} options={REALIZ} />
          </Field>
          {realizada==="Realizada" && (
            <Field label="Data da cirurgia">
              <TextInput type="date" value={dataCir} onChange={(e)=>setDataCir(e.target.value)} />
            </Field>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={salvar} style={{ flex: 1, padding: "12px", fontSize: 14, fontWeight: 700, color: "#fff", background: C.pine, border: "none", borderRadius: 12, cursor: "pointer" }}>Salvar</button>
            <button onClick={()=>setEditing(false)} style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.mute, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 12, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CirurgiasTab({ loading, cirurgias, onUpdate }) {
  const [fStatus, setFStatus] = useState("");
  const [fTerapia, setFTerapia] = useState("");
  const [fRealiz, setFRealiz] = useState("");

  const filtradas = useMemo(() => cirurgias.filter(c =>
    (!fStatus || c.status_orig === fStatus) &&
    (!fTerapia || c.terapia === fTerapia) &&
    (!fRealiz || c.realizada === fRealiz)
  ), [cirurgias, fStatus, fTerapia, fRealiz]);

  const porTerapia = useMemo(() => {
    const g = {};
    for (const c of filtradas) { (g[c.terapia] = g[c.terapia] || []).push(c); }
    return g;
  }, [filtradas]);

  const ordemTerapia = TERAPIAS.filter(t => porTerapia[t]);

  return (
    <div>
      <p style={{ color: C.mute, fontSize: 14, marginTop: 0, lineHeight: 1.5 }}>
        Cirurgias da base. Filtre por status e terapia, e marque cada uma como realizada ou não, com a data — o app calcula o tempo entre autorização e cirurgia.
      </p>
      <Field label="Status">
        <Select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} options={STATUS_BI} placeholder="Todos os status" />
      </Field>
      <Field label="Terapia">
        <Select value={fTerapia} onChange={(e)=>setFTerapia(e.target.value)} options={TERAPIAS} placeholder="Todas as terapias" />
      </Field>
      <Field label="Realização">
        <Select value={fRealiz} onChange={(e)=>setFRealiz(e.target.value)} options={REALIZ} placeholder="Todas" />
      </Field>

      <SectionTitle>Cirurgias ({filtradas.length})</SectionTitle>
      {loading && <Empty text="Carregando..." />}
      {!loading && filtradas.length===0 && <Empty text="Nenhuma cirurgia com esses filtros." />}
      {!loading && ordemTerapia.map(t => (
        <div key={t} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.pineDk, margin: "4px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: C.pine, color: "#fff", borderRadius: 8, padding: "2px 10px" }}>{t}</span>
            <span style={{ color: C.mute, fontWeight: 600 }}>{porTerapia[t].length}</span>
          </div>
          {porTerapia[t].map(c => <CirurgiaCard key={c.id} c={c} onUpdate={onUpdate} />)}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [visits, setVisits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [travels, setTravels] = useState([]);
  const [cirurgias, setCirurgias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!SUPA_OK) { setLoading(false); setErro("config"); return; }
    setLoading(true); setErro("");
    try {
      const [v, c, t, cir] = await Promise.all([db.list("visitas"), db.list("cursos"), db.list("viagens"), supaFetch("cirurgias?select=*&order=data_cotacao.desc")]);
      setVisits(v || []); setCourses(c || []); setTravels(t || []); setCirurgias(cir || []);
    } catch (e) {
      setErro("conexao");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (table, setter, row) => {
    if (!SUPA_OK) { alert("O app ainda nao esta conectado ao banco. Veja o arquivo de instrucoes."); return false; }
    setSaving(true);
    try {
      const inserted = await db.insert(table, row);
      if (inserted && inserted[0]) setter((cur) => [inserted[0], ...cur]);
      return true;
    } catch (e) {
      alert("Nao consegui salvar. Verifique a conexao e tente de novo.");
      return false;
    } finally { setSaving(false); }
  };

  const apagar = async (table, setter, id) => {
    try { await db.remove(table, id); setter((cur) => cur.filter((x) => x.id !== id)); }
    catch (e) { alert("Nao consegui apagar agora."); }
  };

  const atualizarCirurgia = async (id, patch) => {
    try {
      const upd = await db.update("cirurgias", id, patch);
      if (upd && upd[0]) setCirurgias((cur) => cur.map((x) => (x.id === id ? upd[0] : x)));
    } catch (e) { alert("Nao consegui atualizar a cirurgia agora."); }
  };

  const stats = useMemo(() => ({
    visitas: visits.length,
    followPend: visits.filter(v=>v.follow_status==="Pendente"||v.follow_status==="Agendado").length,
    convidados: courses.length,
    viagensProx: travels.filter(t=>t.data_ida && String(t.data_ida).slice(0,10)>=todayISO()).length,
    cirAutorizadas: cirurgias.filter(c=>c.status_orig==="Autorizado" && !c.realizada).length,
  }), [visits, courses, travels, cirurgias]);

  const exportVisits = () => downloadCSV("visitas.csv",
    [{key:"vendedora",label:"Vendedora"},{key:"data",label:"Data"},{key:"cirurgiao",label:"Cirurgiao"},
     {key:"cliente",label:"Cliente"},{key:"tipos",label:"Tipo de Visita"},{key:"contato",label:"Contato"},
     {key:"follow_status",label:"Status Follow-up"},{key:"prox_follow",label:"Proximo Follow-up"},{key:"obs",label:"Observacoes"}],
    visits.map(v=>({...v, data:brDate(v.data), prox_follow:brDate(v.prox_follow)})));
  const exportCourses = () => downloadCSV("cursos.csv",
    [{key:"curso",label:"Curso"},{key:"tipo",label:"Tipo"},{key:"data_ini",label:"Data Inicio"},{key:"local",label:"Local"},
     {key:"status",label:"Status"},{key:"responsavel",label:"Responsavel"},{key:"convidado",label:"Convidado"},
     {key:"conv_tipo",label:"Tipo Convidado"},{key:"especialidade",label:"Especialidade"},{key:"email",label:"E-mail"},
     {key:"telefone",label:"Telefone"},{key:"confirmacao",label:"Confirmacao"},{key:"obs",label:"Observacoes"}],
    courses.map(c=>({...c, data_ini:brDate(c.data_ini)})));
  const exportTravels = () => downloadCSV("viagens.csv",
    [{key:"evento",label:"Evento"},{key:"tipo",label:"Tipo"},{key:"data_ida",label:"Ida"},{key:"data_volta",label:"Volta"},
     {key:"viajante",label:"Viajante"},{key:"funcao",label:"Funcao"},{key:"destino",label:"Destino"},
     {key:"transporte",label:"Transporte"},{key:"hospedagem",label:"Hospedagem"},{key:"status",label:"Status"},
     {key:"custo",label:"Custo"},{key:"obs",label:"Observacoes"}],
    travels.map(t=>({...t, data_ida:brDate(t.data_ida), data_volta:brDate(t.data_volta)})));
  const exportCirurgias = () => downloadCSV("cirurgias.csv",
    [{key:"codigo",label:"Codigo"},{key:"data_cotacao",label:"Data Cotacao"},{key:"status_orig",label:"Status BI"},
     {key:"terapia",label:"Terapia"},{key:"paciente",label:"Paciente"},{key:"medico",label:"Medico"},
     {key:"cliente",label:"Cliente"},{key:"convenio",label:"Convenio"},{key:"vendedora",label:"Vendedora"},
     {key:"data_auto",label:"Data Autorizacao"},{key:"realizada",label:"Realizada"},{key:"data_cirurgia",label:"Data Cirurgia"},
     {key:"tempo",label:"Dias Auto->Cirurgia"},{key:"valor",label:"Valor"}],
    cirurgias.map(c=>({...c, data_cotacao:brDate(c.data_cotacao), data_auto:brDate(c.data_auto), data_cirurgia:brDate(c.data_cirurgia),
      tempo: (c.data_auto && c.data_cirurgia) ? Math.round((new Date(c.data_cirurgia)-new Date(c.data_auto))/86400000) : ""})));

  const NAV = [
    { id: "home", label: "Painel", Icon: Home },
    { id: "cirurgias", label: "Cirurgias", Icon: Activity },
    { id: "visitas", label: "Visitas", Icon: MapPin },
    { id: "cursos", label: "Cursos", Icon: GraduationCap },
    { id: "viagens", label: "Viagens", Icon: Plane },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        *{-webkit-tap-highlight-color:transparent} button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid ${C.pine};outline-offset:1px}
        select:focus,input:focus{border-color:${C.pine}!important}`}</style>

      <header style={{ background: C.pineDk, color: "#fff", padding: "18px 18px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tab !== "home" && (
            <button onClick={()=>setTab("home")} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:10, padding:7, cursor:"pointer", color:"#fff", display:"flex" }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, fontWeight: 700 }}>Equipe de Vendas</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
              {tab==="home"?"Lancamentos do campo":tab==="cirurgias"?"Cirurgias":tab==="visitas"?"Nova visita":tab==="cursos"?"Cursos & treinamentos":"Agenda de viagens"}
            </div>
          </div>
          {tab==="home" && SUPA_OK && (
            <button onClick={carregar} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"#fff", display:"flex" }}>
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: "18px 16px 96px", maxWidth: 560, margin: "0 auto" }}>
        {erro === "config" && (
          <div style={{ background: "#FBEEE6", border: `1px solid ${C.amber}`, borderRadius: 14, padding: 16, marginBottom: 16, color: C.ink }}>
            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><CloudOff size={18}/> App ainda nao conectado</div>
            <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5, color: C.mute }}>
              Falta colar a URL e a chave do Supabase no topo do arquivo. Veja o arquivo de instrucoes que acompanha o projeto.
            </div>
          </div>
        )}
        {erro === "conexao" && (
          <div style={{ background: "#FBEEE6", border: `1px solid ${C.amber}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>Sem conexao com o banco</div>
            <div style={{ fontSize: 14, marginTop: 6, color: C.mute }}>Toque no botao atualizar e tente de novo.</div>
          </div>
        )}

        {tab === "home" && (
          <div>
            <p style={{ color: C.mute, fontSize: 14, marginTop: 0, lineHeight: 1.5 }}>
              Registre visitas, cursos e viagens. Tudo fica salvo online e a equipe inteira ve os mesmos dados.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <StatCard n={loading?"...":stats.cirAutorizadas} label="Autorizadas a realizar" accent={C.amber} />
              <StatCard n={loading?"...":stats.visitas} label="Visitas registradas" accent={C.pine} />
              <StatCard n={loading?"...":stats.followPend} label="Follow-ups em aberto" accent={C.amber} />
              <StatCard n={loading?"...":stats.viagensProx} label="Viagens proximas" accent={C.pine} />
            </div>

            <div style={{ marginTop: 22 }}>
              <SectionTitle>Exportar para a planilha / Power BI</SectionTitle>
              <ExportRow label="Cirurgias" count={cirurgias.length} onClick={exportCirurgias} />
              <ExportRow label="Visitas" count={visits.length} onClick={exportVisits} />
              <ExportRow label="Cursos / convidados" count={courses.length} onClick={exportCourses} />
              <ExportRow label="Viagens" count={travels.length} onClick={exportTravels} />
            </div>

            <div style={{ marginTop: 22 }}>
              <SectionTitle>Atalhos</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <ShortcutBtn Icon={MapPin} label="Visita" onClick={()=>setTab("visitas")} />
                <ShortcutBtn Icon={GraduationCap} label="Curso" onClick={()=>setTab("cursos")} />
                <ShortcutBtn Icon={Plane} label="Viagem" onClick={()=>setTab("viagens")} />
              </div>
            </div>

            <p style={{ marginTop: 24, fontSize: 12, color: C.mute, lineHeight: 1.5, background: C.sand, padding: "12px 14px", borderRadius: 12 }}>
              Os dados ficam salvos online e sao compartilhados por toda a equipe. Toque no icone de atualizar (canto superior) para ver os lancamentos mais recentes.
            </p>
          </div>
        )}

        {tab === "cirurgias" && (
          <CirurgiasTab loading={loading} cirurgias={cirurgias} onUpdate={atualizarCirurgia} />
        )}

        {tab === "visitas" && (
          <>
            <VisitForm saving={saving} onSave={(row)=>salvar("visitas", setVisits, row)} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Visitas registradas ({visits.length})</SectionTitle>
              {loading && <Empty text="Carregando..." />}
              {!loading && visits.length===0 && <Empty text="Nenhuma visita ainda. Preencha acima e salve." />}
              {visits.map((v)=>(
                <RecordCard key={v.id} title={v.cirurgiao||"-"}
                  subtitle={`${v.cliente||"sem cliente"} - ${brDate(v.data)} - ${v.vendedora}`}
                  tags={[v.tipos, v.contato, v.follow_status]} onDelete={()=>apagar("visitas", setVisits, v.id)} />
              ))}
            </div>
          </>
        )}

        {tab === "cursos" && (
          <>
            <CourseForm saving={saving} onSave={(row)=>salvar("cursos", setCourses, row)} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Convidados ({courses.length})</SectionTitle>
              {loading && <Empty text="Carregando..." />}
              {!loading && courses.length===0 && <Empty text="Nenhum convidado ainda." />}
              {courses.map((c)=>(
                <RecordCard key={c.id} title={c.convidado}
                  subtitle={`${c.curso} - ${c.especialidade||c.conv_tipo||""}`}
                  tags={[c.confirmacao, c.conv_tipo, c.responsavel]} onDelete={()=>apagar("cursos", setCourses, c.id)} />
              ))}
            </div>
          </>
        )}

        {tab === "viagens" && (
          <>
            <TravelForm saving={saving} onSave={(row)=>salvar("viagens", setTravels, row)} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Viagens ({travels.length})</SectionTitle>
              {loading && <Empty text="Carregando..." />}
              {!loading && travels.length===0 && <Empty text="Nenhuma viagem ainda." />}
              {travels.map((t)=>(
                <RecordCard key={t.id} title={t.evento}
                  subtitle={`${t.viajante} - ${t.destino||""} - ${brDate(t.data_ida)}`}
                  tags={[t.tipo, t.status, t.transporte]} onDelete={()=>apagar("viagens", setTravels, t.id)} />
              ))}
            </div>
          </>
        )}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
        borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-around",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 20 }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{ background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px",
              color: active ? C.pine : C.mute, flex: 1 }}>
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StatCard({ n, label, accent }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 16px 14px" }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: accent, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 13, color: C.mute, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
function SectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
    color: C.pineDk, marginBottom: 10 }}>{children}</div>;
}
function ExportRow({ label, count, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, cursor: "pointer" }}>
      <span style={{ fontWeight: 600, color: C.ink }}>{label} <span style={{ color: C.mute, fontWeight: 500 }}>- {count}</span></span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.pine, fontWeight: 700, fontSize: 14 }}>
        <Download size={17} /> CSV
      </span>
    </button>
  );
}
function ShortcutBtn({ Icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: C.pine, border: "none", borderRadius: 14, padding: "16px 8px",
      color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <Icon size={24} /> <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
    </button>
  );
}
function Empty({ text }) {
  return <div style={{ textAlign: "center", color: C.mute, fontSize: 14, padding: "26px 14px",
    border: `1px dashed ${C.line}`, borderRadius: 14 }}>{text}</div>;
}
