"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { MapPin, Briefcase, Banknote, CheckCircle, Building2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PublicJobDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      // 1. Pega usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (!id) return;

      // 2. Busca dados da vaga
      const { data: jobData, error } = await supabase.from('jobs').select('*').eq('id', id).single();
      
      if (error) {
        console.error("Erro ao buscar vaga:", error);
        setLoading(false);
        return;
      }
      
      setJob(jobData);

      // 3. Se estiver logado, verifica se já se candidatou
      if (session?.user && jobData) {
        const { data: app } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', jobData.id)
            .eq('user_id', session.user.id)
            .maybeSingle();
            
        if (app) setHasApplied(true);
      }
      setLoading(false);
    }
    loadJob();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
        // Salva a url para voltar depois do login
        document.cookie = `redirectTo=/jobs/${id}; path=/;`;
        router.push("/login");
        return;
    }

    setApplying(true);
    try {
        // Cria a candidatura
        const { error } = await supabase.from('applications').insert({
            job_id: job.id,
            user_id: user.id,
            status: 'NEW'
        });

        if (error) throw error;

        setHasApplied(true);
        toast.success("Candidatura enviada com sucesso!", {
            description: "Boa sorte! O recrutador já recebeu seu perfil."
        });

    } catch (err: any) {
        console.error(err);
        toast.error("Erro ao se candidatar", {
            description: err.message || "Tente novamente."
        });
    } finally {
        setApplying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40}/></div>;
  
  if (!job) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p className="text-xl font-bold mb-4">Vaga não encontrada</p>
        <Link href="/" className="text-purple-600 hover:underline">Voltar para o início</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      
      {/* HEADER DA VAGA */}
      <div className="bg-purple-900 text-white py-16 relative">
        <div className="max-w-4xl mx-auto px-6">
            <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-6 text-sm transition-colors">
                <ArrowLeft size={16}/> Voltar para vagas
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">{job.title}</h1>
            <div className="flex flex-wrap gap-4 mt-6 text-purple-100 text-sm font-medium">
                <span className="flex items-center gap-1.5 bg-purple-800/50 px-3 py-1 rounded-full"><MapPin size={16}/> {job.location}</span>
                <span className="flex items-center gap-1.5 bg-purple-800/50 px-3 py-1 rounded-full"><Building2 size={16}/> {job.work_model}</span>
                <span className="flex items-center gap-1.5 bg-purple-800/50 px-3 py-1 rounded-full"><Briefcase size={16}/> {job.contract_type}</span>
                <span className="flex items-center gap-1.5 bg-purple-800/50 px-3 py-1 rounded-full"><Banknote size={16}/> {job.salary_range || "A combinar"}</span>
            </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 md:p-10">
            
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-purple-500 pl-3">Sobre a Vaga</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                    {job.description}
                </div>
            </div>

            {job.requirements && (
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-purple-500 pl-3">Requisitos</h2>
                    <ul className="space-y-3">
                        {Array.isArray(job.requirements) 
                            ? job.requirements.map((req: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-700">
                                    <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0"/> 
                                    <span>{req}</span>
                                </li>
                            ))
                            : <li className="text-gray-700 whitespace-pre-wrap">{job.requirements}</li>
                        }
                    </ul>
                </div>
            )}

            <hr className="my-10 border-gray-100" />

            {/* BARRA DE AÇÃO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-purple-50 p-8 rounded-2xl border border-purple-100">
                <div>
                    <p className="font-bold text-gray-900 text-lg">Interessado nesta oportunidade?</p>
                    <p className="text-gray-600">Envie seu perfil para análise agora mesmo.</p>
                </div>
                
                {hasApplied ? (
                    <button disabled className="bg-green-100 text-green-700 px-8 py-4 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed text-lg w-full sm:w-auto justify-center">
                        <CheckCircle size={24} /> Já Candidatado
                    </button>
                ) : (
                    <button 
                        onClick={handleApply} 
                        disabled={applying}
                        className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 disabled:opacity-70 flex items-center gap-2 text-lg w-full sm:w-auto justify-center"
                    >
                        {applying && <Loader2 className="animate-spin" size={24} />}
                        {applying ? "Enviando..." : "Quero me candidatar"}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}