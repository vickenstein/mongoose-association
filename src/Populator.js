const _ = require('lodash')
const mongoose = require('mongoose')
const Query = mongoose.Query
const _exec = Query.prototype.exec
const Fields = require('./Fields')
const Associations = require('./Associations')

module.exports = class Populator {

  static checkFields(populateFields) {
    let fields = populateFields
    if (fields.length === 1 && fields[0] instanceof Fields) {
      fields = fields[0]
    } else {
      fields = new Fields(...populateFields)
    }
    return fields
  }

  static async populate(model, documents, ...populateFields) {
    const fields = (populateFields[0] && populateFields[0] instanceof Fields) ?
      populateFields[0] :
      new Fields(...populateFields)

    const rootFields = fields.root

    for(let i = 0; i < rootFields.length; i++) {
      const rootField = rootFields[i]
      const childrenFields = fields.children(rootField)
      await this.populateField(model, documents, rootField, childrenFields)
    }

    return documents
  }

  static async populateField(model, documents, field, childrenFields) {
    const $field = `$${field}`
    const association = model.associate(field)
    const results = await association.findManyFor(documents).populateAssociation(childrenFields)
    const { localField, foreignField } = association
    const indexedResults = _.keyBy(results, foreignField)
    documents.forEach(document => {
      document[$field] = indexedResults[document[localField]]
    })
    return documents
  }

  static async populateAggregate(model, documents, populateOptions) {
    const populateFields = Object.keys(populateOptions)
    for(let i = 0; i < populateFields.length; i++) {
      const field = populateFields[i]
      const $field = `$${field}`
      const nestedDocuments = _.compact(_.flatten(documents.map(document => document[$field])))
      await this.populate(nestedDocuments[0].constructor, nestedDocuments, populateOptions[field])
    }
    return documents
  }

  static aggregateFromQuery(query, fields) {
    const aggregate = query.model.aggregate().match(query._conditions)
    if (query.op === 'findOne') aggregate.limit(1).singular()
    fields.root.forEach(field => {
      const association = query.model.associate(field)
      query.model.associate(field).aggregateTo(aggregate)
      const children = fields.children(field)
      if (children.length) {
        const options = {}
        options[field] = children
        aggregate.populateAssociation(options)
      }
    })
    aggregate.hydrateAssociation({ model: query.model })
    return aggregate
  }
}
