migrate(
  (app) => {
    const collection = new Collection({
      name: 'assinaturas',
      type: 'base',
      // Owner can read/write their own subscriptions
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
        { name: 'plano', type: 'text', required: true, min: 2, max: 100 },
        { name: 'creditos_mensais', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'creditos_restantes', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'data_inicio', type: 'date', required: true },
        { name: 'data_fim', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativa', 'vencida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_assinaturas_usuario ON assinaturas (usuario)',
        'CREATE INDEX idx_assinaturas_status ON assinaturas (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('assinaturas')
    app.delete(collection)
  },
)
