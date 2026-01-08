"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User, LogOut, FileText, ChevronDown, LayoutDashboard, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Novo estado
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function getUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Verifica se é ADMIN na tabela de perfis
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      }
    }

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Nota: Em produção ideal, refaríamos a checagem de role aqui também
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <Link 
        href="/login" 
        className="rounded-full bg-purple-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        Entrar / Cadastrar
      </Link>
    );
  }

  const initial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all bg-white shadow-sm"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-md">
          {initial.toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
            <p className="text-xs text-gray-500 font-medium">Olá,</p>
            <p className="text-sm font-bold text-gray-900 max-w-[100px] truncate leading-none">
                {user.user_metadata?.full_name?.split(' ')[0] || "Usuário"}
            </p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <>
            {/* Overlay invisível para fechar ao clicar fora */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
            
            {/* Cabeçalho do Menu */}
            <div className="px-4 py-3 border-b border-gray-100 mb-2">
                <p className="text-sm font-bold text-gray-900 truncate">{user.user_metadata?.full_name || "Usuário"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                {isAdmin && (
                    <span className="mt-2 inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Administrador
                    </span>
                )}
            </div>

            {/* SEÇÃO ADMIN (Só aparece se for admin) */}
            {isAdmin && (
                <div className="px-2 mb-2 pb-2 border-b border-gray-100">
                    <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Administração</p>
                    <Link 
                        href="/admin/jobs/new" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-2 py-2 text-sm font-medium text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                        <PlusCircle size={18} className="mr-3" />
                        Cadastrar Nova Vaga
                    </Link>
                    {/* Futuro Dashboard */}
                    {/* <Link href="/admin/dashboard" ... >Dashboard</Link> */}
                </div>
            )}

            {/* Menu Comum */}
            <div className="px-2">
                <Link 
                    href="/profile" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-2 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <User size={18} className="mr-3 text-gray-400" />
                    Meu Perfil
                </Link>
                {/* <Link 
                    href="/applications" 
                    className="flex items-center px-2 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <FileText size={18} className="mr-3 text-gray-400" />
                    Minhas Candidaturas
                </Link> 
                */}
            </div>

            <div className="border-t border-gray-100 mt-2 pt-2 px-2">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut size={18} className="mr-3" />
                    Sair da Conta
                </button>
            </div>
            </div>
        </>
      )}
    </div>
  );
}