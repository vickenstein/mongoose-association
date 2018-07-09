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

  }

  static async populateAssociationField(model, field, documents, fields) {

  }

  static aggregateFromQuery(query) {
    const aggregate = query.model.aggregate().match(query._conditions)
    if (query.op === 'findOne') aggregate.limit(1).singular()
    return aggregate
  }
}
