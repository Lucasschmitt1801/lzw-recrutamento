"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, Phone, Download, Loader2, MapPin, X, Linkedin, GraduationCap, User } from "lucide-react";
import { updateApplicationStatus } from "@/app/actions/update-status"; 
import { toast } from "sonner";

// Definição das Colunas
const COLUMNS = [
  { id: 'NEW', label: 'Novos', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'INTERVIEW', label: 'Entrevista', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'OFFER', label: 'Proposta', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'HIRED', label: 'Contratado', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'REJECTED', label: 'Reprovado', color: 'bg-red-50 border-red-200 text-red-700' },
];

export default function KanbanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // --- FUNÇÃO AUXILIAR PARA CORRIGIR LINKS ---
  const formatUrl = (url: string) => {
    if (!url) return "#";
    // Se não tiver http ou https no começo, adiciona https://
    return url.startsWith('http') ? url : `https://${url}`;
  };

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    
    // Carrega Vaga
    const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single();
    setJob(jobData);

    // Carrega Candidatos
    const { data: appsData, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:user_id (*) 
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro detalhado ao carregar:", error.message);
        toast.error("Erro ao carregar candidatos");
    }
    
    if (appsData) setApplicants(appsData);
    setLoading(false);
  }

  const handleMove = async (appId: string, newStatus: string, email: string, name: string) => {
    const previousApplicants = [...applicants];
    setApplicants(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    setMovingId(appId);

    try {
        const result = await updateApplicationStatus(appId, newStatus, email, name, job?.title || "Vaga");
        if (result.emailSent) {
            toast.success(`Candidato movido para ${newStatus}`, { description: `✅ Notificação enviada para ${name}!` });
        } else {
            toast.success(`Status atualizado para ${newStatus}`, { description: "ℹ️ Status salvo (sem notificação)." });
        }
    } catch (err: any) {
        console.error(err);
        setApplicants(previousApplicants); 
        toast.error("Erro ao mover candidato", { description: err.message });
    } finally {
        setMovingId(null);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-purple-600"/></div>;
  if (!job) return <div className="p-10 text-center">Vaga não encontrada.</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col relative">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
                <MapPin size={14}/> {job.location} • {applicants.length} total
            </p>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-full">
            {COLUMNS.map(col => {
                const colApplicants = applicants.filter(app => (app.status || 'NEW') === col.id);
                return (
                    <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full max-h-full">
                        <div className={`p-3 border-b border-gray-200 rounded-t-xl font-bold text-sm flex justify-between items-center ${col.color.replace('bg-', 'bg-opacity-20 ')}`}>
                            {col.label} <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm text-gray-600">{colApplicants.length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto space-y-3 flex-1">
                            {colApplicants.length === 0 && <div className="text-center text-gray-400 text-xs py-10 italic">Vazio</div>}
                            {colApplicants.map(app => {
                                const profile = app.profiles || {};
                                const fullName = profile.full_name || "Usuário";
                                return (
                                    <div key={app.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 group hover:border-purple-300 hover:shadow-md transition-all relative">
                                        {movingId === app.id && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg"><Loader2 className="animate-spin text-purple-600" size={20}/></div>}
                                        
                                        <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={() => setSelectedCandidate(profile)}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
                                                    {fullName[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900 truncate w-32 hover:text-purple-600">{fullName}</h4>
                                                    <span className="text-[10px] text-gray-400 block">{new Date(app.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500 space-y-1 mb-3">
                                            <div className="flex items-center gap-1 truncate"><Mail size={12}/> {profile.email}</div>
                                            <div className="flex items-center gap-1"><Phone size={12}/> {profile.phone || "N/D"}</div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                                            <button onClick={() => setSelectedCandidate(profile)} className="text-xs text-gray-500 hover:text-purple-600 underline">Ver Perfil</button>
                                            <select value="" onChange={(e) => handleMove(app.id, e.target.value, profile.email, fullName)} className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-gray-50 hover:bg-white cursor-pointer outline-none focus:ring-1 focus:ring-purple-500 w-24">
                                                <option value="" disabled>Mover...</option>
                                                {COLUMNS.filter(c => c.id !== (app.status || 'NEW')).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- MODAL DE DETALHES DO CANDIDATO --- */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header do Modal */}
                <div className="bg-purple-900 p-6 text-white flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-purple-900 font-bold text-2xl">
                            {selectedCandidate.full_name?.[0]?.toUpperCase() || <User />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedCandidate.full_name}</h2>
                            <p className="text-purple-200 text-sm flex items-center gap-2 mt-1">
                                <Mail size={14}/> {selectedCandidate.email}
                            </p>
                            {selectedCandidate.phone && (
                                <p className="text-purple-200 text-sm flex items-center gap-2">
                                    <Phone size={14}/> {selectedCandidate.phone}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={() => setSelectedCandidate(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Conteúdo do Modal (Scrollável) */}
                <div className="p-8 overflow-y-auto space-y-6">
                    
                    {/* Resumo Profissional */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo Profissional</h3>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {selectedCandidate.professional_summary || "O candidato não preencheu um resumo."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Formação */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <GraduationCap size={16}/> Formação
                            </h3>
                            <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                                <p className="font-bold text-gray-900">{selectedCandidate.education_level || "Não informado"}</p>
                                {selectedCandidate.education_course && <p className="text-purple-700 font-medium">{selectedCandidate.education_course}</p>}
                                <p className="text-sm text-gray-500 mt-1">{selectedCandidate.education_institution}</p>
                                {selectedCandidate.education_end_date && <p className="text-xs text-gray-400 mt-2">Conclusão: {new Date(selectedCandidate.education_end_date).toLocaleDateString()}</p>}
                            </div>
                        </div>

                        {/* Endereço e Links */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin size={16}/> Localização
                                </h3>
                                <p className="text-gray-700">
                                    {selectedCandidate.city ? `${selectedCandidate.city} - ${selectedCandidate.state}` : "Não informado"}
                                </p>
                                {selectedCandidate.neighborhood && <p className="text-sm text-gray-500">{selectedCandidate.neighborhood}</p>}
                            </div>

                            {selectedCandidate.linkedin_url && (
                                <a 
                                    href={formatUrl(selectedCandidate.linkedin_url)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-700 hover:underline font-medium bg-blue-50 p-3 rounded-lg border border-blue-100 transition-colors"
                                >
                                    <Linkedin size={18}/> Perfil no LinkedIn
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Botão de Currículo */}
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        {selectedCandidate.resume_url ? (
                            <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${selectedCandidate.resume_url}`} target="_blank" 
                               className="bg-purple-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                                <Download size={20}/> Baixar Currículo Completo (PDF)
                            </a>
                        ) : (
                            <span className="text-gray-400 italic flex items-center gap-2"><FileText size={18}/> Sem currículo anexado</span>
                        )}
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}