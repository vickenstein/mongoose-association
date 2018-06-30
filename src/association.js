const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const Reflections = require('./reflections')

module.exports = class Association {
  belongsTo(modelName, { localField, foreignKey } = {}, schemaOptions = {}) {
    if (!this.reflections) this.reflections = new Reflections
    const reflection = this.reflections.add('belongsTo', {
      modelName,
      localField,
      foreignKey
    })

    this.defineBelongsToSchema(reflection, schemaOptions)
    this.defineBelongsToVirtual(reflection)
  }

  defineBelongsToSchema({ modelName, localField, foreignKey }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId,
      ref: modelName,
      get: function() {
        const _id = this._doc[foreignKey]
        if (_id.constructor.name !== 'ObjectID') return _id._id
        return _id
      }
    })

    const schema = {}
    schema[foreignKey] = schemaOptions
    this.add(schema)
  }

  defineBelongsToVirtual({ modelName, localField, foreignKey }) {
    this.virtual(localField).get(async function() {
      const _id = this._doc[foreignKey]
      if (_id.constructor.name !== 'ObjectID') return _id
      this[foreignKey] = await this.model(modelName).findOne({ _id })
      return this._doc[foreignKey]
    }).set(function(value) {
      this[foreignKey] = value
    })
  }

  // todo: through association
  hasOne(foreignModelName, { localField, foreignKey} = {}) {
    if (!this.reflections) this.reflections = new Reflections
    const reflection = this.reflections.add('hasOne', {
      foreignModelName,
      localField,
      foreignKey
    })

    this.defineHasOneVirtual(reflection)
  }

  defineHasOneVirtual({foreignModelName, localField, foreignKey}) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        const foreignModel = this.model(foreignModelName)
        const key = _.isFunction(foreignKey) ? foreignKey(modelName) : foreignKey
        const isPolymorphic = _.get(foreignModel, `schema.reflections.polymorphic.indexedByForeignKey.${key}`)
        const query = {}
        query[key] = this._id
        if (isPolymorphic) query[`${key}Type`] = modelName
        this[`_${localField}`] = await foreignModel.findOne(query)
      }
      return this[`_${localField}`]
    })
  }

  // todo: through association
  hasMany(foreignModelName, { localField, foreignKey } = {}) {
    if (!this.reflections) this.reflections = new Reflections
    const reflection = this.reflections.add('hasMany', {
      foreignModelName,
      localField,
      foreignKey
    })

    this.defineHasManyVirtual(reflection)
  }

  defineHasManyVirtual({ foreignModelName, localField, foreignKey }) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        const foreignModel = this.model(foreignModelName)
        const key = _.isFunction(foreignKey) ? foreignKey(modelName) : foreignKey
        const isPolymorphic = _.get(foreignModel, `schema.reflections.polymorphic.indexedByForeignKey.${key}`)
        const query = {}
        query[key] = this._id
        if (isPolymorphic) query[`${key}Type`] = modelName
        this[`_${localField}`] = await foreignModel.find(query)
      }
      return this[`_${localField}`]
    })
  }

  polymorphic(foreignModelNames = [], { localField, foreignKey } = {}, schemaOptions = {}) {
    if (!this.reflections) this.reflections = new Reflections
    const reflection = this.reflections.add('polymorphic', {
      foreignModelNames,
      localField,
      foreignKey
    })

    this.definePolymorphicSchema(reflection, schemaOptions)
    this.definePolymorphicVirtual(reflection)
  }

  definePolymorphicSchema({ foreignModelNames, localField, foreignKey }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId
    })

    const schema = {}
    schema[foreignKey] = schemaOptions
    schema[`${foreignKey}Type`] = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)
  }

  definePolymorphicVirtual({ foreignModelNames, localField, foreignKey }) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const _id = this[foreignKey]
        const foreignModelName = this[`${foreignKey}Type`]
        if (!_id) return null
        this[`_${localField}`] = await this.model(foreignModelName).findOne( { _id } )
      }
      return this[`_${localField}`]
    }).set(function(value) {
      this[`${foreignKey}Type`] = value.constructor.modelName
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


