"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, X, CheckCircle, AlertCircle, FileText, User, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  jobId: string;
  jobTitle: string;
}

export default function ApplyButton({ jobId, jobTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Carregando dados do usuário
  const [applying, setApplying] = useState(false); // Enviando candidatura
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do Usuário
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const openModal = async () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    
    // Busca usuário e perfil
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(prof);

      // Verifica se já se candidatou
      const { data: app } = await supabase.from('applications').select('id').eq('job_id', jobId).eq('candidate_id', session.user.id).single();
      if(app) {
         setError("Você já se candidatou para esta vaga.");
      }
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!user || !profile) return;
    setApplying(true);
    
    try {
      const { error: err } = await supabase.from('applications').insert({
        job_id: jobId,
        candidate_id: user.id,
        status: 'APPLIED'
      });
      if (err) throw err;
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao se candidatar. Tente novamente.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      {/* O BOTÃO QUE APARECE NA PÁGINA */}
      <button 
        onClick={openModal}
        className="flex w-full items-center justify-center rounded-lg bg-purple-700 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-purple-800 transition-transform active:scale-95"
      >
        Candidatar-se Agora
      </button>

      {/* O MODAL (Janela Flutuante) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Cabeçalho Modal */}
            <div className="bg-purple-900 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Confirme sua Candidatura</h3>
                <p className="text-purple-200 text-sm mt-1">{jobTitle}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-purple-200 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-10 text-center text-gray-500">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2 text-purple-600" />
                  Carregando seus dados...
                </div>
              ) : !user ? (
                <div className="text-center py-6">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="text-gray-400" size={32} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Faça login para continuar</h4>
                  <p className="text-gray-500 text-sm mb-6">Você precisa de uma conta para se candidatar.</p>
                  <Link href="/login" className="inline-block bg-purple-700 text-white px-6 py-2 rounded-full font-medium">
                    Entrar / Criar Conta
                  </Link>
                </div>
              ) : success ? (
                <div className="text-center py-6">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h4 className="font-bold text-green-900 text-xl mb-2">Sucesso!</h4>
                  <p className="text-gray-600 mb-6">Sua candidatura foi enviada para o recrutador.</p>
                  <button onClick={() => setIsOpen(false)} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
                    Fechar Janela
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Resumo do Candidato */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Seus Dados</p>
                    <div className="flex items-center gap-3 mb-2">
                        <User size={18} className="text-purple-600" />
                        <span className="font-semibold text-gray-900">{profile?.full_name || user.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone size={18} className="text-purple-600" />
                        <span className="text-gray-700">{profile?.phone || "Telefone não informado"}</span>
                    </div>
                  </div>

                  {/* Resumo do Currículo */}
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Currículo Selecionado</p>
                     {profile?.resume_url ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FileText className="text-green-600" size={24} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-green-900 truncate">Currículo Cadastrado.pdf</p>
                                <p className="text-xs text-green-700">Pronto para envio</p>
                            </div>
                            <CheckCircle className="text-green-600" size={18} />
                        </div>
                     ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
                            <p className="text-red-800 font-bold text-sm">Nenhum currículo encontrado!</p>
                            <p className="text-red-600 text-xs mb-3">Você precisa cadastrar seu currículo no perfil.</p>
                            <Link href="/profile" className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded-md font-semibold hover:bg-red-200">
                                Ir para Meu Perfil
                            </Link>
                        </div>
                     )}
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                    </div>
                  )}

                  {/* Botão de Ação */}
                  <button 
                    onClick={handleConfirm}
                    disabled={applying || !profile?.resume_url || error?.includes("já se candidatou")}
                    className="w-full bg-purple-700 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                  >
                    {applying ? <Loader2 className="animate-spin" /> : <>Confirmar e Enviar <ArrowRight size={20}/></>}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Ao confirmar, seus dados de perfil serão compartilhados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}