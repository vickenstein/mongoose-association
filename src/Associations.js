const _ = require('lodash')

const ASSOCIATIONS = {
  belongsTo: require('./associations/BelongsTo'),
  polymorphic: require('./associations/Polymorphic'),
  hasOne: require('./associations/HasOne'),
  hasMany: require('./associations/HasMany')
}

const ASSOCIATION_CLASSES = ['belongsTo', 'polymorphic', 'hasMany', 'hasOne']

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
    return this.asIndexed[association.as] = association
  }
}
