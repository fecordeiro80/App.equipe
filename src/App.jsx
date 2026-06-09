import React, { useState, useMemo } from "react";
import { Home, MapPin, GraduationCap, Plane, Download, Plus, Trash2, Check, ChevronLeft } from "lucide-react";

// ---- Dados de apoio (extraídos da base de cirurgias) ----
const VENDEDORES = ["Charlene Pinheiro Alves", "Ednalda De Oliveira Mouta Sabi", "Fernando Cordeiro", "Natalia Ataide Sabath", "Paula Simoes"];
const MEDICOS = ["Aldo S Calaca Costa","Alexandre Mio Pos","Amanda Ambrosio Da Silva","Andre Meireles Borba","Antenor Vieira De Araujo Junio","Antonio Jorge B De Oliveira","Arnaud Macedo Oliveira Filho","Arnon Castro Alves Filho","Arthur Bernardo G Fernandes","Bruno Da Silva Moreira","Carlos Eduardo D P M Ontiveros","Carlos Eduardo De Queiroz","Cleyverton Garcia Lima","Cristiano Ricardo Martins Teix","Cristina Flavia Silva Andrada","Daniel Fonseca Oliveira","Emilson Jose De Souza Camapum","Eriko Goncalves Filgueira","Fabio De Souza Trindade","Frank Nelson Cruz Venancio","Giancarlo Augusto D. Mariano","Guilherme Cazarin De Brito","Henrique Igor Gomes Lira","Igor Brenno Campbell Borges","Jhefferson Brandao Breta","Joao Gustavo R P Dos Santos","Jorge Henrique Carlos Aires","Jose Augusto Rodrigues Flores","Kaoue Lopes","Leandro Rodrigues","Leandro Tonha De Castro","Lise Alencar","Lucas Da Silva Franca","Luise Anibal Galvano","Luiz Claudio Modesto Pereira","Marcelo Martins Teixeira","Marcos Antonio Vieira Honorato","Marcus Vinicius P Mendonca","Mariana Campos Reis","Mariana Scalia Rodrigues","Mario Humberto A Zambon","Mario Leite Bringel","Mauricio Soares Hungria","Maysa Siqueira O Pinheiro","Michal Alexander D Kossobudzki","Nilo Carrijo Melo","Paulo Ricardo F Naimayer","Rafael Rosa Canedo","Rafael Vieira Rocha","Regis Tavares Da Silva","Renato De Amorim Motta Deusdar","Roberta Cavalcante Monteiro","Rodrigo Alexandre Domingues","Rodrigo Prado Grion","Rogerio Luiz De Jesus Correia","Ronaldo Borges Tonaco","Ronny Machado","Rosana Coccoli","Tadeu Gervazoni Debom","Thiago Fortes P Cavalcanti","Tiago Da Silva Freitas","Valeria Patricia De Araujo","Veronica Lisboa Beloni","Victor Caponi Borba","Vinicius F R De Oliveira","Vitor Hugo Honorato Pereira","Wellington Andrade Freitas","William Antonio Quirino"];
const CLIENTES = ["Acolhedor", "Clindor", "Clínica Lessence Norte", "Clínica Lessence Sul", "COT", "Df Star", "Home Hospital", "Hosp Arthur Ramos", "Hosp Santa Helena", "Hosp Sirio Libanes", "Hosp Sta Lucia Norte", "Hospital Agape", "Hospital Aguas Clara", "Hospital Alvorada Br", "Hospital Anchieta", "Hospital Brasilia", "Hospital Brasiliense", "Hospital Daher", "Hospital Maria Auxil", "Hospital Santa Lucia", "Hospital Santa Luzia", "Hospital Santa Marta", "Hospital Veredas", "Hospital Vida Ltda", "Lessence Servicos M", "Neuromed", "Neurospine", "Regenera", "Santa Casa De Miseri", "Santa Luzia Clínicas", "Sesau", "SOS Neurológico", "Sírio Libanês Clínicas"];

