"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const handleSort = (value: string) => {
    // Cria uma cópia dos parâmetros atuais da URL para não perder a busca/filtros
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    
    // Atualiza a URL
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="hidden sm:inline">Ordenado por:</span>
      <select 
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        className="bg-transparent font-bold text-gray-900 border-none outline-none cursor-pointer hover:text-purple-700 focus:ring-0 py-0 pl-0 pr-8"
      >
        <option value="newest">Mais recentes</option>
        <option value="oldest">Mais antigos</option>
        <option value="a-z">A - Z</option>
        <option value="z-a">Z - A</option>
      </select>
    </div>
  );
}