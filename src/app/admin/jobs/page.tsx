"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Users, MapPin, CheckCircle, XCircle, Edit, Eye, Loader2 } from "lucide-react";

export default function AdminJobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
    setLoading(false);
  }

  const toggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
  };

  const filtered = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vagas</h1>
          <p className="text-gray-500">Controle suas oportunidades ativas.</p>
        </div>
        <Link href="/admin/jobs/new" className="flex items-center gap-2 bg-purple-700 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-purple-800 transition-colors shadow-sm">
          <Plus size={20} /> Nova Vaga
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar vaga..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Vaga</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Candidatos</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
               <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-600"/></td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Nenhuma vaga encontrada.</td></tr>
            ) : (
               filtered.map((job) => (
                 <tr key={job.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4">
                     <div className="font-bold text-gray-900">{job.title}</div>
                     <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12}/> {job.location} • {job.work_model}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <Link href={`/admin/jobs/${job.id}`} className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-100">
                        <Users size={14} />
                        {job.applications ? job.applications[0]?.count || 0 : 0} inscritos
                     </Link>
                   </td>
                   <td className="px-6 py-4">
                     <button onClick={() => toggleStatus(job.id, job.status)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${job.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {job.status === 'OPEN' ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {job.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                     </button>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Link para ver na loja (target _blank) */}
                        <Link href={`/jobs/${job.id}`} target="_blank" className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Ver Vaga Pública">
                            <Eye size={18} />
                        </Link>
                        
                        {/* Link de Edição (CORRIGIDO) */}
                        <Link href={`/admin/jobs/${job.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Vaga">
                            <Edit size={18} />
                        </Link>
                      </div>
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