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


  static async belongsTo({ modelName, localField, foreignKey }, documents, fields) {
    if (_.isArray(documents)) {
      const _id = documents.map(document => document[foreignKey])
      const records = await mongoose.model(modelName).find({ _id }).populateAssociation(...fields.fields)
      const recordsMap = _.keyBy(records, '_id')
      documents.forEach(document => {
        document[foreignKey] = recordsMap[document[foreignKey]]
      })
    } else {
      documents[foreignKey] = await mongoose.model(modelName).findOne({ _id: documents[foreignKey] }).populateAssociation(...fields.fields)
    }
  }

  static async hasOne() {

  }

  static async hasMany() {

  }

  static async polymorphic({ localField, foreignKey }, documents, fields) {
    if (_.isArray(documents)) {
      const types = _.uniq(documents.map(document => document[`${foreignKey}Type`]))
      const recordsMap = {}
      for (let i = 0; i < types.length; i++) {
        const modelName = types[i]
        const filter = {}
        filter[`${foreignKey}Type`] = modelName
        const _id = _.filter(documents, filter).map(document => document[foreignKey])
        const records = await mongoose.model(modelName).find({ _id }).populateAssociation(...fields.fields)
        recordsMap[modelName] = _.keyBy(records, '_id')
      }
      documents.forEach(document => {
        document[localField] = recordsMap[document[`${foreignKey}Type`]][document[foreignKey]]
      })
    } else {
      documents[localField] = await mongoose.model(documents[`${foreignKey}Type`]).findOne({ _id: documents[foreignKey] })
    }
  }
}
