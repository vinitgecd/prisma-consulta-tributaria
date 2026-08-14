migrate(
  (app) => {
    // 1. Seed admin user (idempotent)
    let userRecord
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'vinitg44@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      userRecord = new Record(users)
      userRecord.setEmail('vinitg44@gmail.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'Administrador Prisma')
      app.save(userRecord)
    }

    // 2. Seed an active subscription for the admin user (idempotent)
    try {
      app.findFirstRecordByData('assinaturas', 'usuario', userRecord.id)
    } catch (_) {
      const assinaturas = app.findCollectionByNameOrId('assinaturas')
      const ass = new Record(assinaturas)
      ass.set('usuario', userRecord.id)
      ass.set('plano', 'Profissional')
      ass.set('creditos_mensais', 50)
      ass.set('creditos_restantes', 50)
      ass.set('data_inicio', new Date().toISOString().slice(0, 10))
      ass.set('data_fim', '')
      ass.set('status', 'ativa')
      app.save(ass)
    }

    // 3. Seed reference normas (idempotent by titulo + numero)
    const normasData = [
      {
        titulo: 'Lei Complementar 214/2025 — Reforma Tributária',
        tipo: 'lei_complementar',
        numero: '214/2025',
        data_publicacao: '2025-01-15',
        data_validade: '',
        url_oficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp214.htm',
      },
      {
        titulo: 'Lei Complementar 123/2006 — Simples Nacional',
        tipo: 'lei_complementar',
        numero: '123/2006',
        data_publicacao: '2006-12-14',
        data_validade: '',
        url_oficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp123.htm',
      },
      {
        titulo: 'Regulamento do IBS e do IS — RIBS/2026',
        tipo: 'regulamento',
        numero: 'RIBS/2026',
        data_publicacao: '2026-01-02',
        data_validade: '',
        url_oficial: '',
      },
    ]

    const normasCol = app.findCollectionByNameOrId('normas')
    const createdNormas = {}
    for (const n of normasData) {
      try {
        createdNormas[n.numero] = app.findFirstRecordByData('normas', 'numero', n.numero).id
      } catch (_) {
        const rec = new Record(normasCol)
        rec.set('titulo', n.titulo)
        rec.set('tipo', n.tipo)
        rec.set('numero', n.numero)
        rec.set('data_publicacao', n.data_publicacao)
        rec.set('data_validade', n.data_validade)
        rec.set('url_oficial', n.url_oficial)
        app.save(rec)
        createdNormas[n.numero] = rec.id
      }
    }

    // 4. Seed artigos (idempotent by norma_id + numero)
    const artigosData = [
      {
        norma: '214/2025',
        numero: 'Art. 13',
        texto:
          'Art. 13. O Simples Nacional poderá ser recolhido por meio de alíquotas efetivas, aplicadas sobre a receita bruta acumulada, observado o período de transição previsto no art. 122-A.',
      },
      {
        norma: '214/2025',
        numero: 'Art. 122-A',
        texto:
          'Art. 122-A. O período de transição dos tributos federais para o IBS e o IS ocorrerá de forma gradual entre 2026 e 2033, conforme cronograma estabelecido em regulamento.',
      },
      {
        norma: '123/2006',
        numero: 'Art. 13, §1º',
        texto:
          'Art. 13, § 1º. Os valores devidos pelo Simples Nacional serão calculados por meio da aplicação de alíquotas efetivas sobre a receita bruta acumulada.',
      },
    ]

    const artigosCol = app.findCollectionByNameOrId('artigos')
    for (const a of artigosData) {
      const normaId = createdNormas[a.norma]
      if (!normaId) continue
      let exists = false
      try {
        app.findFirstRecordByData('artigos', 'numero', a.numero)
        exists = true
      } catch (_) {}
      if (exists) continue
      const rec = new Record(artigosCol)
      rec.set('norma_id', normaId)
      rec.set('numero', a.numero)
      rec.set('texto', a.texto)
      app.save(rec)
    }
  },
  (app) => {
    // down: remove seeded data only
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'vinitg44@gmail.com')
      app.delete(u)
    } catch (_) {}
    for (const num of ['214/2025', '123/2006', 'RIBS/2026']) {
      try {
        const n = app.findFirstRecordByData('normas', 'numero', num)
        app.delete(n)
      } catch (_) {}
    }
  },
)
