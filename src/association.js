const _ = require('lodash')
const inflection = require('inflection')
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

module.exports = class Association {
  belongsTo(modelName, { localField, foreignKey } = {}, schemaOptions = {}) {
    if (!modelName) throw 'model name required for assigning association'
    if (!localField) localField = `${modelName.charAt(0).toLowerCase()}${modelName.substr(1)}`
    if (!foreignKey) foreignKey = `${localField}Id`

    if (!this.reflections) this.reflections = { belongsTo: {} }
    if (!this.reflections.belongsTo) this.reflections.belongsTo = {}
    this.reflections.belongsTo[foreignKey] = {
      modelName,
      localField
    }

    _.merge(schemaOptions, {
      type: ObjectId,
      ref: modelName,
      get: function() {
        const reference = this._doc[foreignKey]
        if (reference instanceof Object) return reference._id
        return reference
      }
    })

    const schema = {}
    schema[foreignKey] = schemaOptions
    this.add(schema)

    this.virtual(localField).get(async function() {
      const reference = this._doc[foreignKey]
      if (reference instanceof Object) return reference
      await this.populate(foreignKey)
      return reference
    }).set(function(value) {
      this[foreignKey] = value
    })
  }

  // todo: through association
  hasOne(foreignModelName, { localField, foreignKey} = {}) {
    if (!foreignModelName) throw 'foreign model name required for assigning association'
    if (!localField) localField = `${foreignModelName.charAt(0).toLowerCase()}${foreignModelName.substr(1)}`
    if (!foreignKey) foreignKey = modelName => `${modelName.charAt(0).toLowerCase()}${modelName.substr(1)}Id`

    if (!this.reflections) this.reflections = { hasOne: {} }
    if (!this.reflections.hasOne) this.reflections.hasOne = {}
    this.reflections.hasOne[localField] = {
      foreignModelName,
      foreignKey
    }

    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        const foreignModel = this.model(foreignModelName)
        const key = _.isFunction(foreignKey) ? foreignKey(modelName) : foreignKey
        const isPolymorphic = _.get(foreignModel, `schema.reflections.polymorphic.${key}`)
        const query = {}
        query[key] = this._id
        if (isPolymorphic) query._type = modelName
        this[`_${localField}`] = await foreignModel.findOne(query)
      }
      return this[`_${localField}`]
    })
  }

  // todo: through association
  hasMany(foreignModelName, { localField, foreignKey } = {}) {
    if (!foreignModelName) throw 'foreign model name required for assigning association'
    if (!localField) localField = inflection.pluralize(`${foreignModelName.charAt(0).toLowerCase()}${foreignModelName.substr(1)}`)
    if (!foreignKey) foreignKey = modelName => `${modelName.charAt(0).toLowerCase()}${modelName.substr(1)}Id`

    if (!this.reflections) this.reflections = { hasMany: {} }
    if (!this.reflections.hasMany) this.reflections.hasMany = {}
    this.reflections.hasMany[localField] = {
      foreignModelName,
      foreignKey
    }

    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        const foreignModel = this.model(foreignModelName)
        const key = _.isFunction(foreignKey) ? foreignKey(modelName) : foreignKey
        const isPolymorphic = _.get(foreignModel, `schema.reflections.polymorphic.${key}`)
        const query = {}
        query[key] = this._id
        if (isPolymorphic) query._type = modelName
        this[`_${localField}`] = await foreignModel.find(query)
      }
      return this[`_${localField}`]
    })
  }

  polymorphic(foreignModelNames = [], { localField, foreignKey } = {}, schemaOptions = {}) {
    if (!foreignModelNames.length) throw 'foreign model names required for assigning association'
    if (!localField) throw 'localField is required for polymorphic association'
    if (!foreignKey) foreignKey = `${localField}Id`

    if (!this.reflections) this.reflections = { polymorphic: {} }
    if (!this.reflections.polymorphic) this.reflections.polymorphic = {}
    this.reflections.polymorphic[foreignKey] = {
      foreignModelNames,
      localField
    }

    _.merge(schemaOptions, {
      type: ObjectId
    })

    const schema = {}
    schema[foreignKey] = schemaOptions
    schema._type = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)

    this.virtual(localField).get(async function() {
      if (this[`_${localField}`]) {
        const _id = this[foreignKey]
        const _type = this._type
        if (!_id) return null
        this[`_${localField}`] = await this.model(_type).findOne({
          _id
        })
      }
      return this[`_${localField}`]
    }).set(function(value) {
      this._type = value.constructor.modelName
      this[foreignKey] = value._id
      this[`_${localField}`] = value
    })
  }

  static assign(originalClass) {
    const mixinStaticMethods = Object.getOwnPropertyDescriptors(this.prototype)
    Object.keys(mixinStaticMethods).forEach(methodName => {
      if (methodName !== 'constructor') {
        const method = mixinStaticMethods[methodName]
        Object.defineProperty(originalClass.prototype, methodName, method)
      }
    })
  }
}
