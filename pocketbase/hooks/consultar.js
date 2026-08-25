/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de consulta tributária inteligente com Skip AI Gateway ($ai.chat).
 *
 * Endpoint: POST /api/consultar
 * Requer autenticação do usuário.
 */
routerAdd(
  'POST',
  '/api/consultar',
  (e) => {
    try {
      const authRecord = e.auth
      if (!authRecord || !authRecord.id) {
        return e.json(401, { error: 'Autenticação necessária para realizar consultas.' })
      }

      const body = e.requestInfo().body || {}
      const pergunta = (body.pergunta || '').trim()
      const profile = body.profile || {}

      if (!pergunta) {
        return e.json(400, { error: 'A pergunta não pode estar vazia.' })
      }

      // 1. Carregar normas ativas e seus artigos do acervo
      let normasRecords = []
      try {
        normasRecords = $app.findRecordsByFilter(
          'normas',
          'ativo = true',
          '-data_publicacao',
          50,
          0,
        )
      } catch (err) {
        normasRecords = []
      }

      let artigosRecords = []
      try {
        artigosRecords = $app.findRecordsByFilter('artigos', '', 'numero', 200, 0)
      } catch (err) {
        artigosRecords = []
      }

      // Mapear artigos por norma_id
      const normasMap = {}
      for (let i = 0; i < normasRecords.length; i++) {
        const n = normasRecords[i]
        normasMap[n.id] = {
          titulo: n.getString('titulo'),
          numero: n.getString('numero'),
          tipo: n.getString('tipo'),
          data_publicacao: n.getString('data_publicacao'),
          data_validade: n.getString('data_validade'),
          artigos: [],
        }
      }

      for (let i = 0; i < artigosRecords.length; i++) {
        const art = artigosRecords[i]
        const nId = art.getString('norma_id')
        if (normasMap[nId]) {
          normasMap[nId].artigos.push({
            numero: art.getString('numero'),
            texto: art.getString('texto'),
          })
        }
      }

      // Montar corpus de texto fundamentado
      let corpusText = 'ACERVO DE NORMAS TRIBUTÁRIAS:\n'
      const normaKeys = Object.keys(normasMap)
      if (normaKeys.length === 0) {
        corpusText += '(Nenhuma norma cadastrada no momento.)\n'
      } else {
        for (let i = 0; i < normaKeys.length; i++) {
          const n = normasMap[normaKeys[i]]
          corpusText += `\n--- NORMA: ${n.numero} - ${n.titulo} (Publicação: ${n.data_publicacao || 'N/A'}${n.data_validade ? ', Validade: ' + n.data_validade : ''}) ---\n`
          if (n.artigos.length === 0) {
            corpusText += 'Sem artigos cadastrados.\n'
          } else {
            for (let j = 0; j < n.artigos.length; j++) {
              corpusText += `${n.artigos[j].numero}: ${n.artigos[j].texto}\n`
            }
          }
        }
      }

      const perfilInfo = `Perfil do Cliente Consultado:
- Segmento: ${profile.segmento || 'Não informado'}
- Regime Tributário: ${profile.regimeTributario || 'Não informado'}
- Faixa de Faturamento: ${profile.faixaFaturamento || 'Não informado'}
- UF: ${profile.uf || 'Não informado'}`

      const systemPrompt = `Você é o assistente técnico do Prisma Consulta Tributária, um sistema especializado em análise tributária brasileira fundamentada no acervo de normas oficiais fornecido.

DIRETRIZES FUNDAMENTAIS E REGRAS DE ATUAÇÃO:

1. INTERPRETAÇÃO SEMÂNTICA E MAPEAMENTO DE PERFIL:
- Interprete a INTENÇÃO SEMÂNTICA da pergunta do usuário e mapeie-a para o perfil do cliente informado (segmento, regime tributário, faixa de faturamento, UF).
- Por exemplo: uma pergunta sobre "empresa de consultoria no Simples Nacional" deve ser compreendida como uma dúvida sobre empresa prestadora de serviços optante pelo regime do Simples Nacional, devendo ser respondida com os artigos do acervo aplicáveis a esse perfil/regime/tema.

2. RECUPERAÇÃO E RELEVÂNCIA TEMÁTICA:
- Recupere as normas e artigos mais relevantes do acervo (corpus) para a pergunta e o perfil, mesmo quando os termos exatos da pergunta não constarem de forma literal/ipsis litteris no acervo.
- Raciocine sobre relevância temática utilizando conceitos como: reforma tributária, IBS, CBS, Simples Nacional, Lucro Presumido, Lucro Real, saúde, serviços, comércio, indústria, período de transição, recolhimento unificado, alíquota, regime específico, entidades sem fins lucrativos, certidão de regularidade fiscal.

3. RESPOSTA ASSERTIVA E FUNDAMENTADA:
- Quando existirem artigos pertinentes no acervo, construa uma resposta assertiva fundamentada neles, combinando os artigos aplicáveis e citando expressamente a norma e o artigo específicos no campo "fonte".
- A resposta deve ser útil, direta e propositiva, nunca uma recusa quando houver embasamento temático ou geral aplicável.

4. CRITÉRIO ESTRITO DE RECUSA (EXCEÇÃO, NÃO O PADRÃO):
- Recuse a resposta SOMENTE quando NENHUM artigo do acervo guardar relação com o tema e o perfil da pergunta. A recusa deve ser a exceção absoluta, não o padrão.

5. GROUNDING E PROIBIÇÃO DE INVENÇÃO:
- NUNCA invente normas, artigos, trechos de lei ou datas de vigência. Você só pode citar normas e artigos que efetivamente existam no acervo fornecido.
- Quando o trecho exato não estiver transcrito na íntegra, elabore uma síntese ou paráfrase estritamente fundamentada no texto existente no acervo, identificando o artigo de origem.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Responda EXCLUSIVAMENTE em formato JSON válido, puro, sem blocos markdown ou cercas de código (\`\`\`json).

Quando responder ("recusada": false):
{
  "recusada": false,
  "respostaCurta": "1 a 2 frases diretas e objetivas respondendo à dúvida.",
  "fundamentacao": "Trecho exato ou síntese estritamente fundamentada citando o artigo aplicável do acervo.",
  "fonte": "Identificação precisa da norma, artigo e data de vigência/validade constante no acervo.",
  "limiteAplicacao": "Limite temporal, territorial ou material de aplicação da regra.",
  "disclaimer": "Ferramenta de apoio; não substitui parecer técnico."
}

Quando recusar ("recusada": true):
{
  "recusada": true,
  "mensagem": "Mensagem clara e educada explicando a recusa quando nenhum artigo do acervo se relacionar ao tema/perfil."
}`

      const userMessage = `${perfilInfo}

Pergunta do Usuário:
"${pergunta}"

${corpusText}`

      let chatRes
      try {
        chatRes = $ai.chat({
          model: 'fast',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })
      } catch (aiErr) {
        return e.json(500, {
          error: 'Falha na comunicação com o serviço de inteligência artificial.',
          recusada: true,
          mensagem:
            'Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. Recomendo consultar um especialista ou aguardar a atualização do corpus.',
        })
      }

      const content =
        chatRes &&
        chatRes.choices &&
        chatRes.choices[0] &&
        chatRes.choices[0].message &&
        chatRes.choices[0].message.content
          ? chatRes.choices[0].message.content.trim()
          : ''

      if (!content) {
        return e.json(200, {
          recusada: true,
          mensagem:
            'Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. Recomendo consultar um especialista ou aguardar a atualização do corpus.',
        })
      }

      let parsed
      try {
        // Remove possíveis blocos markdown ```json ... ``` se o modelo enviar
        let cleaned = content
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
        }
        parsed = JSON.parse(cleaned)
      } catch (parseErr) {
        return e.json(200, {
          recusada: true,
          mensagem:
            'Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. Recomendo consultar um especialista ou aguardar a atualização do corpus.',
        })
      }

      return e.json(200, parsed)
    } catch (err) {
      return e.json(500, {
        error: err.message || 'Erro interno ao processar a consulta.',
        recusada: true,
        mensagem:
          'Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. Recomendo consultar um especialista ou aguardar a atualização do corpus.',
      })
    }
  },
  $apis.requireAuth(),
)
