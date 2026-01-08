"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Search, MapPin, Filter, ChevronDown, ChevronUp, Check, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("loc") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sugestões
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [filteredTitles, setFilteredTitles] = useState<string[]>([]);

  // Dropdowns
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  
  const locRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Filtros Avançados
  const [workModel, setWorkModel] = useState<string[]>(searchParams.getAll("model"));
  const [contractType, setContractType] = useState<string[]>(searchParams.getAll("type"));
  const [categoryId, setCategoryId] = useState(searchParams.get("cat") || "");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadFilters() {
      const { data: cats } = await supabase.from('job_categories').select('id, name').not('parent_id', 'is', null);
      if (cats) setCategories(cats);

      const { data: dynamicFilters, error } = await supabase.rpc('get_active_job_filters');
      
      if (dynamicFilters && !error) {
        let locs = dynamicFilters.locations || [];
        if (dynamicFilters.has_remote && !locs.includes('Remoto')) {
            locs = ['Remoto', ...locs];
        }
        setAvailableLocations(locs);
        setFilteredLocations(locs);

        setAvailableTitles(dynamicFilters.titles || []);
        setFilteredTitles(dynamicFilters.titles || []);
      }
    }
    loadFilters();

    const handleClickOutside = (event: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(event.target as Node)) setShowLocDropdown(false);
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) setShowTitleDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!location) setFilteredLocations(availableLocations);
    else setFilteredLocations(availableLocations.filter(L => L.toLowerCase().includes(location.toLowerCase())));
  }, [location, availableLocations]);

  useEffect(() => {
    if (!query) setFilteredTitles(availableTitles);
    else setFilteredTitles(availableTitles.filter(T => T.toLowerCase().includes(query.toLowerCase())));
  }, [query, availableTitles]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    
    if (location === "Remoto") {
        if(!workModel.includes('Remoto')) params.append("model", "Remoto");
    } else if (location) {
        params.set("loc", location);
    }
    
    if (categoryId) params.set("cat", categoryId);
    workModel.forEach(m => params.append("model", m));
    contractType.forEach(t => params.append("type", t));
    
    setShowLocDropdown(false);
    setShowTitleDropdown(false);
    router.push(`/?${params.toString()}`);
  };

  const toggleModel = (val: string) => setWorkModel(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  const toggleType = (val: string) => setContractType(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  const activeFiltersCount = workModel.length + contractType.length + (categoryId ? 1 : 0);

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 mb-8 relative z-20">
      
      {/* LAYOUT BLINDADO: 
         - flex-wrap: Se não couber, quebra linha.
         - h-14: Altura fixa para todos.
         - min-w-[200px]: Largura mínima obrigatória.
      */}
      <div className="p-4 flex flex-wrap lg:flex-nowrap items-center gap-4">
        
        {/* INPUT 1: CARGO */}
        <div className="relative z-30 w-full lg:flex-1 min-w-[240px]" ref={titleRef}>
            <div className="relative w-full h-12">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input 
                    type="text" 
                    placeholder="Cargo ou palavra-chave" 
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowTitleDropdown(true); }}
                    onFocus={() => setShowTitleDropdown(true)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                    className="w-full h-full pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-gray-400"
                />
            </div>
            {showTitleDropdown && filteredTitles.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto w-full z-50">
                    {filteredTitles.map((item, idx) => (
                        <li 
                            key={idx} 
                            onClick={() => { setQuery(item); setShowTitleDropdown(false); }}
                            className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2 border-b border-gray-50 last:border-0"
                        >
                            <Search size={14} className="text-gray-400 shrink-0"/> 
                            <span className="truncate">{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* INPUT 2: LOCAL */}
        <div className="relative z-20 w-full lg:flex-1 min-w-[240px]" ref={locRef}>
            <div className="relative w-full h-12">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input 
                    type="text" 
                    placeholder="Cidade ou 'Remoto'" 
                    value={location}
                    onChange={e => { setLocation(e.target.value); setShowLocDropdown(true); }}
                    onFocus={() => setShowLocDropdown(true)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                    className="w-full h-full pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-gray-400"
                />
            </div>
            {showLocDropdown && filteredLocations.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto w-full z-50">
                    {filteredLocations.map((item, idx) => (
                        <li 
                            key={idx} 
                            onClick={() => { setLocation(item); setShowLocDropdown(false); }}
                            className="px-4 py-3 hover:bg-purple-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2 border-b border-gray-50 last:border-0"
                        >
                            {item === 'Remoto' ? <Briefcase size={14} className="text-purple-500 shrink-0"/> : <MapPin size={14} className="text-gray-400 shrink-0"/>}
                            <span className="truncate">{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* BOTÕES */}
        <div className="flex items-center gap-3 w-full lg:w-auto min-w-[220px]">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`h-12 flex-1 flex items-center justify-center gap-2 px-6 rounded-lg border font-medium transition-colors whitespace-nowrap ${showAdvanced || activeFiltersCount > 0 ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
                <Filter size={18} />
                <span>Filtros</span>
                {activeFiltersCount > 0 && <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">{activeFiltersCount}</span>}
                {showAdvanced ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            
            <button 
                onClick={applyFilters}
                className="h-12 flex-1 bg-purple-700 text-white px-8 rounded-lg font-bold hover:bg-purple-800 transition-colors shadow-sm whitespace-nowrap"
            >
                Buscar
            </button>
        </div>
      </div>

      {/* ÁREA EXPANSÍVEL */}
      {showAdvanced && (
        <div className="border-t border-gray-200 p-6 bg-gray-50 relative z-0 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Área</h4>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 h-10 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-purple-500">
                        <option value="">Todas as áreas</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Modelo</h4>
                    <div className="space-y-2.5">
                        {['Remoto', 'Híbrido', 'Presencial'].map((m) => (
                            <label key={m} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${workModel.includes(m) ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                    {workModel.includes(m) && <Check size={14} className="text-white"/>}
                                    <input type="checkbox" className="hidden" checked={workModel.includes(m)} onChange={() => toggleModel(m)} />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{m}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contrato</h4>
                    <div className="space-y-2.5">
                        {['CLT', 'PJ', 'Estágio'].map((t) => (
                            <label key={t} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${contractType.includes(t) ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                    {contractType.includes(t) && <Check size={14} className="text-white"/>}
                                    <input type="checkbox" className="hidden" checked={contractType.includes(t)} onChange={() => toggleType(t)} />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{t}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setCategoryId(""); setWorkModel([]); setContractType([]); setQuery(""); setLocation(""); }} className="text-sm text-gray-500 hover:text-red-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">Limpar Tudo</button>
                <button onClick={() => { applyFilters(); setShowAdvanced(false); }} className="text-sm bg-white border border-gray-300 text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 shadow-sm transition-all">Aplicar Filtros</button>
            </div>
        </div>
      )}
    </div>
  );
}