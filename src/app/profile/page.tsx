"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, Phone, Linkedin, Search, X, Plus, Home, GraduationCap, FileText, Upload, Trash2, CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner"; // Opcional: se não tiver o sonner instalado, use alert ou remova

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 1. DADOS PESSOAIS
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  
  // 2. ENDEREÇO
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  // 3. PROFISSIONAL
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [courseName, setCourseName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState("");
  const [myInterests, setMyInterests] = useState<string[]>([]);
  
  // 4. CURRÍCULO
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Autocomplete
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  
  // Mensagens de Feedback
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // --- MÁSCARA DE TELEFONE ---
  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\={11,})/, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: cats } = await supabase.from('job_categories').select('id, name').not('parent_id', 'is', null);
      setAllCategories(cats || []);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setLinkedin(profile.linkedin_url || "");
        setZipCode(profile.zip_code || "");
        setAddress(profile.address || "");
        setNumber(profile.number || "");
        setNeighborhood(profile.neighborhood || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setEducationLevel(profile.education_level || "");
        setInstitution(profile.education_institution || "");
        setCourseName(profile.education_course || "");
        setEndDate(profile.education_end_date || "");
        setSummary(profile.professional_summary || "");
        setMyInterests(profile.job_interests || []);
        setResumeUrl(profile.resume_url || null);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  // --- BUSCA DE CEP (CORRIGIDA) ---
  const handleBlurCep = async () => {
    const cepLimpo = zipCode.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return; // Corrigido: deve ser exatamente 8

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setAddress(data.logradouro);
        setNeighborhood(data.bairro);
        setCity(data.localidade);
        setState(data.uf);
        // Pequeno delay para garantir que o React renderizou o campo antes do foco
        setTimeout(() => document.getElementById('number')?.focus(), 100);
      } else {
        setMessage({ text: "CEP não encontrado.", type: 'error' });
      }
    } catch (error) { 
        console.error("Erro CEP"); 
        setMessage({ text: "Erro ao buscar CEP automaticamente.", type: 'error' });
    } finally { 
        setLoadingCep(false); 
    }
  };

  // --- UPLOAD DE CURRÍCULO ---
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.type !== "application/pdf") {
        setMessage({ text: "Apenas arquivos PDF são permitidos.", type: 'error' });
        return;
    }

    setUploadingResume(true);
    try {
        const fileExt = "pdf";
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);
        if (uploadError) throw uploadError;

        await supabase.from('profiles').update({ resume_url: filePath }).eq('id', user.id);
        
        setResumeUrl(filePath);
        setMessage({ text: "Currículo anexado com sucesso!", type: 'success' });
    } catch (err: any) {
        console.error(err);
        setMessage({ text: `Erro no upload: ${err.message}`, type: 'error' });
    } finally {
        setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
      if(!user) return;
      await supabase.from('profiles').update({ resume_url: null }).eq('id', user.id);
      setResumeUrl(null);
      setMessage({ text: "Currículo removido.", type: 'success' });
  };

  const addInterest = (name: string) => { 
      if (!myInterests.includes(name)) setMyInterests([...myInterests, name]); 
      setSearchTerm(""); 
      setSuggestions([]); 
  };
  
  const removeInterest = (name: string) => { 
      setMyInterests(myInterests.filter(i => i !== name)); 
  };
  
  useEffect(() => {
    if (searchTerm.length < 2) { setSuggestions([]); return; }
    const filtered = allCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !myInterests.includes(c.name));
    setSuggestions(filtered);
  }, [searchTerm, allCategories, myInterests]);

  // --- SALVAR PERFIL (BLINDADO) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeUrl) {
        setMessage({ type: 'error', text: 'Por favor, faça upload do seu currículo em PDF.' });
        window.scrollTo(0, 0);
        return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('profiles').update({
          full_name: fullName, 
          phone, 
          linkedin_url: linkedin,
          zip_code: zipCode, 
          address, 
          number, 
          neighborhood, 
          city, 
          state: state.toUpperCase(),
          education_level: educationLevel, 
          education_institution: institution, 
          education_course: courseName, 
          education_end_date: endDate === "" ? null : endDate, // TRATAMENTO DO ERRO DE DATA
          professional_summary: summary, 
          job_interests: myInterests,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const needsCourseName = ['Técnico', 'Superior Cursando', 'Superior Completo', 'Pós-graduação / MBA'].includes(educationLevel);
  const isStudying = educationLevel.includes('Cursando') || educationLevel === 'Ensino Médio';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-gray-500 font-medium">Carregando seu perfil...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="bg-purple-900 pb-24 pt-10 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-white">Meu Perfil Profissional</h1>
            <p className="mt-2 text-purple-200">Preencha seus dados para que os recrutadores te encontrem.</p>
          </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-16 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
            
            {message && (
                <div className={`p-4 rounded-xl text-center font-bold border animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                    {message.text}
                </div>
            )}

            {/* --- SEÇÃO: CURRÍCULO --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <FileText className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Currículo (PDF) <span className="text-red-500">*</span></h2>
                </div>

                {resumeUrl ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg transition-all">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-green-200 shadow-sm">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-green-900">Currículo Cadastrado</p>
                                <p className="text-xs text-green-700">Seu perfil está visível para recrutadores.</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleDeleteResume} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Excluir">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-purple-50 hover:border-purple-400 transition-all group">
                        {uploadingResume ? (
                            <div className="flex flex-col items-center pt-5 pb-6">
                                <Loader2 className="w-10 h-10 mb-3 text-purple-600 animate-spin" />
                                <p className="text-sm text-gray-500">Enviando currículo...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                   <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-600" />
                                </div>
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-bold text-purple-700">Clique aqui</span> para selecionar seu currículo
                                </p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Somente PDF (Máx. 5MB)</p>
                            </div>
                        )}
                        <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                    </label>
                )}
            </div>

            {/* --- SEÇÃO 1: DADOS PESSOAIS --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <User className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">WhatsApp <span className="text-red-500">*</span></label>
                        <input type="text" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" required placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">LinkedIn</label>
                        <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="linkedin.com/in/perfil" />
                    </div>
                </div>
            </div>

            {/* --- SEÇÃO 2: ENDEREÇO --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Home className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Onde você mora?</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">CEP <span className="text-red-500">*</span></label>
                        <div className="relative mt-1">
                             <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} onBlur={handleBlurCep} required
                             className="w-full border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="00000-000" />
                             {loadingCep && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-purple-600" />}
                        </div>
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-bold text-gray-700">Cidade <span className="text-red-500">*</span></label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-bold text-gray-700">Rua <span className="text-red-500">*</span></label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">Número <span className="text-red-500">*</span></label>
                        <input id="number" type="text" value={number} onChange={e => setNumber(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-bold text-gray-700">Bairro <span className="text-red-500">*</span></label>
                        <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-bold text-gray-700">Estado <span className="text-red-500">*</span></label>
                        <input type="text" value={state} onChange={e => setState(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none" maxLength={2} placeholder="UF" />
                    </div>
                </div>
            </div>

            {/* --- SEÇÃO 3: FORMAÇÃO --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <GraduationCap className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Formação Acadêmica</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">Nível de Escolaridade <span className="text-red-500">*</span></label>
                        <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} required className="w-full mt-1 border rounded-md p-2.5 text-black bg-white focus:ring-2 focus:ring-purple-500 outline-none">
                            <option value="">Selecione...</option>
                            <option value="Ensino Médio">Ensino Médio</option>
                            <option value="Técnico">Técnico</option>
                            <option value="Superior Cursando">Superior Cursando</option>
                            <option value="Superior Completo">Superior Completo</option>
                            <option value="Pós-graduação / MBA">Pós-graduação / MBA</option>
                        </select>
                    </div>

                    {educationLevel && (
                        <>
                            {needsCourseName && (
                                <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold text-gray-700">Nome do Curso <span className="text-red-500">*</span></label>
                                    <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required className="w-full border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Administração de Empresas" />
                                </div>
                            )}
                            <div className="sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-gray-700">Instituição <span className="text-red-500">*</span></label>
                                <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} required className="w-full border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Unisinos" />
                            </div>
                            <div className="sm:col-span-1 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-gray-700">{isStudying ? "Previsão de Conclusão" : "Data de Conclusão"} <span className="text-red-500">*</span></label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full border rounded-md p-2.5 text-black focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Resumo Profissional <span className="text-red-500">*</span></label>
                    <textarea rows={4} value={summary} onChange={e => setSummary(e.target.value)} required className="w-full border rounded-md p-3 text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Destaque suas principais habilidades e experiências..." />
                    <p className="text-xs text-gray-400 mt-1">Mínimo sugerido: 100 caracteres.</p>
                </div>
            </div>

            {/* --- SEÇÃO 4: OBJETIVOS --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Search className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Áreas de Interesse</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Selecione as áreas em que você deseja trabalhar para ser notificado.</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {myInterests.map(i => (
                    <span key={i} className="inline-flex items-center rounded-full bg-purple-100 py-1.5 pl-4 pr-2 text-sm font-bold text-purple-800 border border-purple-200 shadow-sm animate-in zoom-in">
                        {i} <button type="button" onClick={() => removeInterest(i)} className="ml-2 hover:bg-purple-200 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                    </span>
                    ))}
                    {myInterests.length === 0 && <span className="text-gray-400 italic text-sm">Nenhuma área selecionada...</span>}
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2.5 pl-10 pr-3 border text-black focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Comercial, TI, RH..." />
                    
                    {searchTerm.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white shadow-xl border rounded-lg max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5">
                        {suggestions.map((cat) => (
                            <div key={cat.id} onClick={() => addInterest(cat.name)} className="cursor-pointer px-4 py-3 hover:bg-purple-50 text-gray-900 font-medium border-b last:border-0">
                                {cat.name}
                            </div>
                        ))}
                        {suggestions.length === 0 && (
                            <div onClick={() => addInterest(searchTerm)} className="cursor-pointer px-4 py-3 text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-bold transition-colors">
                                <Plus size={16} /> Adicionar "{searchTerm}"
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4 pb-12">
              <button type="submit" disabled={saving} className="flex items-center rounded-xl bg-purple-700 px-10 py-4 text-white font-bold hover:bg-purple-800 shadow-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Salvar Perfil Profissional
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}