const C = {
  ink: "#10261F", paper: "#F6F4EE", card: "#FFFFFF",
  pine: "#1F5C45", pineDk: "#16402F", sage: "#7FA38E",
  sand: "#E8E2D4", line: "#DAD3C2", amber: "#C2703D",
  mute: "#6B7A72", danger: "#B23B3B",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const brDate = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

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

// ---- UI primitives ----
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
      <option value="">{placeholder || "Selecione…"}</option>
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
function PrimaryBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", padding: "15px", fontSize: 16,
      fontWeight: 700, color: "#fff", background: C.pine, border: "none", borderRadius: 14,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {children}
    </button>
  );
}

// ---- Forms ----
const VISIT_TYPES = ["Visita Técnica", "Cirurgia", "Visita Consultório", "Acomp. Cirurgia"];
const CONTATO = ["Celular", "Na Clínica", "Telefone", "WhatsApp", "E-mail"];
const FUP = ["Pendente", "Agendado", "Realizado", "Reagendar", "Sem retorno"];

function VisitForm({ onSave }) {
  const [f, setF] = useState({ vendedora: "", data: todayISO(), cirurgiao: "", cliente: "",
    tipos: [], contato: "", followStatus: "", proxFollow: "", obs: "" });
  const toggle = (t) => setF((s) => ({ ...s, tipos: s.tipos.includes(t) ? s.tipos.filter(x=>x!==t) : [...s.tipos, t] }));
  const save = () => {
    if (!f.vendedora || !f.cirurgiao) { alert("Preencha ao menos Vendedora e Cirurgião."); return; }
    onSave({ ...f, id: Date.now(), tiposStr: f.tipos.join(" + ") });
    setF({ vendedora: f.vendedora, data: todayISO(), cirurgiao: "", cliente: "", tipos: [], contato: "", followStatus: "", proxFollow: "", obs: "" });
  };
  return (
    <div>
      <Field label="Vendedora"><Select value={f.vendedora} onChange={(e)=>setF({...f,vendedora:e.target.value})} options={VENDEDORES} /></Field>
      <Field label="Data da visita"><TextInput type="date" value={f.data} onChange={(e)=>setF({...f,data:e.target.value})} /></Field>
      <Field label="Cirurgião"><Select value={f.cirurgiao} onChange={(e)=>setF({...f,cirurgiao:e.target.value})} options={MEDICOS} /></Field>
      <Field label="Cliente (hospital/clínica)"><Select value={f.cliente} onChange={(e)=>setF({...f,cliente:e.target.value})} options={CLIENTES} /></Field>
      <Field label="Tipo de visita (toque pra marcar)">
        <div>{VISIT_TYPES.map((t)=><Chip key={t} active={f.tipos.includes(t)} onClick={()=>toggle(t)}>{t}</Chip>)}</div>
      </Field>
      <Field label="Contato por"><Select value={f.contato} onChange={(e)=>setF({...f,contato:e.target.value})} options={CONTATO} /></Field>
      <Field label="Status do follow-up"><Select value={f.followStatus} onChange={(e)=>setF({...f,followStatus:e.target.value})} options={FUP} /></Field>
      <Field label="Próximo follow-up"><TextInput type="date" value={f.proxFollow} onChange={(e)=>setF({...f,proxFollow:e.target.value})} /></Field>
      <Field label="Observações"><TextInput as="input" value={f.obs} onChange={(e)=>setF({...f,obs:e.target.value})} placeholder="Anotações da visita" /></Field>
      <PrimaryBtn onClick={save}><Plus size={18}/> Salvar visita</PrimaryBtn>
    </div>
  );
}

const CURSO_TIPO = ["Presencial", "Online", "Híbrido", "In Company", "Workshop"];
const CURSO_STATUS = ["Planejado", "Inscrito", "Em andamento", "Concluído", "Cancelado"];
const CONV_TIPO = ["Vendedor", "Cirurgião", "Técnico", "Sócio", "Outro"];
const CONFIRMA = ["Confirmado", "Pendente", "Recusado", "Compareceu", "Faltou"];

