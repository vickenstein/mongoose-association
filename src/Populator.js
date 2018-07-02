const _ = require('lodash')
const mongoose = require('mongoose')
const Query = mongoose.Query
const _exec = Query.prototype.exec
const Fields = require('./Fields')

const ASSOCIATION_TYPES = ['belongsTo', 'polymorphic', 'hasMany', 'hasOne']

module.exports = class Populator {
  static get associationTypes() {
    return ASSOCIATION_TYPES
  }

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
    let fields = this.checkFields(populateFields)
    if (fields.length) {
      const rootFields = fields.root
      for (let i = 0; i < rootFields.length; i++) {
        const field = rootFields[i]
        await this.populateAssociationField(model, field, documents, fields.children(field))
      }
    }
    return documents
  }

  static async populateAssociationField(model, field, documents, fields) {
    const associations = model.schema.associations
    const associationTypes = this.associationTypes
    for (let i = 0; i < associationTypes.length; i++) {
      const associationType = associationTypes[i]
      const association = _.get(associations, `${associationType}.indexedByLocalField.${field}`)
      if (association) {
        return await this[associationType](association, documents, fields)
      }
    }
  }

  static async belongsTo(association, documents, fields) {
    const { modelName, localField, foreignField } = association
    if (_.isArray(documents)) {
      const records = await association.findManyFor(documents).populateAssociation(fields)
      const recordsMap = _.keyBy(records, '_id')
      documents.forEach(document => {
        document[foreignField] = recordsMap[document[foreignField]]
      })
    } else {
      documents[foreignField] = await association.findFor(documents).populateAssociation(fields)
    }
  }

  static async hasOne() {

  }

  static async hasMany() {

  }

  static async polymorphic(association, documents, fields) {
    const { localField, foreignField } = association
    if (_.isArray(documents)) {
      const queryMap = association.findManyFor(documents)
      const types = Object.keys(queryMap)
      for (let i = 0; i < types.length; i++) {
        const modelName = types[i]
        const records = await queryMap[modelName].populateAssociation(fields)
        queryMap[modelName] = _.keyBy(records, '_id')
      }
      documents.forEach(document => {
        document[localField] = queryMap[document[`${foreignField}Type`]][document[foreignField]]
      })
    } else {
      documents[localField] = await association.findFor(documents).populateAssociation(fields)
    }
  }
}
