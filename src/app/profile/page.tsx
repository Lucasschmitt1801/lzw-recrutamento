"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, Phone, Linkedin, Search, X, Plus, Home, GraduationCap, FileText, Upload, Trash2, CheckCircle } from "lucide-react";

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

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      // Carrega categorias para o autocomplete
      const { data: cats } = await supabase.from('job_categories').select('id, name').not('parent_id', 'is', null);
      setAllCategories(cats || []);

      // Carrega perfil
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (profile) {
        // Usamos || "" para garantir que nunca seja null (o que quebrava o React)
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

  // --- UPLOAD DE CURRÍCULO ---
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.type !== "application/pdf") {
        alert("Apenas arquivos PDF são permitidos.");
        return;
    }

    setUploadingResume(true);
    try {
        const fileExt = "pdf";
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);
        if (uploadError) throw uploadError;

        // Atualiza URL no perfil
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

  // --- BUSCA DE CEP ---
  const handleBlurCep = async () => {
    const cepLimpo = zipCode.replace(/\D/g, '');
    if (cepLimpo.length === 8) return; {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setState(data.uf);
          document.getElementById('number')?.focus();
        }
      } catch (error) { console.error("Erro CEP"); } finally { setLoadingCep(false); }
    }
  };

  // --- INTERESSES ---
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

  // --- SALVAR PERFIL ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          state,
          education_level: educationLevel, 
          education_institution: institution, 
          education_course: courseName, 
          education_end_date: endDate,
          professional_summary: summary, 
          job_interests: myInterests,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);

      if (error) throw error;
      
      setMessage({ text: "Perfil atualizado com sucesso!", type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    
    } catch (err: any) { 
        console.error(err);
        // AQUI ESTÁ A CORREÇÃO: Mostramos o erro real do Supabase
        setMessage({ text: `Erro ao salvar: ${err.message || "Verifique os dados."}`, type: 'error' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { 
        setSaving(false); 
    }
  };

  const needsCourseName = ['Técnico', 'Superior Cursando', 'Superior Completo', 'Pós-graduação / MBA'].includes(educationLevel);
  const isStudying = educationLevel.includes('Cursando') || educationLevel === 'Ensino Médio';

  if (loading) return <div className="p-10 text-center text-black">Carregando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="bg-purple-900 pb-24 pt-10">
         <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="text-3xl font-bold text-white">Meu Perfil Profissional</h1>
            <p className="mt-2 text-purple-200">Preencha seus dados para que os recrutadores te encontrem.</p>
         </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-16 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
            
            {/* MENSAGEM DE FEEDBACK */}
            {message && (
                <div className={`p-4 rounded-lg text-center font-bold border ${message.type === 'error' ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                    {message.text}
                </div>
            )}

            {/* --- SEÇÃO: CURRÍCULO (Área de Upload) --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <FileText className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Currículo (PDF)</h2>
                </div>

                {resumeUrl ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full border border-green-200">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-green-900">Currículo Cadastrado</p>
                                <p className="text-xs text-green-700">Pronto para uso.</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleDeleteResume} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Excluir">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-purple-400 transition-all group">
                        {uploadingResume ? (
                            <div className="flex flex-col items-center pt-5 pb-6">
                                <Loader2 className="w-10 h-10 mb-3 text-purple-600 animate-spin" />
                                <p className="text-sm text-gray-500">Enviando seu arquivo...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                   <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-600" />
                                </div>
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-bold text-purple-700">Clique aqui</span> para selecionar o arquivo
                                </p>
                                <p className="text-xs text-gray-500">Formato PDF (Tamanho máx. 5MB)</p>
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
                        <label className="block text-sm font-medium text-black">Nome Completo</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-black">WhatsApp</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" required placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-black">LinkedIn</label>
                        <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" placeholder="https://linkedin.com/in/..." />
                    </div>
                </div>
            </div>

            {/* --- SEÇÃO 2: ENDEREÇO --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Home className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Endereço</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-black">CEP</label>
                        <div className="relative mt-1">
                             <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} onBlur={handleBlurCep}
                             className="w-full border rounded-md p-2 text-black" placeholder="00000-000" />
                             {loadingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-purple-600" />}
                        </div>
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-black">Cidade</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black bg-gray-50" />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-black">Rua</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-black">Número</label>
                        <input id="number" type="text" value={number} onChange={e => setNumber(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-black">Bairro</label>
                        <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black" />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-black">Estado</label>
                        <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black bg-gray-50" maxLength={2} />
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
                        <label className="block text-sm font-medium text-black">Nível</label>
                        <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-black bg-white">
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
                                <div className="sm:col-span-2 animate-in fade-in">
                                    <label className="block text-sm font-medium text-black">Curso</label>
                                    <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} className="w-full border rounded-md p-2 text-black" placeholder="Ex: Administração" />
                                </div>
                            )}
                            <div className="sm:col-span-1 animate-in fade-in">
                                <label className="block text-sm font-medium text-black">Instituição</label>
                                <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} className="w-full border rounded-md p-2 text-black" placeholder="Ex: USP" />
                            </div>
                            <div className="sm:col-span-1 animate-in fade-in">
                                <label className="block text-sm font-medium text-black">{isStudying ? "Previsão" : "Conclusão"}</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-md p-2 text-black" />
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-black">Resumo Profissional</label>
                    <textarea rows={4} value={summary} onChange={e => setSummary(e.target.value)} className="w-full border rounded-md p-2 text-black" placeholder="Conte brevemente sobre suas experiências..." />
                </div>
            </div>

            {/* --- SEÇÃO 4: OBJETIVOS --- */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Search className="text-purple-700" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Objetivos Profissionais</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                    {myInterests.map(i => (
                    <span key={i} className="inline-flex items-center rounded-full bg-purple-100 py-1 pl-3 pr-2 text-sm font-medium text-purple-800">
                        {i} <button type="button" onClick={() => removeInterest(i)} className="ml-1"><X size={14} /></button>
                    </span>
                    ))}
                </div>
                <div className="relative">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2 px-3 border text-black" placeholder="Adicionar área..." />
                    
                    {searchTerm.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md max-h-48 overflow-y-auto">
                        {suggestions.map((cat) => (
                            <div key={cat.id} onClick={() => addInterest(cat.name)} className="cursor-pointer px-4 py-2 hover:bg-purple-50 text-black">
                                {cat.name}
                            </div>
                        ))}
                        {suggestions.length === 0 && (
                            <div onClick={() => addInterest(searchTerm)} className="cursor-pointer px-4 py-2 text-purple-700 hover:bg-purple-50 flex items-center gap-2">
                                <Plus size={14} /> Adicionar "{searchTerm}"
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4 pb-12">
              <button type="submit" disabled={saving} className="flex items-center rounded-lg bg-purple-700 px-8 py-3 text-white font-bold hover:bg-purple-800 shadow-lg disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Salvar Currículo Completo
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}