"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import AdminGuard from "@/components/AdminGuard";
import { Save, Plus, Trash2, HelpCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Dados Básicos
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [workModel, setWorkModel] = useState("Presencial");
  const [contractType, setContractType] = useState("CLT");
  const [categoryId, setCategoryId] = useState("");
  const [requirements, setRequirements] = useState(""); // Vamos tratar como texto livre por enquanto

  // Listas do Banco
  const [categories, setCategories] = useState<any[]>([]);

  // Perguntas Personalizadas (JSON)
  const [questions, setQuestions] = useState<{ question: string; required: boolean }[]>([]);

  useEffect(() => {
    // Carrega categorias para o select
    supabase.from('job_categories').select('id, name').not('parent_id', 'is', null)
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Manipulação das Perguntas
  const addQuestion = () => {
    setQuestions([...questions, { question: "", required: false }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: 'question' | 'required', value: any) => {
    const newQuestions = [...questions];
    // @ts-ignore
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Converte requisitos (quebra de linha vira array)
      const reqArray = requirements.split('\n').filter(r => r.trim() !== "");

      const { error } = await supabase.from('jobs').insert({
        title,
        description,
        location,
        salary_range: salary,
        work_model: workModel,
        contract_type: contractType,
        category_id: categoryId || null,
        requirements: reqArray,
        custom_questions: questions, // Salva o JSON das perguntas
        status: 'OPEN'
      });

      if (error) throw error;
      
      router.push("/admin/jobs"); // Ou para o dashboard de admin futuramente
    } catch (err) {
      console.error(err);
      alert("Erro ao criar vaga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 pb-12">
        <Navbar />
        
        {/* Header */}
        <div className="bg-purple-900 pt-10 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-purple-200 hover:text-white flex items-center gap-2 text-sm mb-4">
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <h1 className="text-3xl font-bold text-white">Nova Vaga</h1>
                <p className="text-purple-200 mt-1">Cadastre uma nova oportunidade e defina as perguntas de triagem.</p>
            </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 -mt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. DADOS DA VAGA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Informações Principais</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Vaga</label>
                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Desenvolvedor Front-end Senior" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Localização</label>
                        <input type="text" required value={location} onChange={e => setLocation(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Cidade - UF ou Remoto" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Faixa Salarial</label>
                        <input type="text" value={salary} onChange={e => setSalary(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: R$ 5.000 - R$ 7.000" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo de Trabalho</label>
                        <select value={workModel} onChange={e => setWorkModel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                            <option value="Presencial">Presencial</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Remoto">Remoto</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Contrato</label>
                        <select value={contractType} onChange={e => setContractType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                            <option value="CLT">CLT</option>
                            <option value="PJ">PJ</option>
                            <option value="Estágio">Estágio</option>
                            <option value="Temporário">Temporário</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Área / Categoria</label>
                        <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white">
                            <option value="">Selecione a área...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição Completa</label>
                        <textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Detalhes sobre a vaga, responsabilidades..." />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Requisitos (Um por linha)</label>
                        <textarea rows={4} value={requirements} onChange={e => setRequirements(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex:&#10;Experiência com React&#10;Inglês Avançado" />
                    </div>
                </div>
            </div>

            {/* 2. PERGUNTAS DE TRIAGEM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b pb-2">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <HelpCircle size={20} className="text-purple-600"/> Perguntas de Triagem
                    </h2>
                    <button type="button" onClick={addQuestion} className="text-sm flex items-center gap-1 text-purple-700 font-bold hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus size={16} /> Adicionar Pergunta
                    </button>
                </div>

                <div className="space-y-4">
                    {questions.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            Nenhuma pergunta adicional configurada. O candidato enviará apenas o currículo.
                        </p>
                    )}

                    {questions.map((q, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in slide-in-from-left-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pergunta {idx + 1}</label>
                                <input 
                                    type="text" 
                                    value={q.question} 
                                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                    placeholder="Ex: Qual sua pretensão salarial? ou Você possui CNH?" 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col items-center gap-1 pt-5">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={q.required} 
                                        onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                                        className="rounded text-purple-600 focus:ring-purple-500" 
                                    />
                                    Obrigatória
                                </label>
                            </div>
                            <div className="pt-5">
                                <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded-md transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTÃO SALVAR */}
            <div className="flex justify-end pt-4 pb-20">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-800 disabled:opacity-70 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Publicar Vaga
                </button>
            </div>

          </form>
        </main>
      </div>
    </AdminGuard>
  );
}