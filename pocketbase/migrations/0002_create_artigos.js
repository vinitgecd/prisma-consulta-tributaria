migrate(
  (app) => {
    const normasId = app.findCollectionByNameOrId('normas').id

    const collection = new Collection({
      name: 'artigos',
      type: 'base',
      // Public read, auth write
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'norma_id',
          type: 'relation',
          required: true,
          collectionId: normasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'numero', type: 'text', required: true, min: 1, max: 30 },
        { name: 'texto', type: 'text', required: true, min: 3 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_artigos_norma_id ON artigos (norma_id)',
        'CREATE UNIQUE INDEX idx_artigos_norma_numero ON artigos (norma_id, numero)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('artigos')
    app.delete(collection)
  },
)
