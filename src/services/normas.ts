import pb from '@/lib/pocketbase/client'

export interface Norma {
  id: string
  titulo: string
  tipo: 'lei_complementar' | 'regulamento' | 'resolucao'
  numero: string
  data_publicacao: string
  data_validade: string
  url_oficial: string
  created: string
  updated: string
}

export interface Artigo {
  id: string
  norma_id: string
  numero: string
  texto: string
  created: string
  updated: string
}

/** List all normas (reference data is public). */
export async function listNormas(): Promise<Norma[]> {
  const result = await pb.collection('normas').getList<Norma>(1, 100, {
    sort: '-data_publicacao',
  })
  return result.items
}

/** List artigos for a given norma (reference data is public). */
export async function listArtigosByNorma(normaId: string): Promise<Artigo[]> {
  const result = await pb.collection('artigos').getList<Artigo>(1, 100, {
    filter: `norma_id = "${normaId}"`,
    sort: 'numero',
  })
  return result.items
}
