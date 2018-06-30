const inflection = require('inflection')
const decapitalize = string => `${string.charAt(0).toLowerCase()}${string.substr(1)}`
const idlize = string => `${string}Id`

class ReflectionsBase {
  constructor() {
    this.reflections = []
    this.indexedByLocalField = {}
    this.indexedByForeignKey = {}
  }

  index(reflection) {
    this.reflections.push(reflection)
    this.indexedByLocalField[reflection.localField] = reflection
    this.indexedByForeignKey[reflection.foreignKey] = reflection
  }
}

class BelongsToReflections extends ReflectionsBase {
  add({ modelName, localField, foreignKey }) {
    if (!modelName) throw 'modelName required for belongsTo Association'
    const reflection = new BelongsToReflection(modelName, localField, foreignKey)
    this.index(reflection)
    return reflection
  }
}

class BelongsToReflection {
  constructor(modelName, localField, foreignKey) {
    this.modelName = modelName
    this.localField = localField || decapitalize(modelName)
    this.foreignKey = foreignKey || idlize(this.localField)
  }
}

class HasOneReflections extends ReflectionsBase {
  add({ foreignModelName, localField, foreignKey }) {
    if (!foreignModelName) throw 'foreignModelName required for hasOne Association'
    const reflection = new HasOneReflection(foreignModelName, localField, foreignKey)
    this.index(reflection)
    return reflection
  }
}

class HasOneReflection {
  constructor(foreignModelName, localField, foreignKey) {
    this.foreignModelName = foreignModelName
    this.localField = localField || decapitalize(foreignModelName)
    this.foreignKey = foreignKey ? foreignKey : modelName => idlize(decapitalize(modelName))
  }
}

class HasManyReflections extends ReflectionsBase {
  add({ foreignModelName, localField, foreignKey }) {
    if (!foreignModelName) throw 'foreignModelName required for hasMany Association'
    const reflection = new HasManyReflection(foreignModelName, localField, foreignKey)
    this.index(reflection)
    return reflection
  }
}

class HasManyReflection {
  constructor(foreignModelName, localField, foreignKey) {
    this.foreignModelName = foreignModelName
    this.localField = localField || inflection.pluralize(decapitalize(foreignModelName))
    this.foreignKey = foreignKey ? foreignKey : modelName => idlize(decapitalize(modelName))
  }
}

class PolymorphicReflections extends ReflectionsBase {
  add({ foreignModelNames, localField, foreignKey }) {
    if (!foreignModelNames && !foreignModelNames.length) throw 'foreignModelNames is required for polymorphic association'
    if (!localField) throw 'localField is required for polymorphic association'
    const reflection = new PolymorphicReflection(foreignModelNames, localField, foreignKey)
    this.index(reflection)
    return reflection
  }
}

class PolymorphicReflection {
  constructor(foreignModelNames, localField, foreignKey) {
    this.foreignModelNames = foreignModelNames
    this.localField = localField
    this.foreignKey = foreignKey || idlize(localField)
  }
}

module.exports = class Reflections {
  constructor() {
    this.belongsTo = new BelongsToReflections
    this.hasOne = new HasOneReflections
    this.hasMany = new HasManyReflections
    this.polymorphic = new PolymorphicReflections
  }

  add(type, options) {
    if (!this[type]) throw `${type} is not a valid association type`
    const reflection = this[type].add(options)
    return reflection
  }
}