function CourseForm({ onSave }) {
  const [f, setF] = useState({ curso: "", tipo: "", dataIni: todayISO(), local: "", status: "",
    responsavel: "", convidado: "", convTipo: "", especialidade: "", email: "", telefone: "", confirmacao: "", obs: "" });
  const save = () => {
    if (!f.curso || !f.convidado) { alert("Preencha ao menos Curso e Nome do convidado."); return; }
    onSave({ ...f, id: Date.now() });
    setF({ ...f, convidado: "", convTipo: "", especialidade: "", email: "", telefone: "", confirmacao: "" });
  };
  return (
    <div>
      <Field label="Curso / treinamento"><TextInput value={f.curso} onChange={(e)=>setF({...f,curso:e.target.value})} placeholder="Nome do curso" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={(e)=>setF({...f,tipo:e.target.value})} options={CURSO_TIPO} /></Field>
      <Field label="Data de início"><TextInput type="date" value={f.dataIni} onChange={(e)=>setF({...f,dataIni:e.target.value})} /></Field>
      <Field label="Local / plataforma"><TextInput value={f.local} onChange={(e)=>setF({...f,local:e.target.value})} placeholder="Ex: Hotel X / Zoom" /></Field>
      <Field label="Status"><Select value={f.status} onChange={(e)=>setF({...f,status:e.target.value})} options={CURSO_STATUS} /></Field>
      <Field label="Vendedor responsável"><Select value={f.responsavel} onChange={(e)=>setF({...f,responsavel:e.target.value})} options={VENDEDORES} /></Field>
      <div style={{ height: 1, background: C.line, margin: "4px 0 16px" }} />
      <Field label="Nome do convidado"><TextInput value={f.convidado} onChange={(e)=>setF({...f,convidado:e.target.value})} placeholder="Nome completo" /></Field>
      <Field label="Tipo de convidado"><Select value={f.convTipo} onChange={(e)=>setF({...f,convTipo:e.target.value})} options={CONV_TIPO} /></Field>
      <Field label="Especialidade"><TextInput value={f.especialidade} onChange={(e)=>setF({...f,especialidade:e.target.value})} placeholder="Ex: Neurocirurgia" /></Field>
      <Field label="E-mail"><TextInput type="email" value={f.email} onChange={(e)=>setF({...f,email:e.target.value})} placeholder="email@exemplo.com" /></Field>
      <Field label="Telefone"><TextInput type="tel" value={f.telefone} onChange={(e)=>setF({...f,telefone:e.target.value})} placeholder="(61) 90000-0000" /></Field>
      <Field label="Confirmação de presença"><Select value={f.confirmacao} onChange={(e)=>setF({...f,confirmacao:e.target.value})} options={CONFIRMA} /></Field>
      <PrimaryBtn onClick={save}><Plus size={18}/> Salvar convidado</PrimaryBtn>
    </div>
  );
}

const VIA_TIPO = ["Congresso", "Curso", "Visita Técnica", "Reunião", "Feira", "Outro"];
const TRANSP = ["Avião", "Carro", "Ônibus", "Van", "Outro"];
const HOSP = ["Reservado", "A reservar", "Não necessário"];
const VIA_STATUS = ["Planejado", "Confirmado", "Realizado", "Cancelado"];
const FUNCAO = ["Sócio", "Vendedora", "Técnico", "Gerente"];

