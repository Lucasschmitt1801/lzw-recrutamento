"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Download, User, MapPin, Mail, Phone, FileText } from "lucide-react";

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'CANDIDATE')
        .order('created_at', { ascending: false });
    
    if (data) setCandidates(data);
    setLoading(false);
  }

  const filtered = candidates.filter(c => 
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.job_interests || []).join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Banco de Talentos</h1>
                <p className="text-gray-500 text-sm mt-1">
                   {filtered.length} {filtered.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}
                </p>
            </div>
            
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome, email ou cargo..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-1/3 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidato</th>
                            <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                            <th className="w-1/6 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Local</th>
                            <th className="w-1/6 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Currículo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Carregando dados...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum candidato encontrado.</td></tr>
                        ) : (
                            filtered.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-purple-50/30 transition-colors group">
                                    
                                    {/* COLUNA 1: NOME E INFO */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                                                {candidate.full_name?.[0]?.toUpperCase() || <User size={18}/>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-900 truncate" title={candidate.full_name}>
                                                    {candidate.full_name || "Sem nome"}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                    {candidate.education_level || "Escolaridade não informada"}
                                                </div>
                                                {/* Tags de interesse */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {candidate.job_interests?.slice(0, 2).map((int: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                                                            {int}
                                                        </span>
                                                    ))}
                                                    {candidate.job_interests?.length > 2 && (
                                                        <span className="text-[10px] text-gray-400 self-center">+{candidate.job_interests.length - 2}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUNA 2: CONTATO */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 truncate" title={candidate.email}>
                                                <Mail size={14} className="text-gray-400 shrink-0"/> 
                                                <span className="truncate">{candidate.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                                                <Phone size={14} className="text-gray-400 shrink-0"/> 
                                                <span>{candidate.phone || "---"}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUNA 3: LOCAL */}
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[100px]">{candidate.city || "N/D"}</span>
                                        </span>
                                    </td>

                                    {/* COLUNA 4: AÇÃO */}
                                    <td className="px-6 py-4 text-sm">
                                        {candidate.resume_url ? (
                                            <a 
                                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${candidate.resume_url}`} 
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-semibold transition-colors text-xs border border-purple-200"
                                            >
                                                <Download size={14} /> Baixar PDF
                                            </a>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-xs italic">
                                                <FileText size={14} /> Pendente
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}