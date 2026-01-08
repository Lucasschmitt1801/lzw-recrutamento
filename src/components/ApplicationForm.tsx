"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, X, Edit3, User, Mail, Phone, Paperclip } from "lucide-react";
import Link from "next/link";

interface Props {
  jobId: string;
  jobTitle: string;
}

export default function ApplicationForm({ jobId, jobTitle }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Dados do Usuário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Controle de Arquivos
  const [savedResume, setSavedResume] = useState<string | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Perguntas e Respostas
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: job } = await supabase.from('jobs').select('custom_questions').eq('id', jobId).single();
      if (job?.custom_questions) setCustomQuestions(job.custom_questions);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setEmail(session.user.email || "");
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          
        if (profile) {
          setName(profile.full_name || "");
          setPhone(profile.phone || "");
          
          if (profile.resume_url) {
            setSavedResume(profile.resume_url);
            setUseSavedResume(true);
          } else {
            setUseSavedResume(false);
          }
        }

        const { data: existingApp } = await supabase.from('applications').select('id').eq('job_id', jobId).eq('candidate_id', session.user.id).single();
        if (existingApp) setAlreadyApplied(true);
      }
      setLoadingUser(false);
    }
    loadData();
  }, [jobId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Apenas arquivos PDF são permitidos.");
        return;
      }
      setSelectedFile(file);
      setUseSavedResume(false);
    }
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profileCheck) {
         await supabase.from('profiles').insert({ id: user.id, email: user.email, full_name: name || user.email, role: 'CANDIDATE' });
      }

      let finalResumeUrl = savedResume;

      if (selectedFile) {
           const fileExt = "pdf";
           const fileName = `${user.id}_${Date.now()}.${fileExt}`;
           const filePath = `${user.id}/${fileName}`;
           const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, selectedFile);
           if (uploadError) throw uploadError;
           finalResumeUrl = filePath;
           await supabase.from('profiles').update({ resume_url: filePath }).eq('id', user.id);
      } else if (!useSavedResume) {
          throw new Error("É obrigatório enviar um currículo.");
      }

      const { error: appError } = await supabase.from('applications').insert({
            job_id: jobId,
            candidate_id: user.id,
            status: 'APPLIED',
            answers: answers
      });

      if (appError) throw appError;
      setSuccess(true);
    } catch (err: any) {
      if (err.code === '23505') setAlreadyApplied(true);
      else setError(err.message || "Erro ao enviar candidatura.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingUser) return <div className="p-12 text-center text-gray-500"><Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600 mb-2"/>Carregando seus dados...</div>;
  
  if (!user) {
      return (
        <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center shadow-lg max-w-lg mx-auto">
            <div className="mx-auto bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <User className="text-purple-600" size={32} />
            </div>
            <h3 className="font-bold text-2xl text-gray-900 mb-2">Faça login para continuar</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">Você precisa se identificar para enviar seu currículo de forma segura.</p>
            <Link href="/login" className="inline-flex items-center justify-center bg-purple-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Entrar ou Criar Conta
            </Link>
        </div>
      );
  }

  if (success) return (
      <div className="bg-white p-10 rounded-2xl border border-green-100 text-center shadow-lg animate-in fade-in zoom-in duration-300 max-w-lg mx-auto">
          <div className="mx-auto bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="text-green-500" size={40} />
          </div>
          <h3 className="font-bold text-2xl text-gray-900 mb-2">Candidatura Recebida!</h3>
          <p className="text-gray-600 mb-8">Seu currículo foi enviado para o recrutador da vaga <strong>{jobTitle}</strong>.</p>
          <Link href="/" className="inline-block text-purple-700 font-semibold hover:text-purple-900 hover:underline">
             Voltar para a lista de vagas
          </Link>
      </div>
  );

  if (alreadyApplied) return (
      <div className="bg-white p-10 rounded-2xl border border-blue-100 text-center shadow-lg max-w-lg mx-auto">
          <div className="mx-auto bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <FileText className="text-blue-500" size={40} />
          </div>
          <h3 className="font-bold text-2xl text-gray-900 mb-2">Já Candidatado</h3>
          <p className="text-gray-600">Nós já temos seu currículo para esta vaga. <br/>Agora é só aguardar!</p>
      </div>
  );

  // Pega a inicial do nome
  const userInitial = name ? name[0].toUpperCase() : user.email[0].toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* CABEÇALHO DO FORMULÁRIO */}
      <div className="bg-purple-900 p-6 sm:p-8 text-white">
        <h2 className="text-xl font-semibold opacity-90">Finalizar Candidatura</h2>
        <p className="text-purple-200 text-sm mt-1">Revise seus dados e envie seu currículo.</p>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        
        {/* 1. CARTÃO DE IDENTIFICAÇÃO (DESIGN NOVO) */}
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-gray-100">
                
                {/* Avatar */}
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-700 border-4 border-white shadow-sm shrink-0">
                    {userInitial}
                </div>

                {/* Dados */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Candidatando-se como</p>
                    <h3 className="text-lg font-bold text-gray-900 truncate">{name || "Usuário sem nome"}</h3>
                    <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5"><Mail size={14}/> {email}</span>
                        {phone && <span className="flex items-center gap-1.5"><Phone size={14}/> {phone}</span>}
                    </div>
                </div>

                {/* Botão Editar */}
                <Link href="/profile" className="self-start sm:self-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-gray-200">
                    <Edit3 size={16} /> Editar
                </Link>
            </div>
        </div>

        {/* 2. ÁREA DE UPLOAD (DESIGN NOVO) */}
        <div>
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Paperclip className="text-purple-600" /> Currículo
            </h3>

            {/* Cenário A: Arquivo Selecionado (Card de Sucesso) */}
            {selectedFile ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <FileText className="text-green-600 h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-green-900 font-semibold">{selectedFile.name}</p>
                            <p className="text-green-700 text-xs mt-0.5">Pronto para envio • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => { setSelectedFile(null); if(savedResume) setUseSavedResume(true); }}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                /* Cenário B: Sem arquivo novo (mostra salvo ou upload) */
                <div className="space-y-4">
                    {savedResume && (
                        <div 
                            onClick={() => { setUseSavedResume(true); setSelectedFile(null); }}
                            className={`cursor-pointer rounded-xl border-2 p-5 flex items-center gap-4 transition-all duration-200 ${useSavedResume ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}
                        >
                            <div className={`p-3 rounded-full shrink-0 ${useSavedResume ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className={`font-bold ${useSavedResume ? 'text-purple-900' : 'text-gray-700'}`}>Usar currículo do meu perfil</p>
                                <p className="text-sm text-gray-500">Já validado e salvo no sistema</p>
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <label className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${!useSavedResume && !selectedFile ? 'border-gray-400 bg-gray-50 hover:bg-white hover:border-purple-500 hover:shadow-md' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                            <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                                <Upload className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-base font-semibold text-gray-900 group-hover:text-purple-700">
                                {savedResume ? "Ou clique para trocar de arquivo" : "Clique para selecionar seu PDF"}
                            </span>
                            <span className="text-sm text-gray-500 mt-1">Tamanho máximo 5MB</span>
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>

        {/* 3. PERGUNTAS EXTRAS */}
        {customQuestions.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Perguntas Adicionais</h3>
                <div className="space-y-4">
                {customQuestions.map((q: any, idx) => (
                    <div key={idx}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            {q.question} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        <input 
                            type="text" 
                            required={q.required}
                            value={answers[q.question] || ""}
                            onChange={(e) => setAnswers({...answers, [q.question]: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                            placeholder="Sua resposta..."
                        />
                    </div>
                ))}
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="shrink-0" size={20} />
                <span className="text-sm font-medium">{error}</span>
            </div>
        )}

        <button 
            type="submit"
            disabled={submitting} 
            className="w-full bg-purple-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-200 transform active:scale-[0.99]"
        >
            {submitting ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={24} /> Enviando...
                </span>
            ) : (
                useSavedResume ? "Confirmar Candidatura" : "Enviar Currículo e Candidatar"
            )}
        </button>
      </div>
    </form>
  );
}