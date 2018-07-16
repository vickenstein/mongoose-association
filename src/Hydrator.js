/* eslint no-underscore-dangle: [2, {
  "allow": [
    "_id",
    "_field"
  ] }] */

const Association = require('./associations/Association')

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
      const _field = Association.cacheKey(field)
      documents.forEach((document, index) => {
        const fieldDocument = document[field]
        if (fieldDocument instanceof Array) {
          const nestedDocuments = fieldDocument
            .map(nestedDocument => nestedModel.hydrate(nestedDocument))
          hydratedDocuments[index][_field] = nestedDocuments
        } else {
          hydratedDocuments[index][_field] = nestedModel.hydrate(fieldDocument)
        }
      })
    })
    return hydratedDocuments
  }
}
