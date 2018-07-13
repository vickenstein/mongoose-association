module.exports = class Hydrator {
  static hydrate(documents, hydrateOptions) {
    const { model } = hydrateOptions
    const nestedFields = []
    Object.keys(hydrateOptions).forEach(field => {
      if (field !== 'model' && field !== 'reset') nestedFields.push(field)
    })
    const hydratedDocuments = documents.map(document => model.hydrate(document))

    nestedFields.forEach(field => {
      const nestedModel = hydrateOptions[field].model
      const $field = `$${field}`
      documents.forEach((document, index) => {
        const fieldDocument = document[field]
        if (fieldDocument instanceof Array) {
          const nestedDocuments = fieldDocument
            .map(nestedDocument => nestedModel.hydrate(nestedDocument))
          hydratedDocuments[index][$field] = nestedDocuments
        } else {
          hydratedDocuments[index][$field] = nestedModel.hydrate(fieldDocument)
        }
      })
    })
    return hydratedDocuments
  }
}
