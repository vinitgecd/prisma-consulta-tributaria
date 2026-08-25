import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  User,
  MessageSquare,
  Search,
  BookOpen,
  FileText,
  Calendar,
  ShieldAlert,
  Sparkles,
  Loader2,
  Building2,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Lock,
  Clock,
  RotateCcw,
  Inbox,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'
import {
  ClientProfile,
  ConsultationResponse,
  SEGMENTOS,
  REGIMES_TRIBUTARIOS,
  FAIXAS_FATURAMENTO,
  UFS,
  DEFAULT_CLIENT_PROFILE,
  DEFAULT_QUESTION,
  DEFAULT_RESPONSE,
  REFUSAL_EXAMPLE,
} from '@/data/demoConsultations'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { debitCredit } from '@/services/assinaturas'
import { createConsulta, type Consulta } from '@/services/consultas'
import pb from '@/lib/pocketbase/client'

function formatDateBR(dateString: string): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return dateString
  }
}

function getFirstParagraph(text: string): string {
  if (!text) return ''
  const trimmed = text.trim()
  const paragraphs = trimmed.split(/\n+/)
  return paragraphs[0] || trimmed
}

export default function Index() {
  const { user, assinatura, refreshAssinatura } = useAuth()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Client profile state
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_CLIENT_PROFILE)

  // Question box state
  const [question, setQuestion] = useState<string>(DEFAULT_QUESTION)

  // Simulation loading state
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Active response state:
  // For visitors: initialized with DEFAULT_RESPONSE.
  // For logged-in users: null until a consultation is run.
  const [currentResponse, setCurrentResponse] = useState<ConsultationResponse | null>(() => {
    return user ? null : DEFAULT_RESPONSE
  })

  // Trigger state for staggered animation reset
  const [searchKey, setSearchKey] = useState<number>(0)

  // History state for logged-in users
  const [history, setHistory] = useState<Consulta[]>([])
  const [historyStatus, setHistoryStatus] = useState<'loading' | 'error' | 'success'>('loading')

  const handleProfileChange = (field: keyof ClientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  // Fetch consultation history for logged-in user
  const loadHistory = useCallback(async (userId: string) => {
    setHistoryStatus('loading')
    try {
      const result = await pb.collection('consultas').getList<Consulta>(1, 20, {
        filter: `usuario = "${userId}"`,
        sort: '-created',
      })
      setHistory(result.items)
      setHistoryStatus('success')
    } catch {
      setHistoryStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadHistory(user.id)
    } else {
      setHistory([])
      // Reset to demo response when logged out
      setCurrentResponse(DEFAULT_RESPONSE)
    }
  }, [user?.id, loadHistory])

  const scrollToQuestionBox = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      textareaRef.current.focus()
    }
  }

  const handleConsultar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!question.trim()) return

    // Logged-in users must have an active subscription with credits
    if (user) {
      if (!assinatura || assinatura.status !== 'ativa') {
        toast({
          title: 'Sem assinatura ativa',
          description:
            'Você não possui uma assinatura ativa. Contrate um plano para continuar utilizando o Prisma Consulta Tributária.',
        })
        return
      }
      if (assinatura.creditos_restantes <= 0) {
        toast({
          title: 'Créditos esgotados',
          description:
            'Você não possui créditos disponíveis. Renove seu plano para continuar utilizando o Prisma Consulta Tributária.',
        })
        return
      }
    }

    setIsLoading(true)
    try {
      let createdRecord: Consulta | null = null

      // Logged-in: debit one credit and register the consulta
      if (user && assinatura) {
        const remaining = await debitCredit(assinatura.id)
        if (remaining === null) {
          toast({
            title: 'Créditos esgotados',
            description:
              'Você não possui créditos disponíveis. Renove seu plano para continuar utilizando o Prisma Consulta Tributária.',
          })
          return
        }
        try {
          createdRecord = await createConsulta({
            profile,
            pergunta: question,
            resposta: DEFAULT_RESPONSE.respostaCurta || '',
            fonteCitada: DEFAULT_RESPONSE.fonte || '',
            creditosGastos: 1,
          })
          toast({
            title: 'Consulta registrada.',
          })
        } catch {
          // Non-blocking: consulta persistence failure shouldn't hide the answer
        }
        await refreshAssinatura()
      }

      // Simulate query computation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update current displayed response
      setCurrentResponse({ ...DEFAULT_RESPONSE, recusada: false })
      setSearchKey((prev) => prev + 1)

      // Prepend the new consultation to the history list immediately
      if (user) {
        if (createdRecord) {
          setHistory((prev) => [createdRecord!, ...prev.slice(0, 19)])
        } else {
          // Fallback optimistic item if network failed on createConsulta
          const optimisticConsulta: Consulta = {
            id: `temp-${Date.now()}`,
            usuario: user.id,
            segmento: profile.segmento,
            regime: profile.regimeTributario,
            faixa_faturamento: profile.faixaFaturamento,
            uf: profile.uf,
            pergunta: question,
            resposta: DEFAULT_RESPONSE.respostaCurta || '',
            fonte_citada: DEFAULT_RESPONSE.fonte || '',
            creditos_gastos: 1,
            data_consulta: new Date().toISOString(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          }
          setHistory((prev) => [optimisticConsulta, ...prev.slice(0, 19)])
        }
        setHistoryStatus('success')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* ========================================================= */}
      {/* ÁREA 1: PERFIL DO CLIENTE (Coluna Esquerda)               */}
      {/* ========================================================= */}
      <aside className="lg:sticky lg:top-[76px] space-y-4">
        <div className="bg-white rounded-[14px] border border-[#E5EAE8] shadow-[0_1px_3px_rgba(11,42,74,0.08)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(11,42,74,0.12)] hover:border-[#4E7A54]/40 overflow-hidden">
          {/* Card Accent Bar */}
          <div className="flex border-l-[5px] border-l-[#4E7A54]">
            <div className="p-5 sm:p-6 w-full space-y-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAE8]">
                <div className="p-2 rounded-lg bg-[#EEF4EE] text-[#4E7A54]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#1A2B3C] tracking-tight">
                    Perfil do Cliente
                  </h2>
                  <p className="text-xs text-[#5A6B7A]">Parâmetros para análise fiscal</p>
                </div>
              </div>

              {/* Form Selects */}
              <div className="space-y-4">
                {/* Segmento */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="segmento"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    Segmento
                  </label>
                  <div className="relative">
                    <select
                      id="segmento"
                      value={profile.segmento}
                      onChange={(e) => handleProfileChange('segmento', e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all cursor-pointer"
                    >
                      {SEGMENTOS.map((seg) => (
                        <option key={seg} value={seg}>
                          {seg}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8A98A6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Regime Tributário */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="regimeTributario"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    Regime Tributário
                  </label>
                  <div className="relative">
                    <select
                      id="regimeTributario"
                      value={profile.regimeTributario}
                      onChange={(e) => handleProfileChange('regimeTributario', e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all cursor-pointer"
                    >
                      {REGIMES_TRIBUTARIOS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8A98A6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Faixa de Faturamento Anual */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="faixaFaturamento"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    Faixa de Faturamento Anual
                  </label>
                  <div className="relative">
                    <select
                      id="faixaFaturamento"
                      value={profile.faixaFaturamento}
                      onChange={(e) => handleProfileChange('faixaFaturamento', e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all cursor-pointer"
                    >
                      {FAIXAS_FATURAMENTO.map((faixa) => (
                        <option key={faixa} value={faixa}>
                          {faixa}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8A98A6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* UF */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="uf"
                    className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]"
                  >
                    UF
                  </label>
                  <div className="relative">
                    <select
                      id="uf"
                      value={profile.uf}
                      onChange={(e) => handleProfileChange('uf', e.target.value)}
                      className="w-full h-11 px-3.5 pr-9 bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg text-[15px] font-medium text-[#1A2B3C] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all cursor-pointer"
                    >
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8A98A6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Helper text */}
              <p className="text-xs text-[#5A6B7A] pt-1 italic border-t border-[#E5EAE8]">
                Altere os dados para simular diferentes perfis de cliente.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Summary Badge / Graphic */}
        <div className="bg-[#0B2A4A] text-white p-4 rounded-xl shadow-sm space-y-2 border border-[#081E36]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4E7A54] brightness-125">
            <Building2 className="w-4 h-4" />
            <span>Resumo do Perfil Ativo</span>
          </div>
          <div className="text-xs text-white/90 font-medium leading-relaxed bg-[#081E36] p-2.5 rounded-lg border border-[#E5EAE8]/10">
            {profile.segmento} &bull; {profile.regimeTributario} &bull; {profile.faixaFaturamento}{' '}
            &bull; Estado: {profile.uf}
          </div>
        </div>
      </aside>

      {/* Right Column: Question + Answers */}
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* ÁREA 2: CAIXA DE PERGUNTA                                 */}
        {/* ========================================================= */}
        <section className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E5EAE8] shadow-[0_1px_3px_rgba(11,42,74,0.08)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(11,42,74,0.12)] hover:border-[#4E7A54]/40">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#E5EAE8]">
            <div className="p-2 rounded-lg bg-[#EEF4EE] text-[#4E7A54]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#1A2B3C] tracking-tight">
                Caixa de Pergunta
              </h2>
              <p className="text-xs text-[#5A6B7A]">
                Formule sua dúvida técnica relativa à Legislação Tributária e Reforma
              </p>
            </div>
          </div>

          <form onSubmit={handleConsultar} className="space-y-3">
            {/* Auth / credits status banner */}
            {user ? (
              assinatura ? (
                <div className="flex items-center justify-end gap-3 text-xs bg-[#EEF4EE]/60 border border-[#4E7A54]/30 rounded-lg px-3.5 py-2.5">
                  <span className="text-[#5A6B7A] font-medium">
                    {assinatura.creditos_restantes} crédito
                    {assinatura.creditos_restantes === 1 ? '' : 's'} restante
                    {assinatura.creditos_restantes === 1 ? '' : 's'}
                  </span>
                </div>
              ) : null
            ) : (
              <div className="flex items-center gap-2 text-xs bg-[#F5F7F6] border border-[#E5EAE8] rounded-lg px-3.5 py-2.5 text-[#5A6B7A]">
                <Lock className="w-3.5 h-3.5 text-[#8A98A6]" />
                <span>
                  Modo demonstração —{' '}
                  <a href="/login" className="text-[#4E7A54] font-semibold hover:underline">
                    entre na sua conta
                  </a>{' '}
                  para registrar consultas e usar créditos.
                </span>
              </div>
            )}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Descreva sua dúvida sobre a reforma tributária…"
                rows={4}
                className="w-full p-4 bg-[#F5F7F6] border border-[#E5EAE8] rounded-xl text-[15px] text-[#1A2B3C] placeholder-[#8A98A6] focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent focus:bg-white transition-all resize-y min-h-[120px] leading-relaxed"
              />
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#8A98A6] font-medium order-2 xs:order-1">
                {question.length} caracteres
              </span>

              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="order-1 xs:order-2 inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#4E7A54] hover:bg-[#3F6645] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none min-h-[48px] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Consultando…</span>
                  </>
                ) : (
                  <>
                    <span>Consultar</span>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ========================================================= */}
        {/* ÁREA 3: ÁREA DE RESPOSTA                                  */}
        {/* ========================================================= */}
        <section className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E5EAE8] shadow-[0_1px_3px_rgba(11,42,74,0.08)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(11,42,74,0.12)] hover:border-[#4E7A54]/40 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE8]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0B2A4A]/10 text-[#0B2A4A]">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#1A2B3C] tracking-tight">
                  Área de Resposta
                </h2>
                <p className="text-xs text-[#5A6B7A]">
                  Análise fundamentada em normas e legislação oficial
                </p>
              </div>
            </div>

            {currentResponse && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#4E7A54] bg-[#EEF4EE] font-medium px-2.5 py-1 rounded-full border border-[#4E7A54]/20 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Análise Concluída
              </span>
            )}
          </div>

          {/* Response Content or Welcome Empty State */}
          {currentResponse ? (
            currentResponse.recusada ? (
              /* Recusa educada inside response area */
              <div
                key={searchKey}
                className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6] border border-[#E5EAE8] space-y-3 transition-all duration-300 animate-fade-in-up"
              >
                <div className="flex items-center gap-2 text-[#5A6B7A]">
                  <HelpCircle className="w-4 h-4 text-[#8A98A6]" />
                  <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#5A6B7A]">
                    Recusa Educada (Pergunta sem resposta no acervo)
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-lg border border-[#E5EAE8] text-[14px] text-[#5A6B7A] leading-relaxed italic">
                  &ldquo;{currentResponse.mensagem || REFUSAL_EXAMPLE}&rdquo;
                </div>
              </div>
            ) : (
              <div key={searchKey} className="space-y-4">
                {/* 1. Resposta Curta */}
                <div
                  className="p-4 sm:p-5 rounded-xl bg-[#EEF4EE]/60 border border-[#4E7A54]/30 space-y-2 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: '0ms', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#4E7A54]" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4E7A54]">
                      1. Resposta Curta
                    </span>
                  </div>
                  <p className="text-[15px] text-[#1A2B3C] font-semibold leading-relaxed pl-6">
                    {currentResponse.respostaCurta}
                  </p>
                </div>

                {/* 2. Fundamentação */}
                <div
                  className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6] border border-[#E5EAE8] space-y-2.5 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: '80ms', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0B2A4A]" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#0B2A4A]">
                      2. Fundamentação
                    </span>
                  </div>
                  <blockquote className="border-l-4 border-[#0B2A4A] pl-4 py-1 italic text-[14px] text-[#1A2B3C] leading-relaxed bg-white/70 rounded-r-lg">
                    {currentResponse.fundamentacao}
                  </blockquote>
                </div>

                {/* 3. Fonte */}
                <div
                  className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6] border border-[#E5EAE8] space-y-2 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: '160ms', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0B2A4A]" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#0B2A4A]">
                      3. Fonte
                    </span>
                  </div>
                  <p className="text-[15px] text-[#1A2B3C] font-medium leading-relaxed pl-6">
                    {currentResponse.fonte}
                  </p>
                </div>

                {/* 4. Limite de Aplicação */}
                <div
                  className="p-4 sm:p-5 rounded-xl bg-[#FFFBF3] border border-[#B7791F]/30 space-y-2 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: '240ms', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#B7791F]" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#B7791F]">
                      4. Limite de Aplicação
                    </span>
                  </div>
                  <p className="text-[15px] text-[#1A2B3C] font-medium leading-relaxed pl-6">
                    {currentResponse.limiteAplicacao}
                  </p>
                </div>

                {/* 5. Disclaimer */}
                <div
                  className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6] border border-[#E5EAE8] space-y-2 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: '320ms', animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#5A6B7A]" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#5A6B7A]">
                      5. Termos &amp; Disclaimer
                    </span>
                  </div>
                  <p className="text-[13px] text-[#5A6B7A] leading-relaxed pl-6 italic">
                    {currentResponse.disclaimer}
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Welcome state for logged-in users with no consultation active */
            <div className="py-12 px-4 text-center space-y-4 rounded-xl bg-[#F5F7F6]/60 border border-dashed border-[#E5EAE8] animate-fade-in">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EEF4EE] flex items-center justify-center text-[#4E7A54] shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-[#1A2B3C] tracking-tight">
                  Prisma Consulta Tributária
                </h3>
                <p className="text-sm text-[#5A6B7A] leading-relaxed">
                  Configure o perfil do cliente, faça uma pergunta e receba uma análise fundamentada
                  no acervo de normas.
                </p>
              </div>
            </div>
          )}

          {/* Static Exemplo de Recusa Educada Card (rendered ONLY for non-logged-in visitors / demo mode) */}
          {!user && (
            <>
              {/* Separator Divider */}
              <hr className="border-[#E5EAE8] my-6" />

              <div className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6]/80 border border-dashed border-[#8A98A6]/40 space-y-3">
                <div className="flex items-center gap-2 text-[#5A6B7A]">
                  <HelpCircle className="w-4 h-4 text-[#8A98A6]" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-[#5A6B7A]">
                    Exemplo de recusa educada (pergunta sem resposta no acervo)
                  </h3>
                </div>
                <div className="p-3.5 bg-white rounded-lg border border-[#E5EAE8] text-[14px] text-[#5A6B7A] leading-relaxed italic">
                  &ldquo;{REFUSAL_EXAMPLE}&rdquo;
                </div>
              </div>
            </>
          )}
        </section>

        {/* ========================================================= */}
        {/* ÁREA 4: HISTÓRICO DE CONSULTAS (Apenas Usuários Logados)   */}
        {/* ========================================================= */}
        {user && (
          <section className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E5EAE8] shadow-[0_1px_3px_rgba(11,42,74,0.08)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(11,42,74,0.12)] hover:border-[#4E7A54]/40 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE8]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#EEF4EE] text-[#4E7A54]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#1A2B3C] tracking-tight">
                    Histórico de Consultas
                  </h2>
                  <p className="text-xs text-[#5A6B7A]">
                    Suas consultas recentes salvas no sistema
                  </p>
                </div>
              </div>

              {historyStatus === 'success' && history.length > 0 && (
                <span className="text-xs font-semibold text-[#5A6B7A] bg-[#F5F7F6] px-2.5 py-1 rounded-full border border-[#E5EAE8]">
                  {history.length} {history.length === 1 ? 'consulta' : 'consultas'}
                </span>
              )}
            </div>

            {/* UX State 1: LOADING (3 skeleton cards with pulse animation) */}
            {historyStatus === 'loading' && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[#E5EAE8] bg-[#F5F7F6]/50 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-4 bg-[#E5EAE8] rounded-md w-3/5" />
                      <div className="h-3 bg-[#E5EAE8] rounded-md w-24" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#E5EAE8] rounded-md w-full" />
                      <div className="h-3 bg-[#E5EAE8] rounded-md w-4/5" />
                      <div className="h-3 bg-[#E5EAE8] rounded-md w-2/3" />
                    </div>
                    <div className="h-3 bg-[#E5EAE8] rounded-md w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* UX State 2: EMPTY */}
            {historyStatus === 'success' && history.length === 0 && (
              <div className="py-10 px-4 text-center space-y-4 rounded-xl bg-[#F5F7F6]/60 border border-dashed border-[#E5EAE8] animate-fade-in">
                <div className="mx-auto w-12 h-12 rounded-xl bg-white border border-[#E5EAE8] flex items-center justify-center text-[#8A98A6] shadow-sm">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1A2B3C]">
                    Você ainda não fez nenhuma consulta.
                  </p>
                  <p className="text-xs text-[#5A6B7A]">
                    Envie uma dúvida técnica acima para registrar sua primeira análise.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={scrollToQuestionBox}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#4E7A54] hover:bg-[#3F6645] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <span>Fazer primeira consulta</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* UX State 3: ERROR */}
            {historyStatus === 'error' && (
              <div className="py-8 px-4 text-center space-y-3 rounded-xl bg-red-50/50 border border-red-200 animate-fade-in">
                <div className="mx-auto w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-red-800">
                  Não foi possível carregar seu histórico.
                </p>
                <button
                  type="button"
                  onClick={() => user?.id && loadHistory(user.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tentar novamente</span>
                </button>
              </div>
            )}

            {/* UX State 4: SUCCESS */}
            {historyStatus === 'success' && history.length > 0 && (
              <div className="space-y-3.5 animate-fade-in">
                {history.map((item) => (
                  <article
                    key={item.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#F5F7F6]/60 border border-[#E5EAE8] hover:border-[#4E7A54]/40 hover:bg-[#F5F7F6] transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                      <h4 className="text-sm sm:text-[15px] font-bold text-[#1A2B3C] leading-snug">
                        {item.pergunta}
                      </h4>
                      <time className="text-xs font-medium text-[#8A98A6] shrink-0">
                        {formatDateBR(item.created || item.data_consulta)}
                      </time>
                    </div>

                    {item.resposta && (
                      <p className="text-xs sm:text-[13px] text-[#5A6B7A] leading-relaxed line-clamp-3">
                        {getFirstParagraph(item.resposta)}
                      </p>
                    )}

                    {item.fonte_citada && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-[#4E7A54]">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Fonte: {item.fonte_citada}</span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
