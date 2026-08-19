import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookMarked,
  Search,
  Plus,
  Loader2,
  Pencil,
  ListChecks,
  Power,
  PowerOff,
  ExternalLink,
  X,
  Trash2,
  Calendar,
  Link2,
  Hash,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  listNormas,
  listAllArtigos,
  createNorma,
  updateNorma,
  setNormaAtivo,
  listArtigosByNorma,
  createArtigo,
  deleteArtigo,
  type Norma,
  type Artigo,
  type NormaInput,
  type TipoNorma,
  TIPO_NORMA_LABELS,
} from '@/services/normas'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const TIPO_OPTIONS: { value: TipoNorma; label: string }[] = [
  { value: 'lei_complementar', label: 'Lei Complementar' },
  { value: 'regulamento', label: 'Regulamento' },
  { value: 'resolucao', label: 'Resolução' },
]

const EMPTY_FORM: NormaInput = {
  titulo: '',
  tipo: 'lei_complementar',
  numero: '',
  data_publicacao: '',
  data_validade: '',
  url_oficial: '',
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Acervo() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [normas, setNormas] = useState<Norma[]>([])
  const [artigoCounts, setArtigoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Norma | null>(null)
  const [form, setForm] = useState<NormaInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Articles modal
  const [artigosOpen, setArtigosOpen] = useState(false)
  const [artigosNorma, setArtigosNorma] = useState<Norma | null>(null)
  const [artigos, setArtigos] = useState<Artigo[]>([])
  const [artigosLoading, setArtigosLoading] = useState(false)
  const [newArtigoNumero, setNewArtigoNumero] = useState('')
  const [newArtigoTexto, setNewArtigoTexto] = useState('')
  const [addingArtigo, setAddingArtigo] = useState(false)

  // Toggle confirm
  const [confirmingNorma, setConfirmingNorma] = useState<Norma | null>(null)

  // --- Access control ---
  useEffect(() => {
    if (authLoading) return
    if (!user || user.profile !== 'administrador') {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  // --- Load normas + artigo counts ---
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [list, allArtigos] = await Promise.all([listNormas(), listAllArtigos()])
      setNormas(list)
      const counts: Record<string, number> = {}
      for (const a of allArtigos) {
        counts[a.norma_id] = (counts[a.norma_id] || 0) + 1
      }
      setArtigoCounts(counts)
    } catch (err) {
      toast({
        title: 'Erro ao carregar normas',
        description: getErrorMessage(err),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (user && user.profile === 'administrador') reload()
  }, [user, reload])

  // --- Client-side filter ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return normas
    return normas.filter((n) => {
      const tipoLabel = TIPO_NORMA_LABELS[n.tipo] || n.tipo
      return (
        n.titulo.toLowerCase().includes(q) ||
        tipoLabel.toLowerCase().includes(q) ||
        n.numero.toLowerCase().includes(q)
      )
    })
  }, [normas, search])

  // --- Form modal handlers ---
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }
  const openEdit = (n: Norma) => {
    setEditing(n)
    setForm({
      titulo: n.titulo,
      tipo: n.tipo,
      numero: n.numero,
      data_publicacao: n.data_publicacao ? n.data_publicacao.slice(0, 10) : '',
      data_validade: n.data_validade ? n.data_validade.slice(0, 10) : '',
      url_oficial: n.url_oficial || '',
    })
    setFormError(null)
    setFormOpen(true)
  }
  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.titulo.trim() || !form.numero.trim() || !form.data_publicacao) {
      setFormError('Preencha os campos obrigatórios: título, número e data de publicação.')
      return
    }
    setSaving(true)
    try {
      const payload: NormaInput = {
        ...form,
        titulo: form.titulo.trim(),
        numero: form.numero.trim(),
        data_publicacao: form.data_publicacao,
        data_validade: form.data_validade || '',
        url_oficial: form.url_oficial.trim() || '',
      }
      if (editing) {
        await updateNorma(editing.id, payload)
        toast({ title: 'Norma atualizada', description: `${payload.numero} foi salva.` })
      } else {
        await createNorma(payload)
        toast({ title: 'Norma criada', description: `${payload.numero} foi adicionada ao acervo.` })
      }
      closeForm()
      await reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // --- Articles modal handlers ---
  const openArtigos = async (n: Norma) => {
    setArtigosNorma(n)
    setArtigosOpen(true)
    setNewArtigoNumero('')
    setNewArtigoTexto('')
    setArtigosLoading(true)
    try {
      const list = await listArtigosByNorma(n.id)
      setArtigos(list)
    } catch (err) {
      toast({ title: 'Erro ao carregar artigos', description: getErrorMessage(err) })
    } finally {
      setArtigosLoading(false)
    }
  }
  const closeArtigos = () => {
    setArtigosOpen(false)
    setArtigosNorma(null)
    setArtigos([])
    setNewArtigoNumero('')
    setNewArtigoTexto('')
  }

  const handleAddArtigo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artigosNorma) return
    if (!newArtigoNumero.trim() || !newArtigoTexto.trim()) {
      toast({ title: 'Preencha número e texto do artigo.' })
      return
    }
    setAddingArtigo(true)
    try {
      const created = await createArtigo(
        artigosNorma.id,
        newArtigoNumero.trim(),
        newArtigoTexto.trim(),
      )
      setArtigos((prev) => [...prev, created])
      setArtigoCounts((prev) => ({
        ...prev,
        [artigosNorma.id]: (prev[artigosNorma.id] || 0) + 1,
      }))
      setNewArtigoNumero('')
      setNewArtigoTexto('')
      toast({ title: 'Artigo adicionado', description: created.numero })
    } catch (err) {
      toast({ title: 'Erro ao adicionar artigo', description: getErrorMessage(err) })
    } finally {
      setAddingArtigo(false)
    }
  }

  const handleRemoveArtigo = async (id: string) => {
    if (!artigosNorma) return
    try {
      await deleteArtigo(id)
      setArtigos((prev) => prev.filter((a) => a.id !== id))
      setArtigoCounts((prev) => ({
        ...prev,
        [artigosNorma.id]: Math.max(0, (prev[artigosNorma.id] || 0) - 1),
      }))
      toast({ title: 'Artigo removido' })
    } catch (err) {
      toast({ title: 'Erro ao remover artigo', description: getErrorMessage(err) })
    }
  }

  // --- Toggle (soft delete / restore) ---
  const confirmToggle = (n: Norma) => setConfirmingNorma(n)
  const handleToggle = async () => {
    if (!confirmingNorma) return
    const n = confirmingNorma
    const next = !n.ativo
    try {
      await setNormaAtivo(n.id, next)
      setNormas((prev) => prev.map((x) => (x.id === n.id ? { ...x, ativo: next } : x)))
      toast({
        title: next ? 'Norma ativada' : 'Norma desativada',
        description: next
          ? `${n.numero} voltou a ser usada como fonte nas consultas.`
          : `${n.numero} deixou de ser usada como fonte nas consultas.`,
      })
    } catch (err) {
      toast({ title: 'Erro ao alterar status', description: getErrorMessage(err) })
    } finally {
      setConfirmingNorma(null)
    }
  }

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#5A6B7A]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top navigation back to home */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0B2A4A] hover:text-[#4E7A54] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a página principal
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0B2A4A]/10 text-[#0B2A4A]">
              <BookMarked className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B2A4A]">
              Gestão do Acervo de Normas
            </h1>
          </div>
          <p className="text-sm text-[#5A6B7A] mt-1.5 ml-10">
            Cadastre e mantenha as normas tributárias utilizadas nas consultas
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4E7A54] hover:bg-[#3F6645] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Norma
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-[#8A98A6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, tipo ou número da norma…"
          className="w-full h-11 pl-10 pr-3.5 bg-white border border-[#E5EAE8] rounded-xl text-[15px] text-[#1A2B3C] placeholder-[#8A98A6] focus:outline-none focus:ring-2 focus:ring-[#4E7A54] focus:border-transparent transition-all"
        />
      </div>

      {/* Table / list */}
      <div className="bg-white rounded-[14px] border border-[#E5EAE8] shadow-[0_1px_3px_rgba(11,42,74,0.08)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#5A6B7A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <AlertCircle className="w-8 h-8 text-[#8A98A6] mb-3" />
            <p className="text-sm font-medium text-[#1A2B3C]">
              {search
                ? 'Nenhuma norma encontrada para a busca.'
                : 'Nenhuma norma cadastrada ainda.'}
            </p>
            <p className="text-xs text-[#5A6B7A] mt-1">
              {search
                ? 'Tente outro termo de busca.'
                : 'Clique em "Adicionar Norma" para criar a primeira.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F7F6] border-b border-[#E5EAE8] text-left">
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Título
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Tipo
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Número
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Publicação
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Validade
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A]">
                      Artigos
                    </th>
                    <th className="px-4 py-3 font-semibold text-[12px] uppercase tracking-[0.06em] text-[#5A6B7A] text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const count = artigoCounts[n.id] || 0
                    return (
                      <tr
                        key={n.id}
                        className={`border-b border-[#E5EAE8] last:border-0 hover:bg-[#F5F7F6]/60 transition-colors ${
                          !n.ativo ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 max-w-[320px]">
                          <div className="font-medium text-[#1A2B3C] leading-snug">
                            {n.ativo ? (
                              n.titulo
                            ) : (
                              <span className="line-through decoration-[#8A98A6]">{n.titulo}</span>
                            )}
                          </div>
                          {n.url_oficial && (
                            <a
                              href={n.url_oficial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#4E7A54] hover:underline mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              URL oficial
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EEF4EE] border border-[#4E7A54]/20 text-[#3F6645] text-xs font-medium">
                            {TIPO_NORMA_LABELS[n.tipo] || n.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-[#1A2B3C]">
                          {n.numero}
                        </td>
                        <td className="px-4 py-3 text-[#5A6B7A]">
                          {formatDate(n.data_publicacao)}
                        </td>
                        <td className="px-4 py-3 text-[#5A6B7A]">{formatDate(n.data_validade)}</td>
                        <td className="px-4 py-3">
                          {n.ativo ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6645]">
                              <span className="w-2 h-2 rounded-full bg-[#4E7A54]" />
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8A98A6]">
                              <span className="w-2 h-2 rounded-full bg-[#8A98A6]" />
                              Inativa
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-[#5A6B7A] font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            {count} {count === 1 ? 'artigo' : 'artigos'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(n)}
                              title="Editar"
                              className="p-1.5 rounded-lg text-[#5A6B7A] hover:bg-[#0B2A4A]/10 hover:text-[#0B2A4A] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openArtigos(n)}
                              title="Gerenciar Artigos"
                              className="p-1.5 rounded-lg text-[#5A6B7A] hover:bg-[#4E7A54]/15 hover:text-[#4E7A54] transition-colors cursor-pointer"
                            >
                              <ListChecks className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmToggle(n)}
                              title={n.ativo ? 'Desativar' : 'Ativar'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                n.ativo
                                  ? 'text-[#5A6B7A] hover:bg-amber-50 hover:text-amber-600'
                                  : 'text-[#5A6B7A] hover:bg-[#EEF4EE] hover:text-[#4E7A54]'
                              }`}
                            >
                              {n.ativo ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#E5EAE8]">
              {filtered.map((n) => {
                const count = artigoCounts[n.id] || 0
                return (
                  <div key={n.id} className={`p-4 ${!n.ativo ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`font-semibold text-[#1A2B3C] text-sm leading-snug ${!n.ativo ? 'line-through decoration-[#8A98A6]' : ''}`}
                        >
                          {n.titulo}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EEF4EE] border border-[#4E7A54]/20 text-[#3F6645] text-xs font-medium">
                            {TIPO_NORMA_LABELS[n.tipo] || n.tipo}
                          </span>
                          <span className="font-mono text-xs text-[#1A2B3C]">{n.numero}</span>
                          {n.ativo ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6645]">
                              <span className="w-2 h-2 rounded-full bg-[#4E7A54]" />
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8A98A6]">
                              <span className="w-2 h-2 rounded-full bg-[#8A98A6]" />
                              Inativa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5A6B7A]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8A98A6]" />
                        <span>Publicação: {formatDate(n.data_publicacao)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8A98A6]" />
                        <span>Validade: {formatDate(n.data_validade)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#8A98A6]" />
                        <span>
                          {count} {count === 1 ? 'artigo' : 'artigos'}
                        </span>
                      </div>
                      {n.url_oficial && (
                        <a
                          href={n.url_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#4E7A54] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          URL oficial
                        </a>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openEdit(n)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5EAE8] text-xs font-medium text-[#1A2B3C] hover:bg-[#F5F7F6] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => openArtigos(n)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5EAE8] text-xs font-medium text-[#1A2B3C] hover:bg-[#F5F7F6] transition-colors cursor-pointer"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        Artigos
                      </button>
                      <button
                        onClick={() => confirmToggle(n)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          n.ativo
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-[#4E7A54]/30 text-[#4E7A54] hover:bg-[#EEF4EE]'
                        }`}
                      >
                        {n.ativo ? (
                          <PowerOff className="w-3.5 h-3.5" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        {n.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ===== Modal: Adicionar/Editar Norma ===== */}
      {formOpen && (
        <ModalOverlay onClose={closeForm} title={editing ? 'Editar Norma' : 'Adicionar Norma'}>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Título */}
            <Field label="Título da norma" required>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex.: Lei Complementar nº 214, de 16 de janeiro de 2025"
                className="modal-input"
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo */}
              <Field label="Tipo" required>
                <div className="relative">
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoNorma }))}
                    className="modal-input appearance-none pr-9 cursor-pointer"
                  >
                    {TIPO_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </div>
              </Field>

              {/* Número */}
              <Field label="Número" required>
                <input
                  type="text"
                  value={form.numero}
                  onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                  placeholder="Ex.: LC 214/2025"
                  className="modal-input font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data de Publicação */}
              <Field label="Data de Publicação" required>
                <input
                  type="date"
                  value={form.data_publicacao}
                  onChange={(e) => setForm((p) => ({ ...p, data_publicacao: e.target.value }))}
                  className="modal-input"
                />
              </Field>

              {/* Data de Validade */}
              <Field label="Data de Validade">
                <input
                  type="date"
                  value={form.data_validade}
                  onChange={(e) => setForm((p) => ({ ...p, data_validade: e.target.value }))}
                  className="modal-input"
                />
              </Field>
            </div>

            {/* URL */}
            <Field label="URL Oficial">
              <input
                type="url"
                value={form.url_oficial}
                onChange={(e) => setForm((p) => ({ ...p, url_oficial: e.target.value }))}
                placeholder="https://www.planalto.gov.br/…"
                className="modal-input"
              />
            </Field>

            {formError && (
              <div className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5EAE8]">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-[#5A6B7A] hover:text-[#1A2B3C] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4E7A54] hover:bg-[#3F6645] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>{editing ? 'Salvar alterações' : 'Adicionar norma'}</>
                )}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ===== Modal: Gerenciar Artigos ===== */}
      {artigosOpen && artigosNorma && (
        <ModalOverlay onClose={closeArtigos} title="Gerenciar Artigos" wide>
          <div className="space-y-5">
            {/* Norma title at top */}
            <div className="bg-[#0B2A4A] text-white rounded-xl p-4 border border-[#081E36]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4E7A54] brightness-125 mb-1">
                <BookMarked className="w-3.5 h-3.5" />
                Norma
              </div>
              <p className="text-sm font-semibold leading-snug">{artigosNorma.titulo}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#8A98A6]">
                <span className="inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {artigosNorma.numero}
                </span>
                <span>•</span>
                <span>{TIPO_NORMA_LABELS[artigosNorma.tipo]}</span>
              </div>
            </div>

            {/* Existing articles */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.06em] text-[#5A6B7A] mb-2">
                Artigos cadastrados ({artigos.length})
              </h4>
              {artigosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#5A6B7A]" />
                </div>
              ) : artigos.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#5A6B7A] bg-[#F5F7F6] rounded-xl border border-dashed border-[#E5EAE8]">
                  Nenhum artigo cadastrado para esta norma.
                </div>
              ) : (
                <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {artigos.map((a) => (
                    <li
                      key={a.id}
                      className="group flex items-start gap-3 p-3 rounded-lg bg-[#F5F7F6] border border-[#E5EAE8] hover:border-[#4E7A54]/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2A4A] uppercase tracking-wide">
                          <Hash className="w-3 h-3 text-[#4E7A54]" />
                          {a.numero}
                        </div>
                        <p className="text-sm text-[#1A2B3C] leading-relaxed mt-1 line-clamp-3">
                          {a.texto}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveArtigo(a.id)}
                        title="Remover artigo"
                        className="shrink-0 p-1.5 rounded-lg text-[#8A98A6] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Inline add form */}
            <form
              onSubmit={handleAddArtigo}
              className="space-y-3 p-4 rounded-xl bg-[#EEF4EE]/50 border border-[#4E7A54]/25"
            >
              <h4 className="text-xs font-bold uppercase tracking-[0.06em] text-[#3F6645] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Adicionar novo artigo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
                <Field label="Número do artigo" required compact>
                  <input
                    type="text"
                    value={newArtigoNumero}
                    onChange={(e) => setNewArtigoNumero(e.target.value)}
                    placeholder="Ex.: Artigo 1º"
                    className="modal-input"
                  />
                </Field>
                <Field label="Trecho do texto citável" required compact>
                  <textarea
                    value={newArtigoTexto}
                    onChange={(e) => setNewArtigoTexto(e.target.value)}
                    placeholder="Cole o trecho exato do dispositivo legal…"
                    rows={3}
                    className="modal-input resize-y min-h-[88px] leading-relaxed"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingArtigo}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4E7A54] hover:bg-[#3F6645] text-white font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {addingArtigo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adicionando…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar Artigo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ===== Modal: Confirmação de desativação ===== */}
      {confirmingNorma && (
        <ModalOverlay
          onClose={() => setConfirmingNorma(null)}
          title={confirmingNorma.ativo ? 'Desativar norma' : 'Ativar norma'}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-[#1A2B3C] leading-relaxed">
                  {confirmingNorma.ativo ? (
                    <>
                      Tem certeza que deseja desativar esta norma?{' '}
                      <span className="font-semibold">
                        Ela deixará de ser utilizada como fonte nas consultas.
                      </span>
                    </>
                  ) : (
                    <>
                      Deseja reativar esta norma? Ela voltará a ser utilizada como fonte nas
                      consultas.
                    </>
                  )}
                </p>
                <p className="mt-2 text-xs font-medium text-[#5A6B7A] bg-[#F5F7F6] rounded-lg px-3 py-2 border border-[#E5EAE8]">
                  {confirmingNorma.titulo}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5EAE8]">
              <button
                type="button"
                onClick={() => setConfirmingNorma(null)}
                className="px-4 py-2 text-sm font-medium text-[#5A6B7A] hover:text-[#1A2B3C] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggle}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer ${
                  confirmingNorma.ativo
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#4E7A54] hover:bg-[#3F6645]'
                }`}
              >
                {confirmingNorma.ativo ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Desativar norma
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Ativar norma
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper subcomponents
// ---------------------------------------------------------------------------

function ModalOverlay({
  children,
  onClose,
  title,
  wide,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
  wide?: boolean
}) {
  // Close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll while modal open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0B2A4A]/70 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`w-full ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        } bg-white text-[#1A2B3C] rounded-t-2xl sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-[#E5EAE8] max-h-[92vh] flex flex-col animate-fade-in-up`}
      >
        {/* Accent bar */}
        <div className="h-1.5 bg-[#4E7A54] rounded-t-2xl shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5EAE8] shrink-0">
          <h2 className="text-lg font-bold tracking-tight text-[#0B2A4A]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A98A6] hover:bg-[#F5F7F6] hover:text-[#1A2B3C] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body (scrollable) */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  compact,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <label className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A6B7A]">
        {label}
        {required && <span className="text-[#4E7A54]"> *</span>}
      </label>
      {children}
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#8A98A6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