function TravelForm({ onSave }) {
  const [f, setF] = useState({ evento: "", tipo: "", dataIda: todayISO(), dataVolta: "", viajante: "",
    funcao: "", destino: "", transporte: "", hospedagem: "", status: "", custo: "", obs: "" });
  const save = () => {
    if (!f.evento || !f.viajante) { alert("Preencha ao menos Evento e Viajante."); return; }
    onSave({ ...f, id: Date.now() });
    setF({ ...f, evento: "", tipo: "", dataVolta: "", destino: "", transporte: "", hospedagem: "", status: "", custo: "", obs: "" });
  };
  const viajanteOpts = [...VENDEDORES, "Sócio", "Equipe"];
  return (
    <div>
      <Field label="Evento / motivo"><TextInput value={f.evento} onChange={(e)=>setF({...f,evento:e.target.value})} placeholder="Nome do congresso/curso" /></Field>
      <Field label="Tipo"><Select value={f.tipo} onChange={(e)=>setF({...f,tipo:e.target.value})} options={VIA_TIPO} /></Field>
      <Field label="Data de ida"><TextInput type="date" value={f.dataIda} onChange={(e)=>setF({...f,dataIda:e.target.value})} /></Field>
      <Field label="Data de volta"><TextInput type="date" value={f.dataVolta} onChange={(e)=>setF({...f,dataVolta:e.target.value})} /></Field>
      <Field label="Viajante"><Select value={f.viajante} onChange={(e)=>setF({...f,viajante:e.target.value})} options={viajanteOpts} /></Field>
      <Field label="Função"><Select value={f.funcao} onChange={(e)=>setF({...f,funcao:e.target.value})} options={FUNCAO} /></Field>
      <Field label="Cidade / destino"><TextInput value={f.destino} onChange={(e)=>setF({...f,destino:e.target.value})} placeholder="Ex: São Paulo - SP" /></Field>
      <Field label="Transporte"><Select value={f.transporte} onChange={(e)=>setF({...f,transporte:e.target.value})} options={TRANSP} /></Field>
      <Field label="Hospedagem"><Select value={f.hospedagem} onChange={(e)=>setF({...f,hospedagem:e.target.value})} options={HOSP} /></Field>
      <Field label="Status"><Select value={f.status} onChange={(e)=>setF({...f,status:e.target.value})} options={VIA_STATUS} /></Field>
      <Field label="Custo estimado (R$)"><TextInput type="number" inputMode="decimal" value={f.custo} onChange={(e)=>setF({...f,custo:e.target.value})} placeholder="0,00" /></Field>
      <Field label="Observações"><TextInput value={f.obs} onChange={(e)=>setF({...f,obs:e.target.value})} placeholder="Anotações" /></Field>
      <PrimaryBtn onClick={save}><Plus size={18}/> Salvar viagem</PrimaryBtn>
    </div>
  );
}

// ---- Record list ----
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

