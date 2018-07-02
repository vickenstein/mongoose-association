const inflection = require('inflection')
const decapitalize = string => `${string.charAt(0).toLowerCase()}${string.substr(1)}`
const idlize = string => `${string}Id`
const QueryBuilder = require('./QueryBuilder')
const _ = require('lodash')

class AssociationsBase {
  constructor() {
    this.associations = []
    this.indexedByLocalField = {}
    this.indexedByForeignKey = {}
  }

  index(association) {
    this.associations.push(association)
    this.indexedByLocalField[association.localField] = association
    this.indexedByForeignKey[association.foreignField] = association
  }
}

class BelongsToAssociations extends AssociationsBase {
  add({ modelName, localField, foreignField }) {
    if (!modelName) throw 'modelName required for belongsTo Association'
    const association = new BelongsToAssociation(modelName, localField, foreignField)
    this.index(association)
    return association
  }
}

class BelongsToAssociation {
  constructor(modelName, localField, foreignField) {
    this.modelName = modelName
    this.localField = localField || decapitalize(modelName)
    this.foreignField = foreignField || idlize(this.localField)
  }

  findFor(document) {

    if (document instanceof Array) return this.findManyFor(document)

    const { modelName, foreignField } = this
    const foreignFieldValue = document[foreignField]
    return QueryBuilder.findOne(modelName, '_id', foreignFieldValue)
  }

  findManyFor(documents) {
    const { modelName, foreignField } = this
    const foreignFieldValues = documents.map(document => document[foreignField])
    return QueryBuilder.find(modelName, '_id', foreignFieldValues)
  }
}

class HasOneAssociations extends AssociationsBase {
  add({ foreignModelName, localField, foreignField, as, through }) {
    if (!foreignModelName) throw 'foreignModelName required for hasOne Association'
    const association = new HasOneAssociation(foreignModelName, localField, foreignField, as, through)
    this.index(association)
    return association
  }
}

class HasOneAssociation {
  constructor(foreignModelName, localField, foreignField, as, through) {
    this.foreignModelName = foreignModelName
    if (foreignModelName instanceof Array) {
      if (!localField) throw 'polymorphic hasOne require localField'
    }
    this.as = as
    this.through = through
    this.localField = localField || decapitalize(foreignModelName)
    this.foreignField = foreignField ? foreignField : modelName => idlize(as || decapitalize(modelName))
  }
}

class HasManyAssociations extends AssociationsBase {
  add({ foreignModelName, localField, foreignField }) {
    if (!foreignModelName) throw 'foreignModelName required for hasMany Association'
    const association = new HasManyAssociation(foreignModelName, localField, foreignField)
    this.index(association)
    return association
  }

  findFor(document) {
    if (document instanceof Array) return this.findManyFor(document)


  }

  findManyFor(documents) {

  }
}

class HasManyAssociation {
  constructor(foreignModelName, localField, foreignField) {
    this.foreignModelName = foreignModelName
    if (foreignModelName instanceof Array) {
      this.localField = 'todo'
      this.foreignField = 'todo'
    } else {
      this.localField = localField || inflection.pluralize(decapitalize(foreignModelName))
      this.foreignField = foreignField ? foreignField : modelName => idlize(decapitalize(modelName))
    }
  }
}

class PolymorphicAssociations extends AssociationsBase {
  add({ foreignModelNames, localField, foreignField }) {
    if (!foreignModelNames && !foreignModelNames.length) throw 'foreignModelNames is required for polymorphic association'
    if (!localField) throw 'localField is required for polymorphic association'
    const association = new PolymorphicAssociation(foreignModelNames, localField, foreignField)
    this.index(association)
    return association
  }
}

class PolymorphicAssociation {
  constructor(foreignModelNames, localField, foreignField) {
    this.foreignModelNames = foreignModelNames
    this.localField = localField
    this.foreignField = foreignField || idlize(localField)
  }

  findFor(document) {

    if (document instanceof Array) return this.findManyFor(document)

    const { foreignField } = this
    const polymorphicValue = document[foreignField]
    const modelName = document[`${foreignField}Type`]
    return QueryBuilder.findOne(modelName, '_id', polymorphicValue)
  }

  findManyFor(documents) {
    const { foreignField } = this
    const modelNames = _.uniq(documents.map(document => document[`${foreignField}Type`]))
    const returns = {}
    modelNames.forEach(modelName => {
      const filter = {}
      filter[`${foreignField}Type`] = modelName
      const polymorphicValues = _.filter(documents, filter).map(document => document[foreignField])
      returns[modelName] = QueryBuilder.find(modelName, '_id', polymorphicValues)
    })
    return returns
  }
}

module.exports = class Associations {
  constructor() {
    this.belongsTo = new BelongsToAssociations
    this.hasOne = new HasOneAssociations
    this.hasMany = new HasManyAssociations
    this.polymorphic = new PolymorphicAssociations
  }

  add(type, options) {
    if (!this[type]) throw `${type} is not a valid association type`
    const association = this[type].add(options)
    return association
  }
}
