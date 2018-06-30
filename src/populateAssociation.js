const _ = require('lodash')
const mongoose = require('mongoose')
const Query = mongoose.Query
const _exec = Query.prototype.exec
const FieldTraverse = require('./fieldTraverse')

async function populateBelongsTo({ modelName, localField, foreignKey }, documents, fieldTraverse) {
  if (_.isArray(documents)) {
    const _id = documents.map(document => document[foreignKey])
    const records = await mongoose.model(modelName).find({ _id }).populateAssociation(...fieldTraverse.fields)
    const recordsMap = _.keyBy(records, '_id')
    documents.forEach(document => {
      document[foreignKey] = recordsMap[document[foreignKey]]
    })
  } else {
    documents[foreignKey] = await mongoose.model(modelName).findOne({ _id: documents[foreignKey] }).populateAssociation(...fieldTraverse.fields)
  }
}

async function populateAssociationField(model, field, documents, fieldTraverse) {
  const reflections = model.schema.reflections
  if (!reflections) throw 'populating an associationless schema'
  let reflection = _.get(reflections, `belongsTo.indexedByLocalField.${field}`)
  if (reflection) return populateBelongsTo(reflection, documents, fieldTraverse)
}

async function populateAssociation(model, documents, fieldTraverse) {
  if (fieldTraverse.length) {
    const rootFields = fieldTraverse.root
    for (let i = 0; i < rootFields.length; i++) {
      const field = rootFields[i]
      await populateAssociationField(model, field, documents, fieldTraverse.children(field))
    }
  }
  return documents
}

module.exports = async function(model, documents, ...fields) {
  return populateAssociation(model, documents, new FieldTraverse(...fields))
}
