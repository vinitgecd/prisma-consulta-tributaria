migrate(
  (app) => {
    const collection = new Collection({
      name: 'consultas',
      type: 'base',
      // Owner can read/write their own queries
      listRule: "@request.auth.id != '' && usuario = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario = @request.auth.id",
      createRule: "@request.auth.id != '' && usuario = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario = @request.auth.id",
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'segmento', type: 'text', required: false, max: 100 },
        { name: 'regime', type: 'text', required: false, max: 100 },
        { name: 'faixa_faturamento', type: 'text', required: false, max: 100 },
        { name: 'uf', type: 'text', required: false, max: 10 },
        { name: 'pergunta', type: 'text', required: true, min: 3 },
        { name: 'resposta', type: 'text', required: false },
        { name: 'fonte_citada', type: 'text', required: false },
        { name: 'creditos_gastos', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'data_consulta', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_consultas_usuario ON consultas (usuario)',
        'CREATE INDEX idx_consultas_created ON consultas (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('consultas')
    app.delete(collection)
  },
)
