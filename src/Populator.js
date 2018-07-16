/* eslint no-param-reassign: 0 */
/* eslint no-underscore-dangle: [2, {
  "allow": [
    "_explain",
    "_conditions",
    "_model",
    "_field",
    "_with"
  ] }] */

const _ = require('lodash')
const Fields = require('./Fields')
const Association = require('./associations/Association')

module.exports = class Populator {
  static checkFields(populateFields) {
    if (populateFields[0] && populateFields[0] instanceof Fields) {
      return populateFields[0]
    }
    return new Fields(...populateFields)
  }

  static async populate(model, documents, ...populateFields) {
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) [populateFields] = populateFields
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root

    await Promise.all(rootFields.map(rootField => {
      const childrenFields = fields.children(rootField)
      return this.populateField(model, documents, rootField, childrenFields)
    }))

    return documents
  }

  static explainPopulate(model, documents, ...populateFields) {
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) [populateFields] = populateFields
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root

    return _.flatten(rootFields.map(rootField => {
      const childrenFields = fields.children(rootField)
      return this.explainPopulateField(model, documents, rootField, childrenFields)
    }))
  }

  static async populateField(model, documents, field, childrenFields) {
    const _field = Association.cacheKey(field)
    const association = model.associate(field)
    const results = await association.findFor(documents).populateAssociation(childrenFields)
    const enumerateMethod = association.associationType === 'hasMany' ? 'groupBy' : 'keyBy'
    const { localField } = association
    let { foreignField } = association
    if (association.through) {
      foreignField = document => document[association.throughAsAssociation._with][foreignField]
    }
    const indexedResults = _[enumerateMethod](results, foreignField)
    documents.forEach(document => {
      document[_field] = indexedResults[document[localField]]
    })
    return documents
  }

  static explainPopulateField(model, documents, field, childrenFields) {
    const association = model.associate(field)
    return association.findFor(documents).populateAssociation(childrenFields)._explain()
  }

  static prePopulateAggregate(aggregate, ...populateFields) {
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root
    const model = aggregate._model
    rootFields.forEach(rootField => {
      const childrenFields = fields.children(rootField)
      const association = model.associate(rootField)
      association.aggregateTo(aggregate)
      if (childrenFields.length) {
        const options = {}
        options[rootField] = childrenFields
        aggregate.populateAssociation(options)
      }
    })
  }

  static async populateAggregate(model, documents, populateOptions) {
    const populateFields = Object.keys(populateOptions)
    const promises = []
    populateFields.forEach(field => {
      if (field !== '_fields') {
        const _field = Association.cacheKey(field)
        const nestedDocuments = _.compact(_.flatten(documents.map(document => document[_field])))
        if (nestedDocuments.length) {
          promises.push(this.populate(
            nestedDocuments[0].constructor,
            nestedDocuments,
            populateOptions[field]
          ))
        }
      }
    })
    await Promise.all(promises)
    return documents
  }

  static explainPopulateAggregate(model, documents, populateOptions) {
    let explain = []
    Object.keys(populateOptions).forEach(field => {
      if (field !== '_fields') {
        const association = model.associate(field)
        const { foreignModel } = association
        explain = explain.concat(this.explainPopulate(
          foreignModel,
          [foreignModel._explain()],
          populateOptions[field]
        ))
      }
    })
    return explain
  }

  static queryConditionToAggregateMatch(conditions) {
    Object.keys(conditions).forEach(key => {
      if (conditions[key] instanceof Array) {
        conditions[key] = { $in: conditions[key] }
      }
    })
    return conditions
  }

  static aggregateFromQuery(query, fields) {
    const aggregate = query.model.aggregate()
      .match(this.queryConditionToAggregateMatch(query._conditions))
    if (query.op === 'findOne') aggregate.limit(1).singular()
    fields.root.forEach(field => {
      const association = query.model.associate(field)
      association.aggregateTo(aggregate)
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
