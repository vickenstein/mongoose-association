const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const Associations = require('./associations')

module.exports = class SchemaMixin {
  belongsTo(modelName, { localField, foreignField } = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations
    const association = this.associations.add('belongsTo', {
      modelName,
      localField,
      foreignField
    })

    this.defineBelongsToSchema(association, schemaOptions)
    this.defineBelongsToVirtual(association)
  }

  defineBelongsToSchema({ modelName, localField, foreignField }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId,
      ref: modelName,
      get: function() {
        const _id = this._doc[foreignField]
        if (_id.constructor.name !== 'ObjectID') return _id._id
        return _id
      }
    })

    const schema = {}
    schema[foreignField] = schemaOptions
    this.add(schema)
  }

  defineBelongsToVirtual({ modelName, localField, foreignField }) {
    this.virtual(localField).get(async function() {
      const _id = this._doc[foreignField]
      if (_id.constructor.name !== 'ObjectID') return _id
      this[foreignField] = await this.model(modelName).findOne({ _id })
      return this._doc[foreignField]
    }).set(function(value) {
      this[foreignField] = value
    })
  }

  // todo: through association
  hasOne(foreignModelName, { localField, foreignField, as, through } = {}) {
    if (!this.associations) this.associations = new Associations
    const association = this.associations.add('hasOne', {
      foreignModelName,
      localField,
      foreignField,
      as,
      through
    })
    this.defineHasOneVirtual(association)
  }

  defineHasOneVirtual({foreignModelName, localField, foreignField, as, through}) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        if (foreignModelName instanceof Array) {
          for (let i = 0; i < foreignModelName.length; i++) {
            const foreignModel = this.model(foreignModelName[i])
            const key = _.isFunction(foreignField) ? foreignField(modelName) : foreignField
            const isPolymorphic = _.get(foreignModel, `schema.associations.polymorphic.indexedByForeignKey.${key}`)
            const query = {}
            query[key] = this._id
            const record = await foreignModel.findOne(query)
            if (record) {
              this[`_${localField}`] = record
              break
            }
          }
        } else {
          const foreignModel = this.model(foreignModelName)
          if (through) {
            // console.log('through', foreignModelName, foreignModel)
            // const results = await foreignModel.find().aggregate([{
            //   $lookup: {
            //     "from": through,
            //     localField:
            //   }
            // }])
            // console.log(results)
          } else {
            const key = _.isFunction(foreignField) ? foreignField(modelName) : foreignField
            const isPolymorphic = _.get(foreignModel, `schema.associations.polymorphic.indexedByForeignKey.${key}`)
            const query = {}
            query[key] = this._id
            if (isPolymorphic) query[`${key}Type`] = modelName
            this[`_${localField}`] = await foreignModel.findOne(query)
          }
        }
      }
      return this[`_${localField}`]
    })
  }

  // todo: through association
  hasMany(foreignModelName, { localField, foreignField } = {}) {
    if (!this.associations) this.associations = new Associations
    const association = this.associations.add('hasMany', {
      foreignModelName,
      localField,
      foreignField
    })

    this.defineHasManyVirtual(association)
  }

  defineHasManyVirtual({ foreignModelName, localField, foreignField }) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const model = this.constructor
        const { modelName } = model
        const foreignModel = this.model(foreignModelName)
        const key = _.isFunction(foreignField) ? foreignField(modelName) : foreignField
        const isPolymorphic = _.get(foreignModel, `schema.associations.polymorphic.indexedByForeignKey.${key}`)
        const query = {}
        query[key] = this._id
        if (isPolymorphic) query[`${key}Type`] = modelName
        this[`_${localField}`] = await foreignModel.find(query)
      }
      return this[`_${localField}`]
    })
  }

  polymorphic(foreignModelNames = [], { localField, foreignField } = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations
    const association = this.associations.add('polymorphic', {
      foreignModelNames,
      localField,
      foreignField
    })

    this.definePolymorphicSchema(association, schemaOptions)
    this.definePolymorphicVirtual(association)
  }

  definePolymorphicSchema({ foreignModelNames, localField, foreignField }, schemaOptions) {
    _.merge(schemaOptions, {
      type: ObjectId
    })

    const schema = {}
    schema[foreignField] = schemaOptions
    schema[`${foreignField}Type`] = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)
  }

  definePolymorphicVirtual({ foreignModelNames, localField, foreignField }) {
    this.virtual(localField).get(async function() {
      if (!this[`_${localField}`]) {
        const _id = this[foreignField]
        const foreignModelName = this[`${foreignField}Type`]
        if (!_id) return null
        this[`_${localField}`] = await this.model(foreignModelName).findOne( { _id } )
      }
      return this[`_${localField}`]
    }).set(function(value) {
      this[`${foreignField}Type`] = value.constructor.modelName
      this[foreignField] = value._id
      this[`_${localField}`] = value
    })
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


