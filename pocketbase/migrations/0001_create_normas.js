migrate(
  (app) => {
    const collection = new Collection({
      name: 'normas',
      type: 'base',
      // Public read (normas are reference data), auth write
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true, min: 3, max: 500 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['lei_complementar', 'regulamento', 'resolucao'],
          maxSelect: 1,
        },
        { name: 'numero', type: 'text', required: true, min: 1, max: 50 },
        { name: 'data_publicacao', type: 'date', required: true },
        { name: 'data_validade', type: 'date' },
        { name: 'url_oficial', type: 'url', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_normas_tipo_numero ON normas (tipo, numero)',
        'CREATE INDEX idx_normas_data_publicacao ON normas (data_publicacao)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('normas')
    app.delete(collection)
  },
)
