import React, { useState } from 'react'
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
} from 'lucide-react'
import {
  ClientProfile,
  SEGMENTOS,
  REGIMES_TRIBUTARIOS,
  FAIXAS_FATURAMENTO,
  UFS,
  DEFAULT_CLIENT_PROFILE,
  DEFAULT_QUESTION,
  DEFAULT_RESPONSE,
  REFUSAL_EXAMPLE,
} from '@/data/demoConsultations'

export default function Index() {
  // Client profile state
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_CLIENT_PROFILE)

  // Question box state
  const [question, setQuestion] = useState<string>(DEFAULT_QUESTION)

  // Simulation loading state
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Trigger state for staggered animation reset
  const [hasSearched, setHasSearched] = useState<boolean>(true)
  const [searchKey, setSearchKey] = useState<number>(0)

  const handleProfileChange = (field: keyof ClientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleConsultar = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    // Simulate query computation delay
    setTimeout(() => {
      setIsLoading(false)
      setHasSearched(true)
      setSearchKey((prev) => prev + 1)
    }, 1500)
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
            <div className="relative">
              <textarea
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

            <span className="inline-flex items-center gap-1.5 text-xs text-[#4E7A54] bg-[#EEF4EE] font-medium px-2.5 py-1 rounded-full border border-[#4E7A54]/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Análise Concluída
            </span>
          </div>

          {/* 5 Response Blocks */}
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
                {DEFAULT_RESPONSE.respostaCurta}
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
                {DEFAULT_RESPONSE.fundamentacao}
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
                {DEFAULT_RESPONSE.fonte}
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
                {DEFAULT_RESPONSE.limiteAplicacao}
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
                {DEFAULT_RESPONSE.disclaimer}
              </p>
            </div>
          </div>

          {/* Separator Divider */}
          <hr className="border-[#E5EAE8] my-6" />

          {/* Exemplo de Recusa Educada Card */}
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
        </section>
      </div>
    </div>
  )
}
