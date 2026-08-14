import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Mail, Lock, User as UserIcon, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { PrismaLogo } from '@/components/PrismaLogo'

type Mode = 'login' | 'signup'

export default function Login() {
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha para continuar.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Informe seu nome para criar a conta.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await signup(name.trim(), email.trim(), password)
      }
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B2A4A] text-white font-sans flex flex-col antialiased">
      {/* Top bar with brand */}
      <header className="w-full">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[#081E36]/80 border border-[#4E7A54]/40 flex items-center justify-center">
              <PrismaLogo className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="font-semibold text-base sm:text-xl tracking-tight">
              Prisma Consulta Tributária
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#8A98A6] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao modo demonstração</span>
            <span className="sm:hidden">Demo</span>
          </Link>
        </div>
      </header>

      {/* Centered form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-white text-[#1A2B3C] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden border border-[#081E36]">
            {/* Accent bar */}
            <div className="h-1.5 bg-[#4E7A54]" />

            <div className="p-7 sm:p-9">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[#0B2A4A]">
                  {mode === 'login' ? 'Acessar sua conta' : 'Criar conta'}
                </h1>
                <p className="text-sm text-[#5A6B7A] mt-1">
                  {mode === 'login'
                    ? 'Entre com suas credenciais para registrar consultas e gerenciar créditos.'
                    : 'Crie sua conta para começar a utilizar o Prisma Consulta Tributária.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                    >
                      Nome
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#8A98A6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full h-11 pl-9 pr-3.5 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] placeholder-[#8A98A6] focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8A98A6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="w-full h-11 pl-9 pr-3.5 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] placeholder-[#8A98A6] focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8A98A6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-9 pr-3.5 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] placeholder-[#8A98A6] focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4E7A54] hover:bg-[#3F6645] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none min-h-[48px] cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{mode === 'login' ? 'Entrando…' : 'Criando conta…'}</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Entrar' : 'Criar conta'}</span>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-sm text-[#5A6B7A]">
                {mode === 'login' ? (
                  <>
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup')
                        setError(null)
                      }}
                      className="font-semibold text-[#4E7A54] hover:underline cursor-pointer"
                    >
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setError(null)
                      }}
                      className="font-semibold text-[#4E7A54] hover:underline cursor-pointer"
                    >
                      Entrar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-5 flex items-start gap-2.5 text-xs text-[#8A98A6] bg-[#081E36]/60 border border-[#4E7A54]/20 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-[#4E7A54] shrink-0 mt-0.5" />
            <p>
              Conta de demonstração:{' '}
              <span className="text-[#C0C9D0] font-medium">vinitg44@gmail.com</span> /{' '}
              <span className="text-[#C0C9D0] font-medium">Skip@Pass</span>. Após o login, cada
              consulta registrada debita 1 crédito da assinatura ativa.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#8A98A6]/80 py-5">
        &copy; {new Date().getFullYear()} Prisma Consulta Tributária. Todos os direitos reservados.
      </footer>
    </div>
  )
}
