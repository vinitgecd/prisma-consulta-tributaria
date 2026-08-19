migrate(
  (app) => {
    // 1. Ensure the seeded admin user has profile = 'administrador'.
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'vinitg44@gmail.com')
      if (u.getString('profile') !== 'administrador') {
        u.set('profile', 'administrador')
        app.save(u)
      }
    } catch (_) {}

    // 2. Seed the two example normas with their articles (idempotent by numero).
    const normasData = [
      {
        titulo: 'Lei Complementar nº 214, de 16 de janeiro de 2025',
        tipo: 'lei_complementar',
        numero: 'LC 214/2025',
        data_publicacao: '2025-01-16',
        data_validade: '2027-01-01',
        url_oficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        artigos: [
          {
            numero: 'Artigo 1º',
            texto:
              'Fica instituído o Imposto sobre Bens e Serviços (IBS), de competência compartilhada entre Estados, Distrito Federal e Municípios, e a Contribuição Social sobre Bens e Serviços (CBS), de competência da União.',
          },
          {
            numero: 'Artigo 5º',
            texto:
              'A alíquota do IBS e da CBS será uniforme para todos os bens e serviços, admitindo-se a fixação de alíquotas diferenciadas para os casos previstos nesta Lei Complementar.',
          },
          {
            numero: 'Artigo 12',
            texto:
              'As entidades sem fins lucrativos que atuem nas áreas de saúde, educação e assistência social poderão ser beneficiárias de regime específico de tributação, conforme regulamentação do Comitê Gestor.',
          },
        ],
      },
      {
        titulo: 'Resolução CG-IBS nº 45, de 20 de março de 2025',
        tipo: 'resolucao',
        numero: 'CG-IBS 45/2025',
        data_publicacao: '2025-03-20',
        data_validade: '2026-03-20',
        url_oficial: '',
        artigos: [
          {
            numero: 'Artigo 2º',
            texto:
              'As empresas optantes pelo Simples Nacional terão tratamento diferenciado quanto à apuração e recolhimento do IBS e da CBS, podendo optar pelo regime de recolhimento unificado.',
          },
          {
            numero: 'Artigo 7º',
            texto:
              'Para fins de fruição de benefícios fiscais, o contribuinte deverá apresentar certidão de regularidade fiscal expedida pelo Comitê Gestor, com validade de 90 dias.',
          },
        ],
      },
    ]

    const normasCol = app.findCollectionByNameOrId('normas')
    const artigosCol = app.findCollectionByNameOrId('artigos')

    for (const n of normasData) {
      let normaId
      let existing = null
      try {
        existing = app.findFirstRecordByData('normas', 'numero', n.numero)
      } catch (_) {}

      if (existing) {
        normaId = existing.id
        existing.set('titulo', n.titulo)
        existing.set('tipo', n.tipo)
        existing.set('data_publicacao', n.data_publicacao)
        existing.set('data_validade', n.data_validade)
        existing.set('url_oficial', n.url_oficial)
        existing.set('ativo', true)
        app.save(existing)
      } else {
        const rec = new Record(normasCol)
        rec.set('titulo', n.titulo)
        rec.set('tipo', n.tipo)
        rec.set('numero', n.numero)
        rec.set('data_publicacao', n.data_publicacao)
        rec.set('data_validade', n.data_validade)
        rec.set('url_oficial', n.url_oficial)
        rec.set('ativo', true)
        app.save(rec)
        normaId = rec.id
      }

      // Seed articles — idempotent by (norma_id, numero) which is unique-indexed.
      for (const a of n.artigos) {
        let found = []
        try {
          found = app.findRecordsByFilter(
            'artigos',
            'norma_id = "' + normaId + '" && numero = "' + a.numero + '"',
            '',
            1,
            0,
          )
        } catch (_) {}
        if (found && found.length > 0) continue

        const rec = new Record(artigosCol)
        rec.set('norma_id', normaId)
        rec.set('numero', a.numero)
        rec.set('texto', a.texto)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Remove the two seeded normas (cascade-deletes their articles).
    for (const num of ['LC 214/2025', 'CG-IBS 45/2025']) {
      try {
        const n = app.findFirstRecordByData('normas', 'numero', num)
        app.delete(n)
      } catch (_) {}
    }
  },
)
