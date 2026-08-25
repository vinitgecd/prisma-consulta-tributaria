import pb from '@/lib/pocketbase/client'
import type { ClientProfile } from '@/data/demoConsultations'

export interface Consulta {
  id: string
  usuario: string
  segmento: string
  regime: string
  faixa_faturamento: string
  uf: string
  pergunta: string
  resposta: string
  fonte_citada: string
  creditos_gastos: number
  data_consulta: string
  created: string
  updated: string
}

import type { ConsultationResponse } from '@/data/demoConsultations'

export interface CreateConsultaInput {
  profile: ClientProfile
  pergunta: string
  resposta: string
  fonteCitada: string
  creditosGastos: number
}

/**
 * Call real AI consultation hook on PocketBase.
 */
export async function consultarIA(
  pergunta: string,
  profile: ClientProfile,
): Promise<ConsultationResponse> {
  const response = await pb.send<ConsultationResponse>('/api/consultar', {
    method: 'POST',
    body: {
      pergunta,
      profile,
    },
  })
  return response
}

/**
 * Persist a consulta record for the currently authenticated user.
 */
export async function createConsulta(input: CreateConsultaInput): Promise<Consulta> {
  const record = await pb.collection('consultas').create<Consulta>({
    usuario: pb.authStore.record?.id,
    segmento: input.profile.segmento,
    regime: input.profile.regimeTributario,
    faixa_faturamento: input.profile.faixaFaturamento,
    uf: input.profile.uf,
    pergunta: input.pergunta,
    resposta: input.resposta,
    fonte_citada: input.fonteCitada,
    creditos_gastos: input.creditosGastos,
  })
  return record
}
