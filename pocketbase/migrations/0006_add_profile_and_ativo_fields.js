migrate(
  (app) => {
    // 1. Add 'profile' select field to the users auth collection.
    //    Values: contador | advogado | administrador (not required — existing
    //    users keep an empty profile until explicitly set).
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('profile')) {
      users.fields.add(
        new SelectField({
          name: 'profile',
          required: false,
          values: ['contador', 'advogado', 'administrador'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }

    // 2. Add 'ativo' boolean (soft-delete) to normas and restrict all writes
    //    to authenticated users whose profile is 'administrador'. Read stays
    //    public (normas/artigos are reference data used to answer queries).
    const normas = app.findCollectionByNameOrId('normas')
    if (!normas.fields.getByName('ativo')) {
      normas.fields.add(new BoolField({ name: 'ativo', required: false }))
    }
    normas.listRule = ''
    normas.viewRule = ''
    normas.createRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    normas.updateRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    normas.deleteRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    app.save(normas)

    // Backfill ativo=true for normas created before this field existed.
    app.db().newQuery('UPDATE normas SET ativo = 1 WHERE ativo IS NULL OR ativo = 0').execute()

    // 3. Restrict artigos writes to admins (read stays public).
    const artigos = app.findCollectionByNameOrId('artigos')
    artigos.listRule = ''
    artigos.viewRule = ''
    artigos.createRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    artigos.updateRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    artigos.deleteRule = "@request.auth.id != '' && @request.auth.profile = 'administrador'"
    app.save(artigos)
  },
  (app) => {
    // Revert rules to the previous auth-only rules and drop added fields.
    const normas = app.findCollectionByNameOrId('normas')
    normas.createRule = "@request.auth.id != ''"
    normas.updateRule = "@request.auth.id != ''"
    normas.deleteRule = "@request.auth.id != ''"
    if (normas.fields.getByName('ativo')) {
      normas.fields.remove('ativo')
    }
    app.save(normas)

    const artigos = app.findCollectionByNameOrId('artigos')
    artigos.createRule = "@request.auth.id != ''"
    artigos.updateRule = "@request.auth.id != ''"
    artigos.deleteRule = "@request.auth.id != ''"
    app.save(artigos)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('profile')) {
      users.fields.remove('profile')
      app.save(users)
    }
  },
)
