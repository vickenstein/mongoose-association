const inflection = require('inflection')
const decapitalize = string => `${string.charAt(0).toLowerCase()}${string.substr(1)}`
const idlize = string => `${string}Id`

class AssociationsBase {
  constructor() {
    this.associations = []
    this.indexedByLocalField = {}
    this.indexedByForeignKey = {}
  }

  index(association) {
    this.associations.push(association)
    this.indexedByLocalField[association.localField] = association
    this.indexedByForeignKey[association.foreignKey] = association
  }
}

class BelongsToAssociations extends AssociationsBase {
  add({ modelName, localField, foreignKey }) {
    if (!modelName) throw 'modelName required for belongsTo Association'
    const association = new BelongsToAssociation(modelName, localField, foreignKey)
    this.index(association)
    return association
  }
}

class BelongsToAssociation {
  constructor(modelName, localField, foreignKey) {
    this.modelName = modelName
    this.localField = localField || decapitalize(modelName)
    this.foreignKey = foreignKey || idlize(this.localField)
  }
}

class HasOneAssociations extends AssociationsBase {
  add({ foreignModelName, localField, foreignKey }) {
    if (!foreignModelName) throw 'foreignModelName required for hasOne Association'
    const association = new HasOneAssociation(foreignModelName, localField, foreignKey)
    this.index(association)
    return association
  }
}

class HasOneAssociation {
  constructor(foreignModelName, localField, foreignKey) {
    this.foreignModelName = foreignModelName
    if (foreignModelName instanceof Array) {
      this.localField = 'todo'
      this.foreignKey = 'todo'
    } else {
      this.localField = localField || decapitalize(foreignModelName)
      this.foreignKey = foreignKey ? foreignKey : modelName => idlize(decapitalize(modelName))
    }
  }
}

class HasManyAssociations extends AssociationsBase {
  add({ foreignModelName, localField, foreignKey }) {
    if (!foreignModelName) throw 'foreignModelName required for hasMany Association'
    const association = new HasManyAssociation(foreignModelName, localField, foreignKey)
    this.index(association)
    return association
  }
}

class HasManyAssociation {
  constructor(foreignModelName, localField, foreignKey) {
    this.foreignModelName = foreignModelName
    if (foreignModelName instanceof Array) {
      this.localField = 'todo'
      this.foreignKey = 'todo'
    } else {
      this.localField = localField || inflection.pluralize(decapitalize(foreignModelName))
      this.foreignKey = foreignKey ? foreignKey : modelName => idlize(decapitalize(modelName))
    }
  }
}

class PolymorphicAssociations extends AssociationsBase {
  add({ foreignModelNames, localField, foreignKey }) {
    if (!foreignModelNames && !foreignModelNames.length) throw 'foreignModelNames is required for polymorphic association'
    if (!localField) throw 'localField is required for polymorphic association'
    const association = new PolymorphicAssociation(foreignModelNames, localField, foreignKey)
    this.index(association)
    return association
  }
}

class PolymorphicAssociation {
  constructor(foreignModelNames, localField, foreignKey) {
    this.foreignModelNames = foreignModelNames
    this.localField = localField
    this.foreignKey = foreignKey || idlize(localField)
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
