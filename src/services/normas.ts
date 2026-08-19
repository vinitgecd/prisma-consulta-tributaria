import pb from '@/lib/pocketbase/client'

export type TipoNorma = 'lei_complementar' | 'regulamento' | 'resolucao'

export interface Norma {
  id: string
  titulo: string
  tipo: TipoNorma
  numero: string
  data_publicacao: string
  data_validade: string
  url_oficial: string
  ativo: boolean
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

export const TIPO_NORMA_LABELS: Record<TipoNorma, string> = {
  lei_complementar: 'Lei Complementar',
  regulamento: 'Regulamento',
  resolucao: 'Resolução',
}

export interface NormaInput {
  titulo: string
  tipo: TipoNorma
  numero: string
  data_publicacao: string
  data_validade: string
  url_oficial: string
}

/** List all normas (reference data is public). */
export async function listNormas(): Promise<Norma[]> {
  const result = await pb.collection('normas').getList<Norma>(1, 200, {
    sort: '-data_publicacao',
  })
  return result.items
}

/** List every artigo (used to compute per-norma counts on the acervo screen). */
export async function listAllArtigos(): Promise<Artigo[]> {
  const result = await pb.collection('artigos').getList<Artigo>(1, 500, {
    sort: 'numero',
  })
  return result.items
}

/** Create a new norma (admin only). */
export async function createNorma(input: NormaInput): Promise<Norma> {
  return await pb.collection('normas').create<Norma>({
    titulo: input.titulo,
    tipo: input.tipo,
    numero: input.numero,
    data_publicacao: input.data_publicacao,
    data_validade: input.data_validade || '',
    url_oficial: input.url_oficial || '',
    ativo: true,
  })
}

/** Update an existing norma (admin only). */
export async function updateNorma(id: string, input: NormaInput): Promise<Norma> {
  return await pb.collection('normas').update<Norma>(id, {
    titulo: input.titulo,
    tipo: input.tipo,
    numero: input.numero,
    data_publicacao: input.data_publicacao,
    data_validade: input.data_validade || '',
    url_oficial: input.url_oficial || '',
  })
}

/** Soft delete / restore a norma via the `ativo` flag (admin only). */
export async function setNormaAtivo(id: string, ativo: boolean): Promise<Norma> {
  return await pb.collection('normas').update<Norma>(id, { ativo })
}

/** List artigos for a given norma (reference data is public). */
export async function listArtigosByNorma(normaId: string): Promise<Artigo[]> {
  const result = await pb.collection('artigos').getList<Artigo>(1, 200, {
    filter: `norma_id = "${normaId}"`,
    sort: 'numero',
  })
  return result.items
}

/** Add an article to a norma (admin only). */
export async function createArtigo(
  normaId: string,
  numero: string,
  texto: string,
): Promise<Artigo> {
  return await pb.collection('artigos').create<Artigo>({
    norma_id: normaId,
    numero,
    texto,
  })
}

/** Remove an article (admin only). */
export async function deleteArtigo(id: string): Promise<void> {
  await pb.collection('artigos').delete(id)
}
