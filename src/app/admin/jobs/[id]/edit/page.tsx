"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, ArrowLeft, Loader2, Trash2, Plus, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [workModel, setWorkModel] = useState("Presencial");
  const [contractType, setContractType] = useState("CLT");
  const [categoryId, setCategoryId] = useState("");
  const [requirements, setRequirements] = useState(""); 
  
  // Listas e Perguntas
  const [categories, setCategories] = useState<any[]>([]);
  const [questions, setQuestions] = useState<{ question: string; required: boolean }[]>([]);

  useEffect(() => {
    async function loadData() {
      // 1. Carrega Categorias
      const { data: cats } = await supabase.from('job_categories').select('id, name').not('parent_id', 'is', null);
      if (cats) setCategories(cats);

      // 2. Carrega Dados da Vaga
      const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).single();
      
      if (error || !job) {
        alert("Erro ao carregar vaga.");
        router.push("/admin/jobs");
        return;
      }

      // 3. Preenche o formulário (CORREÇÃO AQUI: || "" ou valor padrão para evitar null)
      setTitle(job.title || "");
      setDescription(job.description || "");
      setLocation(job.location || "");
      setSalary(job.salary_range || "");
      
      // Se vier null do banco, forçamos o padrão "Presencial" e "CLT"
      setWorkModel(job.work_model || "Presencial");
      setContractType(job.contract_type || "CLT");
      
      setCategoryId(job.category_id || "");
      setRequirements(Array.isArray(job.requirements) ? job.requirements.join("\n") : job.requirements || "");
      
      // Carrega perguntas personalizadas (se houver)
      if (job.custom_questions && Array.isArray(job.custom_questions)) {
        setQuestions(job.custom_questions);
      }

      setLoading(false);
    }
    loadData();
  }, [id, router]);

  // Funções de Perguntas
  const addQuestion = () => setQuestions([...questions, { question: "", required: false }]);
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, field: 'question' | 'required', value: any) => {
    const newQuestions = [...questions];
    // @ts-ignore
    newQuestions[idx][field] = value;
    setQuestions(newQuestions);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const reqArray = requirements.split('\n').filter(r => r.trim() !== "");

      const { error } = await supabase
        .from('jobs')
        .update({
          title,
          description,
          location,
          salary_range: salary,
          work_model: workModel,
          contract_type: contractType,
          category_id: categoryId || null,
          requirements: reqArray,
          custom_questions: questions,
        })
        .eq('id', id);

      if (error) throw error;
      
      router.push("/admin/jobs");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar vaga.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-purple-600"/></div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/jobs" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Vaga</h1>
            <p className="text-gray-500 text-sm">Atualize as informações desta oportunidade.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
            
        {/* BLOCO 1: DADOS PRINCIPAIS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Informações</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Vaga</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Localização</label>
                    <input type="text" required value={location} onChange={e => setLocation(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Faixa Salarial</label>
                    <input type="text" value={salary} onChange={e => setSalary(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo</label>
                    <select value={workModel} onChange={e => setWorkModel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                        <option value="Presencial">Presencial</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Remoto">Remoto</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contrato</label>
                    <select value={contractType} onChange={e => setContractType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                        <option value="CLT">CLT</option>
                        <option value="PJ">PJ</option>
                        <option value="Estágio">Estágio</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Área / Categoria</label>
                    <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                        <option value="">Selecione...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                    <textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Requisitos (Um por linha)</label>
                    <textarea rows={4} value={requirements} onChange={e => setRequirements(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
            </div>
        </div>

        {/* BLOCO 2: PERGUNTAS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <HelpCircle size={20} className="text-purple-600"/> Perguntas Extras
                </h2>
                <button type="button" onClick={addQuestion} className="text-sm flex items-center gap-1 text-purple-700 font-bold hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={16} /> Adicionar
                </button>
            </div>

            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pergunta {idx + 1}</label>
                            <input 
                                type="text" 
                                value={q.question} 
                                onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div className="pt-7">
                            <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded-md">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end gap-3">
            <Link href="/admin/jobs" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                Cancelar
            </Link>
            <button 
                type="submit" 
                disabled={saving}
                className="bg-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-purple-800 disabled:opacity-70 flex items-center gap-2"
            >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Salvar Alterações
            </button>
        </div>

      </form>
    </div>
  );
}