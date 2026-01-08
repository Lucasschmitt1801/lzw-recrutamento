import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import UserMenu from './UserMenu'; // <--- Importe aqui

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 text-white">
            <Briefcase size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">LZW Vagas</span>
        </Link>

        {/* Substituímos os botões antigos pelo UserMenu inteligente */}
        <div className="flex gap-4 items-center">
             {/* Link para Admin continua aqui se quiser, ou move para dentro do login */}
             <UserMenu />
        </div>
      </div>
    </nav>
  );
}