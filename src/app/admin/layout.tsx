"use client";

import AdminGuard from "@/components/AdminGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, FileText, Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { name: "Gestão de Vagas", icon: Briefcase, path: "/admin/jobs" },
    { name: "Banco de Talentos", icon: Users, path: "/admin/talents" },
    // { name: "Candidaturas", icon: FileText, path: "/admin/applications" }, // Futuro
    // { name: "Configurações", icon: Settings, path: "/admin/settings" }, // Futuro
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-100">
        
        {/* SIDEBAR */}
        <aside className="w-64 bg-purple-900 text-white flex flex-col shadow-xl">
          <div className="p-6 text-center border-b border-purple-800">
            <h1 className="text-2xl font-bold tracking-tight">LZW Admin</h1>
            <p className="text-xs text-purple-300 mt-1">Painel de Controle</p>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/10 text-white border-l-4 border-purple-300"
                      : "text-purple-100 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-purple-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-200 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto">
          <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-gray-800">
               {menuItems.find(i => i.path === pathname)?.name || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
               {/* Aqui poderia ter notificações no futuro */}
               <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                  A
               </div>
            </div>
          </header>
          
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}