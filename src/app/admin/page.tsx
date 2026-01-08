"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Briefcase, FileText, TrendingUp, Clock, ArrowRight, Activity, Plus } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Estados de Métricas
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    totalApplications: 0
  });

  // Dados para o Gráfico e Listas
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. CARREGAR NÚMEROS TOTAIS
        const { count: candidatesCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: jobsCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'OPEN');
        
        const { count: appCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });

        setStats({
            totalCandidates: candidatesCount || 0,
            activeJobs: jobsCount || 0,
            totalApplications: appCount || 0
        });

        // 2. CARREGAR DADOS PARA O GRÁFICO (Vagas por Categoria)
        const { data: jobs } = await supabase
            .from('jobs')
            .select('category_id, job_categories(name)')
            .eq('status', 'OPEN');

        if (jobs) {
            const categoryCounts: Record<string, number> = {};
            jobs.forEach((job: any) => {
                const catName = job.job_categories?.name || "Geral";
                categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
            });

            // Formata para o Recharts
            const formattedChart = Object.keys(categoryCounts).map(key => ({
                name: key,
                vagas: categoryCounts[key]
            })).sort((a, b) => b.vagas - a.vagas).slice(0, 5);

            setChartData(formattedChart);
        }

        // 3. CARREGAR ÚLTIMAS CANDIDATURAS
        const { data: recentApps } = await supabase
            .from('applications')
            .select(`
                id,
                created_at,
                job_id,
                jobs (title),
                profiles (full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentApps) setRecentApplications(recentApps);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="text-purple-600 font-bold animate-pulse">Carregando painel...</div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
            <p className="text-gray-500">Acompanhe o desempenho do seu recrutamento em tempo real.</p>
        </div>
        <Link href="/admin/jobs/new" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
            <Plus size={20} /> Nova Vaga
        </Link>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-purple-300 transition-all">
            <div>
                <p className="text-sm font-medium text-gray-500">Banco de Talentos</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCandidates}</h3>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-2">
                    <Users size={12} /> Profissionais cadastrados
                </span>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Users size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-purple-300 transition-all">
            <div>
                <p className="text-sm font-medium text-gray-500">Vagas Ativas</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activeJobs}</h3>
                <span className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-2">
                    <Briefcase size={12} /> Oportunidades abertas
                </span>
            </div>
            <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-purple-300 transition-all">
            <div>
                <p className="text-sm font-medium text-gray-500">Total de Candidaturas</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplications}</h3>
                <span className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-2">
                    <TrendingUp size={12} /> Interesse total gerado
                </span>
            </div>
            <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <FileText size={24} />
            </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: GRÁFICO E LISTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA (2/3): GRÁFICO */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Activity size={20} className="text-purple-600"/> 
                    Vagas por Área
                </h3>
             </div>
             
             {/* AQUI ESTÁ A CORREÇÃO: DIV COM ALTURA FIXA E VERIFICAÇÃO DE DADOS */}
             {chartData.length > 0 ? (
                 <div className="h-72 w-full" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 12, fill: '#6b7280'}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 12, fill: '#6b7280'}} 
                                allowDecimals={false}
                            />
                            <Tooltip 
                                cursor={{fill: '#f3f4f6'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="vagas" radius={[6, 6, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7e22ce' : '#a855f7'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
             ) : (
                <div className="h-72 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <Briefcase size={32} className="mb-2 opacity-50"/>
                    <p>Sem dados de vagas ainda.</p>
                </div>
             )}
          </div>

          {/* COLUNA DIREITA (1/3): ATIVIDADE RECENTE */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <Clock size={20} className="text-blue-600"/>
                 Últimas Candidaturas
              </h3>
              
              <div className="space-y-4 flex-1">
                  {recentApplications.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">Nenhuma candidatura recente.</p>
                  ) : (
                      recentApplications.map((app) => (
                          <div key={app.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                                  {app.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                      {app.profiles?.full_name || "Usuário Desconhecido"}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                      Aplicou para: <span className="text-purple-600 font-medium">{app.jobs?.title || "Vaga removida"}</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                      {new Date(app.created_at).toLocaleDateString('pt-BR')} às {new Date(app.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                              </div>
                              <Link href={`/admin/jobs/${app.job_id}`} className="text-gray-400 hover:text-purple-600 transition-colors">
                                  <ArrowRight size={16} />
                              </Link>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                 <Link href="/admin/jobs" className="text-sm text-purple-700 font-bold hover:underline flex items-center justify-center gap-1">
                    Ver todas as vagas <ArrowRight size={14}/>
                 </Link>
              </div>
          </div>
      </div>
    </div>
  );
}