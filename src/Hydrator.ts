import * as mongoose from 'mongoose'
import { Association } from './associations/Association'

export interface IHydrateOptions {
  model: typeof mongoose.Model,
  [field: string]: any
}

export class Hydrator {
  static hydrate(documents: any[], hydrateOptions: IHydrateOptions) {
    const { model } = hydrateOptions

    const nestedFields: string[] = []
    Object.keys(hydrateOptions).forEach((field) => {
      if (field !== 'model' && field !== 'reset') nestedFields.push(field)
    })
    const hydratedDocuments = documents.map(document => model.hydrate(document))

    nestedFields.forEach((field) => {
      const nestedModel = hydrateOptions[field].model
      const cacheField = Association.cacheKey(field)
      documents.forEach((document, index) => {
        const fieldDocument = document[field]
        if (fieldDocument instanceof Array) {
          const nestedDocuments = fieldDocument
            .map(nestedDocument => nestedModel.hydrate(nestedDocument))
          hydratedDocuments[index][cacheField] = nestedDocuments
        } else if (fieldDocument) {
          hydratedDocuments[index][cacheField] = nestedModel.hydrate(fieldDocument)
        } else {
          hydratedDocuments[index][cacheField] = null
        }
      })
    })
    return hydratedDocuments
  }
}
