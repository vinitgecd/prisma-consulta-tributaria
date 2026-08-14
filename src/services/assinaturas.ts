import pb from '@/lib/pocketbase/client'

export interface Assinatura {
  id: string
  usuario: string
  plano: string
  creditos_mensais: number
  creditos_restantes: number
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'vencida' | 'cancelada'
  created: string
  updated: string
}

/**
 * Fetch the active subscription for the currently authenticated user.
 * Returns null when there is no active subscription.
 */
export async function getActiveAssinatura(): Promise<Assinatura | null> {
  if (!pb.authStore.isValid) return null
  try {
    const record = await pb
      .collection('assinaturas')
      .getFirstListItem<Assinatura>(`usuario = "${pb.authStore.record?.id}" && status = "ativa"`)
    return record
  } catch {
    return null
  }
}

/**
 * Decrement one credit from the given subscription id.
 * Returns the updated credit count, or null if no credits were available.
 */
export async function debitCredit(assinaturaId: string): Promise<number | null> {
  // Fetch fresh to avoid stale count races
  const ass = await pb.collection('assinaturas').getOne<Assinatura>(assinaturaId)
  if (ass.creditos_restantes <= 0) return null
  const novo = ass.creditos_restantes - 1
  const updated = await pb.collection('assinaturas').update<Assinatura>(assinaturaId, {
    creditos_restantes: novo,
  })
  return updated.creditos_restantes
}
