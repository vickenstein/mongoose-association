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
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) populateFields = populateFields[0]
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

  static explainPopulate(model, documents, ...populateFields) {
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) populateFields = populateFields[0]
    const fields = (populateFields[0] && populateFields[0] instanceof Fields) ?
      populateFields[0] :
      new Fields(...populateFields)

    const rootFields = fields.root

    return _.flatten(rootFields.map(rootField => {
      const childrenFields = fields.children(rootField)
      return this.explainPopulateField(model, documents, rootField, childrenFields)
    }))
  }

  static async populateField(model, documents, field, childrenFields) {
    const $field = `$${field}`
    const association = model.associate(field)
    const results = await association.findFor(documents).populateAssociation(childrenFields)
    const enumerateMethod = association.associationType === 'hasMany' ? 'groupBy' : 'keyBy'
    let { localField, foreignField } = association
    if (association.through) foreignField = document => document[association.throughAsAssociation.$with][association.foreignField]
    const indexedResults = _[enumerateMethod](results, foreignField)
    documents.forEach(document => {
      document[$field] = indexedResults[document[localField]]
    })
    return documents
  }

  static explainPopulateField(model, documents, field, childrenFields) {
    const association = model.associate(field)
    return association.findFor(documents).populateAssociation(childrenFields)._explain()
  }

  // static prePopulateAggregate(aggregate, fields) {

  // }

  static async populateAggregate(model, documents, populateOptions) {
    if (populateOptions._fields) {
      await this.populate(documents[0].constructor, documents, populateOptions._fields)
    }
    const populateFields = Object.keys(populateOptions)
    for(let i = 0; i < populateFields.length; i++) {
      const field = populateFields[i]
      if (field !== '_fields') {
        const $field = `$${field}`
        const nestedDocuments = _.compact(_.flatten(documents.map(document => document[$field])))
        if (nestedDocuments.length) await this.populate(nestedDocuments[0].constructor, nestedDocuments, populateOptions[field])
      }
    }
    return documents
  }

  static explainPopulateAggregate(model, documents, populateOptions) {
    let explain = []
    if (populateOptions._fields) {
      explain = explain.concat(this.explainPopulate(mongoose.model(documents[0].modelName), documents, populateOptions._fields))
    }
    Object.keys(populateOptions).map(field => {
      if (field !== '_fields') {
        const association = model.associate(field)
        const foreignModel = association.foreignModel
        explain = explain.concat(this.explainPopulate(foreignModel, [foreignModel._explain()], populateOptions[field]))
      }
    })
    return explain
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
