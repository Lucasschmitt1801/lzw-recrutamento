"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2, User, Phone, Linkedin, Mail, Lock, Check, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

// --- CORREÇÃO DE TIPAGEM AQUI ---
type ViewState = 'LOGIN' | 'SIGNUP' | 'RECOVERY';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados do Formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Novos estados para o cadastro completo
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Estados de Interface e Validação
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Controle de Visualização com a Tipagem Correta
  const [view, setView] = useState<ViewState>('LOGIN');
  
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validação de Senha
  const validatePassword = (pass: string) => {
    const errors = [];
    if (pass.length < 8) errors.push("Mínimo de 8 caracteres");
    if (!/[A-Z]/.test(pass)) errors.push("Pelo menos uma letra maiúscula");
    if (!/[0-9]/.test(pass)) errors.push("Pelo menos um número");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push("Pelo menos um caractere especial (!@#$...)");
    
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = e.target.value;
    setPassword(newPass);
    if (view === 'SIGNUP') {
      validatePassword(newPass);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // --- FLUXO DE RECUPERAÇÃO DE SENHA ---
      if (view === 'RECOVERY') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`, // Página futura para criar nova senha
        });
        
        if (error) throw error;
        setMessage("Se houver uma conta com este e-mail, enviamos um link de recuperação.");
        setLoading(false);
        return;
      }

      // --- FLUXO DE CADASTRO ---
      if (view === 'SIGNUP') {
        if (!validatePassword(password)) {
          setLoading(false);
          return;
        }

        if (!fullName || !phone) {
          throw new Error("Por favor, preencha nome e telefone.");
        }

        const { error: authError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (authError) {
            if (authError.message.includes("already registered") || authError.status === 422) {
                throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
            }
            throw authError;
        }
        
        if (data.user) {
             const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: fullName,
                phone: phone,
                linkedin_url: linkedin,
                email: email,
                role: 'CANDIDATE'
             });
             if (profileError) console.error("Erro perfil:", profileError);
        }

        setMessage("Conta criada! Verifique seu e-mail.");
        setPassword("");
        setView('LOGIN');

      } else {
        // --- FLUXO DE LOGIN ---
        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw new Error("Email ou senha incorretos.");

        // --- LÓGICA DE REDIRECIONAMENTO INTELIGENTE ---
        if (loginData?.user) {
            // Verifica se é admin na tabela de perfis
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', loginData.user.id)
                .single();

            if (profile?.role === 'ADMIN') {
                router.push("/admin"); // Manda para o painel novo
            } else {
                router.push("/"); // Manda para a home de vagas
            }
            
            router.refresh(); 
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Título dinâmico
  const getTitle = () => {
    if (view === 'RECOVERY') return "Recuperar Senha";
    if (view === 'SIGNUP') return "Crie sua conta segura";
    return "Acesse sua conta";
  };

  const getDescription = () => {
    if (view === 'RECOVERY') return "Digite seu e-mail para receber o link de redefinição.";
    if (view === 'SIGNUP') return "Preencha seus dados para agilizar suas candidaturas.";
    return "Entre para acompanhar suas candidaturas.";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl border border-gray-100">
          
          <div className="text-center">
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {getTitle()}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {getDescription()}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleAuth}>
            
            {/* CAMPOS DE CADASTRO (Aparecem apenas no SIGNUP) */}
            {view === 'SIGNUP' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 pl-10 text-black placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 border" 
                    placeholder="Seu nome" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 pl-10 text-black placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 border" 
                    placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn (Opcional)</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 pl-10 text-black placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 border" 
                    placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL (Sempre visível) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                  className="block w-full rounded-md border-gray-300 pl-10 text-black placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 border" 
                  placeholder="seu@email.com" />
                </div>
              </div>
              
              {/* SENHA (Escondida no modo RECOVERY) */}
              {view !== 'RECOVERY' && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Senha</label>
                    {view === 'LOGIN' && (
                      <button 
                        type="button"
                        onClick={() => {
                           setView('RECOVERY');
                           setError(null); 
                           setMessage(null);
                        }}
                        className="text-xs font-medium text-purple-600 hover:text-purple-500"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required={view !== 'RECOVERY'}
                      value={password}
                      onChange={handlePasswordChange}
                      className={`block w-full rounded-md pl-10 sm:text-sm py-2 border text-black placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 
                          ${view === 'SIGNUP' && passwordErrors.length > 0 && password.length > 0 ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`}
                      placeholder="******"
                    />
                  </div>

                  {/* REQUISITOS DE SENHA (Apenas SIGNUP) */}
                  {view === 'SIGNUP' && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3 text-xs">
                      <p className="font-medium text-gray-700 mb-2">Requisitos de segurança:</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                          {password.length >= 8 ? <Check size={12}/> : <div className="h-1 w-1 rounded-full bg-gray-400" />} 8 caracteres
                        </li>
                        <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[A-Z]/.test(password) ? <Check size={12}/> : <div className="h-1 w-1 rounded-full bg-gray-400" />} Maiúscula
                        </li>
                        <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[0-9]/.test(password) ? <Check size={12}/> : <div className="h-1 w-1 rounded-full bg-gray-400" />} Número
                        </li>
                        <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <Check size={12}/> : <div className="h-1 w-1 rounded-full bg-gray-400" />} Símbolo (!@#$)
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MENSAGENS */}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            {message && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-100">
                <CheckCircle size={16} />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (view === 'SIGNUP' && passwordErrors.length > 0)}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {view === 'LOGIN' && "Entrar na Plataforma"}
              {view === 'SIGNUP' && "Finalizar Cadastro"}
              {view === 'RECOVERY' && "Enviar Link de Recuperação"}
            </button>
          </form>

          {/* RODAPÉ / ALTERNAR TELAS */}
          <div className="text-center space-y-2">
            {view === 'RECOVERY' ? (
               <button
               type="button"
               onClick={() => {
                 setView('LOGIN');
                 setError(null);
                 setMessage(null);
               }}
               className="flex items-center justify-center w-full text-sm font-medium text-gray-600 hover:text-gray-900"
             >
               <ArrowLeft size={16} className="mr-2" />
               Voltar para o Login
             </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                  setError(null);
                  setMessage(null);
                  setPassword("");
                }}
                className="text-sm font-medium text-purple-600 hover:text-purple-500 underline underline-offset-2"
              >
                {view === 'LOGIN'
                  ? "Não tenho conta. Criar cadastro."
                  : "Já tenho conta. Fazer Login."}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}