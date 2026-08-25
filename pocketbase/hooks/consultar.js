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

      const systemPrompt = `Você é o assistente técnico do Prisma Consulta Tributária, um sistema especializado em análise tributária brasileira fundamentada exclusivamente no acervo de normas oficiais fornecido.

DIRETRIZES FUNDAMENTAIS E REGRAS DE GROUNDING ESTRITO:
1. Você deve responder EXCLUSIVAMENTE com base nas normas e artigos presentes no acervo (corpus) fornecido abaixo.
2. Se a pergunta disser respeito a um segmento ou a um regime tributário que o acervo (corpus) NÃO cobre (por exemplo: empresas de consultoria, o regime de Lucro Presumido, Lucro Real, ou qualquer outro tema/segmento/regime sem normas ou artigos expressos no acervo), você DEVE OBRIGATORIAMENTE recusar a resposta definindo "recusada": true e preenchendo o campo "mensagem" com uma recusa educada e clara em português explicando que o acervo atual não contempla normas específicas para esse tema/segmento/regime.
3. Você NUNCA deve responder sobre um segmento ou regime tributário diferente do que foi perguntado ou configurado no perfil (por exemplo: NUNCA responder sobre o Simples Nacional ou clínicas de saúde quando a pergunta indagar sobre Lucro Presumido ou consultorias).
4. Você NUNCA deve inventar normas, leis, números de artigos, trechos de artigos, alíquotas ou datas de vigência. Toda citação deve corresponder exatamente ao que consta no acervo.
5. Se houver embasamento suficiente no acervo para o segmento e regime questionados, retorne "recusada": false com todos os 5 campos técnicos estruturados.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Você deve responder ESTRITAMENTE em formato JSON válido, sem qualquer texto ou formatação Markdown antes ou depois.

Se "recusada" for false (a resposta foi encontrada e fundamentada no acervo para o regime/segmento correto):
{
  "recusada": false,
  "respostaCurta": "Resposta direta e objetiva à dúvida em 2 a 4 linhas.",
  "fundamentacao": "Transcrição ou citação expressa dos artigos do acervo que respaldam a análise.",
  "fonte": "Identificação precisa da norma e artigo do acervo (ex: 'Lei Complementar 214/2025, art. 4º').",
  "limiteAplicacao": "Condições temporais, vigência ou restrições práticas da norma constante no acervo.",
  "disclaimer": "Ferramenta de apoio; não substitui parecer técnico. Verifique a vigência das normas antes da tomada de decisão."
}

Se "recusada" for true (não há normas/artigos no acervo para o segmento/regime da pergunta, ou a dúvida está fora do corpus):
{
  "recusada": true,
  "mensagem": "Ainda não tenho uma resposta segura para essa pergunta no meu acervo de normas. O acervo atual não contempla normas específicas para este regime/segmento. Recomendo consultar um especialista ou aguardar a atualização do corpus."
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
