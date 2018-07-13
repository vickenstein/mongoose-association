const _ = require('lodash')
const belongsTo = require('./associations/BelongsTo')
const polymorphic = require('./associations/Polymorphic')
const hasOne = require('./associations/HasOne')
const hasMany = require('./associations/HasMany')

const ASSOCIATIONS = {
  belongsTo,
  polymorphic,
  hasOne,
  hasMany
}

module.exports = class Associations {
  static get types() {
    return Object.keys(ASSOCIATIONS)
  }

  static classOf(type) {
    return ASSOCIATIONS[type]
  }

  constructor(schema) {
    this.schema = schema
    this.asIndexed = {}
  }

  associate(as) {
    return this.asIndexed[as]
  }

  get model() {
    return this.schema.model
  }

  get modelName() {
    return this.model.modelName
  }

  get collectionName() {
    return this.model.collection.name
  }

  add(type, options) {
    if (!_.includes(Associations.types, type)) throw `${type} is not a valid association type`
    const Association = Associations.classOf(type)
    const association = new Association(options, this.schema)
    return this.index(association)
  }

  index(association) {
    return (this.asIndexed[association.as] = association)
  }

  forEach(func) {
    Object.keys(this.asIndexed).forEach(as => func(this.associate(as)))
  }
}