// ---- Main App ----
export default function App() {
  const [tab, setTab] = useState("home");
  const [visits, setVisits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [travels, setTravels] = useState([]);

  const stats = useMemo(() => ({
    visitas: visits.length,
    followPend: visits.filter(v=>v.followStatus==="Pendente"||v.followStatus==="Agendado").length,
    cursos: new Set(courses.map(c=>c.curso)).size,
    convidados: courses.length,
    confirmados: courses.filter(c=>c.confirmacao==="Confirmado"||c.confirmacao==="Compareceu").length,
    viagens: travels.length,
    viagensProx: travels.filter(t=>t.dataIda>=todayISO()).length,
  }), [visits, courses, travels]);

  const exportVisits = () => downloadCSV("visitas.csv",
    [{key:"vendedora",label:"Vendedora"},{key:"data",label:"Data"},{key:"cirurgiao",label:"Cirurgião"},
     {key:"cliente",label:"Cliente"},{key:"tiposStr",label:"Tipo de Visita"},{key:"contato",label:"Contato"},
     {key:"followStatus",label:"Status Follow-up"},{key:"proxFollow",label:"Próximo Follow-up"},{key:"obs",label:"Observações"}],
    visits.map(v=>({...v, data:brDate(v.data), proxFollow:brDate(v.proxFollow)})));
  const exportCourses = () => downloadCSV("cursos.csv",
    [{key:"curso",label:"Curso"},{key:"tipo",label:"Tipo"},{key:"dataIni",label:"Data Início"},{key:"local",label:"Local"},
     {key:"status",label:"Status"},{key:"responsavel",label:"Responsável"},{key:"convidado",label:"Convidado"},
     {key:"convTipo",label:"Tipo Convidado"},{key:"especialidade",label:"Especialidade"},{key:"email",label:"E-mail"},
     {key:"telefone",label:"Telefone"},{key:"confirmacao",label:"Confirmação"},{key:"obs",label:"Observações"}],
    courses.map(c=>({...c, dataIni:brDate(c.dataIni)})));
  const exportTravels = () => downloadCSV("viagens.csv",
    [{key:"evento",label:"Evento"},{key:"tipo",label:"Tipo"},{key:"dataIda",label:"Ida"},{key:"dataVolta",label:"Volta"},
     {key:"viajante",label:"Viajante"},{key:"funcao",label:"Função"},{key:"destino",label:"Destino"},
     {key:"transporte",label:"Transporte"},{key:"hospedagem",label:"Hospedagem"},{key:"status",label:"Status"},
     {key:"custo",label:"Custo"},{key:"obs",label:"Observações"}],
    travels.map(t=>({...t, dataIda:brDate(t.dataIda), dataVolta:brDate(t.dataVolta)})));

  const NAV = [
    { id: "home", label: "Painel", Icon: Home },
    { id: "visitas", label: "Visitas", Icon: MapPin },
    { id: "cursos", label: "Cursos", Icon: GraduationCap },
    { id: "viagens", label: "Viagens", Icon: Plane },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        *{-webkit-tap-highlight-color:transparent} button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid ${C.pine};outline-offset:1px}
        select:focus,input:focus{border-color:${C.pine}!important}`}</style>

      {/* Header */}
      <header style={{ background: C.pineDk, color: "#fff", padding: "18px 18px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tab !== "home" && (
            <button onClick={()=>setTab("home")} style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:10, padding:7, cursor:"pointer", color:"#fff", display:"flex" }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, fontWeight: 700 }}>Equipe de Vendas</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
              {tab==="home"?"Lançamentos do campo":tab==="visitas"?"Nova visita":tab==="cursos"?"Cursos & treinamentos":"Agenda de viagens"}
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: "18px 16px 96px", maxWidth: 560, margin: "0 auto" }}>
        {tab === "home" && (
          <div>
            <p style={{ color: C.mute, fontSize: 14, marginTop: 0, lineHeight: 1.5 }}>
              Registre suas visitas, cursos e viagens direto do celular. Ao final do dia, exporte cada lista em CSV e envie pra planilha central.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <StatCard n={stats.visitas} label="Visitas registradas" accent={C.pine} />
              <StatCard n={stats.followPend} label="Follow-ups em aberto" accent={C.amber} />
              <StatCard n={stats.convidados} label="Convidados em cursos" accent={C.pine} />
              <StatCard n={stats.viagensProx} label="Viagens próximas" accent={C.amber} />
            </div>

            <div style={{ marginTop: 22 }}>
              <SectionTitle>Exportar para a planilha</SectionTitle>
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
              Os registros ficam guardados nesta sessão do app. Exporte em CSV antes de fechar para não perder os dados.
            </p>
          </div>
        )}

        {tab === "visitas" && (
          <>
            <VisitForm onSave={(r)=>setVisits([r, ...visits])} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Registradas hoje ({visits.length})</SectionTitle>
              {visits.length===0 && <Empty text="Nenhuma visita ainda. Preencha acima e salve." />}
              {visits.map((v)=>(
                <RecordCard key={v.id} title={v.cirurgiao||"—"}
                  subtitle={`${v.cliente||"sem cliente"} · ${brDate(v.data)} · ${v.vendedora}`}
                  tags={[v.tiposStr, v.contato, v.followStatus]} onDelete={()=>setVisits(visits.filter(x=>x.id!==v.id))} />
              ))}
            </div>
          </>
        )}

        {tab === "cursos" && (
          <>
            <CourseForm onSave={(r)=>setCourses([r, ...courses])} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Convidados ({courses.length})</SectionTitle>
              {courses.length===0 && <Empty text="Nenhum convidado ainda." />}
              {courses.map((c)=>(
                <RecordCard key={c.id} title={c.convidado}
                  subtitle={`${c.curso} · ${c.especialidade||c.convTipo||""}`}
                  tags={[c.confirmacao, c.convTipo, c.responsavel]} onDelete={()=>setCourses(courses.filter(x=>x.id!==c.id))} />
              ))}
            </div>
          </>
        )}

        {tab === "viagens" && (
          <>
            <TravelForm onSave={(r)=>setTravels([r, ...travels])} />
            <div style={{ marginTop: 26 }}>
              <SectionTitle>Viagens ({travels.length})</SectionTitle>
              {travels.length===0 && <Empty text="Nenhuma viagem ainda." />}
              {travels.map((t)=>(
                <RecordCard key={t.id} title={t.evento}
                  subtitle={`${t.viajante} · ${t.destino||""} · ${brDate(t.dataIda)}`}
                  tags={[t.tipo, t.status, t.transporte]} onDelete={()=>setTravels(travels.filter(x=>x.id!==t.id))} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom nav */}
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
      <span style={{ fontWeight: 600, color: C.ink }}>{label} <span style={{ color: C.mute, fontWeight: 500 }}>· {count}</span></span>
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
