export interface ClientProfile {
  segmento: string
  regimeTributario: string
  faixaFaturamento: string
  uf: string
}

export interface ConsultationResponse {
  respostaCurta: string
  fundamentacao: string
  fonte: string
  limiteAplicacao: string
  disclaimer: string
}

export const SEGMENTOS = ['Saúde', 'Comércio', 'Serviços', 'Indústria', 'Outros']

export const REGIMES_TRIBUTARIOS = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']

export const FAIXAS_FATURAMENTO = [
  'Até R$ 360 mil',
  'De R$ 360 mil a R$ 4,8 milhões',
  'De R$ 4,8 milhões a R$ 20 milhões',
  'Acima de R$ 20 milhões',
]

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  segmento: 'Saúde',
  regimeTributario: 'Simples Nacional',
  faixaFaturamento: 'De R$ 360 mil a R$ 4,8 milhões',
  uf: 'SP',
}

export const DEFAULT_QUESTION =
  'Como fica a tributação de uma clínica de saúde no Simples Nacional após a LC 214/2025?'

export const DEFAULT_RESPONSE: ConsultationResponse = {
  respostaCurta:
    'Clínicas de saúde enquadradas no Simples Nacional permanecem no Anexo III, com alíquotas progressivas conforme a faixa de faturamento. A LC 214/2025 mantém a sistemática atual de recolhimento unificado no período de transição.',
  fundamentacao:
    'Art. 13, § 1º, da Lei Complementar 123/2006, com redação dada pela LC 214/2025 — "Os valores devidos pelo Simples Nacional serão calculados por meio de alíquotas efetivas, aplicadas sobre a receita bruta acumulada, observado o período de transição previsto no art. 122-A."',
  fonte: 'Lei Complementar 214/2025, art. 13, § 1º — válida a partir de 01/01/2026.',
  limiteAplicacao: 'Válido para operações realizadas a partir de 1º de janeiro de 2026.',
  disclaimer:
    'Ferramenta de apoio; não substitui parecer técnico. Verifique a vigência das normas antes da tomada de decisão.',
}

export const REFUSAL_EXAMPLE =
  'Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. Recomendo consultar um especialista ou aguardar a atualização do corpus.'
