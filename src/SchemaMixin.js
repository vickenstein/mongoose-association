const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const Associations = require('./associations')

module.exports = class SchemaMixin {
  associate(as) {
    if (!this.associations) throw 'this schema does not have any associations'
    return this.associations.associate(as)
  }

  belongsTo(foreignModelName, options = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('belongsTo', _.merge({}, options, { foreignModelName }))

    this.defineBelongsToSchema(association, schemaOptions)
    this.defineBelongsToVirtual(association)
  }

  defineBelongsToSchema({ foreignModelName, localField }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId,
      ref: foreignModelName,
      get: function() {
        const _id = this._doc[localField]
        if (_id.constructor.name !== 'ObjectID') return _id._id
        return _id
      }
    })

    const schema = {}
    schema[localField] = schemaOptions
    this.add(schema)
  }

  defineBelongsToVirtual(association) {
    const { as, $as, localField, $fetch, $unset } = association
    this.virtual(as).get(async function() {
      if (!this.hasOwnProperty($as)) {
        const reference = this._doc[localField] // using native mongoose localField populate design for belongsTo
        if (!reference) return null
        if (reference.constructor instanceof association.foreignModel) {
          this[$as] = reference
        } else {
          this[$as] = await this[$fetch]()
        }
      }
      return this[$as]
    }).set(function(value) {
      if (value instanceof association.foreignModel) this[$as] = value
      this[localField] = value
    })

    this.methods[$fetch] = function() {
      return association.findFor(this)
    }

    this.methods[$unset] = function() {
      delete this[$as]
      return this
    }
  }

  polymorphic(foreignModelNames = [], options = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('polymorphic', _.merge({}, options, { foreignModelNames }))

    this.definePolymorphicSchema(association, schemaOptions)
    this.definePolymorphicVirtual(association)
  }

  definePolymorphicSchema({ foreignModelNames, localField, typeField }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId
    })

    const schema = {}
    schema[localField] = schemaOptions
    schema[typeField] = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)
  }

  definePolymorphicVirtual(association) {
    const { as, $as, localField, typeField, $fetch, $unset } = association
    this.virtual(as).get(async function() {
      if (!this._doc[localField]) return null
      if (!this.hasOwnProperty($as)) this[$as] = await this[$fetch]()
      return this[$as]
    }).set(function(value) {
      this[typeField] = value.constructor.modelName
      this[localField] = value._id
      this[$as] = value
    })

    this.methods[$fetch] = function() {
      return association.findFor(this)
    }

    this.methods[$unset] = function() {
      delete this[$as]
      return this
    }
  }

  hasOne(foreignModelName, options = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasOne', _.merge({}, options, { foreignModelName }))

    this.defineHasOneVirtual(association)
  }

  defineHasOneVirtual(association) {
    const { foreignModelName, as, $as, $fetch, $unset } = association
    this.virtual(as).get(async function() {
      if (!this.hasOwnProperty($as)) this[$as] = await this[$fetch]()
      return this[$as]
    })

    this.methods[$fetch] = function() {
      return association.findFor(this)
    }

    this.methods[$unset] = function() {
      delete this[$as]
      return this
    }
  }

  hasMany(foreignModelName, options = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasMany', _.merge({}, options, { foreignModelName }))

    this.defineHasManyVirtual(association)
  }

  defineHasManyVirtual(association) {
    const { foreignModelNames, as, $as, $fetch, $unset } = association
    this.virtual(as).get(async function() {
      if (!this.hasOwnProperty($as)) this[$as] = await this[$fetch]()
      return this[$as]
    })

    this.methods[$fetch] = function() {
      return association.findFor(this)
    }

    this.methods[$unset] = function() {
      delete this[$as]
      return this
    }
  }

  static apply(originalClass) {
    const mixinStaticMethods = Object.getOwnPropertyDescriptors(this.prototype)
    Object.keys(mixinStaticMethods).forEach(methodName => {
      if (methodName !== 'constructor') {
        const method = mixinStaticMethods[methodName]
        Object.defineProperty(originalClass.prototype, methodName, method)
      }
    })
  }
}


