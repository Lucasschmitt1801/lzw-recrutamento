import Navbar from '@/components/Navbar';
import JobFilters from '@/components/JobFilters';
import SortSelect from '@/components/SortSelect'; // <--- IMPORT NOVO
import { supabase } from '@/lib/supabase';
import { MapPin, Banknote, Briefcase, Building2, Clock, Search } from 'lucide-react';
import Link from 'next/link';

interface SearchProps {
  searchParams: Promise<{ 
    q?: string; 
    loc?: string; 
    cat?: string;
    model?: string | string[];
    type?: string | string[];
    sort?: string; // <--- ADICIONAMOS O SORT AQUI
  }>;
}

export default async function Home({ searchParams }: SearchProps) {
  const params = await searchParams;
  const queryText = params.q || '';
  const locationText = params.loc || '';
  const categoryId = params.cat || '';
  const sortOption = params.sort || 'newest'; // <--- PADRÃO É MAIS RECENTES
  
  const workModels = Array.isArray(params.model) ? params.model : params.model ? [params.model] : [];
  const contractTypes = Array.isArray(params.type) ? params.type : params.type ? [params.type] : [];

  // --- CONSTRUÇÃO DA QUERY ---
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('status', 'OPEN');

  // Filtros
  if (queryText) query = query.ilike('title', `%${queryText}%`);
  if (locationText) query = query.ilike('location', `%${locationText}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (workModels.length > 0) query = query.in('work_model', workModels);
  if (contractTypes.length > 0) query = query.in('contract_type', contractTypes);

  // --- LÓGICA DE ORDENAÇÃO DINÂMICA ---
  switch (sortOption) {
    case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
    case 'a-z':
        query = query.order('title', { ascending: true });
        break;
    case 'z-a':
        query = query.order('title', { ascending: false });
        break;
    default: // 'newest'
        query = query.order('created_at', { ascending: false });
        break;
  }

  const { data: jobs } = await query;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {!queryText && !locationText && !categoryId && (
        <div className="bg-purple-900 py-12 text-center text-white mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Oportunidades na LZW</h1>
            <p className="mt-2 text-purple-200">Encontre a vaga perfeita para sua carreira.</p>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-8">
           <JobFilters />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="w-full">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {jobs?.length} {jobs?.length === 1 ? 'Vaga encontrada' : 'Vagas encontradas'}
                </h2>
                
                {/* --- AQUI ENTRA O COMPONENTE NOVO --- */}
                <SortSelect />
            </div>

            <div className="space-y-4">
              {jobs?.map((job) => (
                <div
                  key={job.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700">
                        {job.title}
                        </h3>
                        {isNew(job.created_at) && (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">Novo</span>
                        )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={16} className="text-gray-400" />
                        {job.work_model || 'Modelo n/d'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={16} className="text-gray-400" />
                        {job.contract_type || 'Tipo n/d'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Banknote size={16} className="text-gray-400" />
                        {job.salary_range || 'A combinar'}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> Publicado há {daysAgo(job.created_at)}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 sm:ml-6 flex shrink-0">
                    <Link 
                        href={`/jobs/${job.id}`}
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-purple-50 px-6 py-2.5 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-100"
                    >
                        Ver Detalhes
                    </Link>
                  </div>
                </div>
              ))}

              {(!jobs || jobs.length === 0) && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma vaga encontrada</h3>
                    <p className="text-gray-500">Tente ajustar os filtros ou buscar por outros termos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function daysAgo(dateString: string) {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    if (days === 0) return "hoje";
    if (days === 1) return "1 dia";
    return `${days} dias`;
}

function isNew(dateString: string) {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return days <= 3; 
}