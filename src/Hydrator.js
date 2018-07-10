module.exports = class Hydrator {
  static hydrate(documents, hydrateOptions) {
    const model = hydrateOptions.model
    const nestedFields = []
    Object.keys(hydrateOptions).forEach(field => {
      if (field !== 'model' && field !== 'reset') nestedFields.push(field)
    })
    const hydratedDocuments = documents.map(document => {
      return model.hydrate(document)
    })

    nestedFields.forEach(field => {
      const model = hydrateOptions[field].model
      const $field = `$${field}`
      documents.forEach((document, index) => {
        if (document[field] instanceof Array) {
          hydratedDocuments[index][$field] = document[field].map(document => model.hydrate(document))
        } else {
          hydratedDocuments[index][$field] = model.hydrate(document[field])
        }
      })
    })
    return hydratedDocuments
  }
}
