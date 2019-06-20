import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import { Association, IOptions } from './associations/Association'
import { Associations } from './Associations'
import { Collection } from './Collection'

const { ObjectId } = mongoose.Schema.Types

export interface ISoftDeleteableOptions {
  field?: string
  deleter?: string
  deleterAs?: string
  deleterField?: string
}

export class SchemaMixin extends mongoose.Schema {

  associations: Associations
  deleteField: string
  deleter: string
  deleterField: string

  associate(as: string) {
    if (!this.associations) throw 'this schema does not have any associations'
    return this.associations.associate(as)
  }

  indexAssociations(...associations: any[]) {
    const lastAssociation = associations[associations.length - 1]
    let options
    if (!lastAssociation || lastAssociation instanceof Object) {
      options = associations.pop()
    }
    const indexes: any = {}
    associations.forEach(([association, order]) => {
      indexes[association.localField] = order
      if (association.associationType === 'polymorphic') indexes[association.typeField] = order
    })
    this.index(indexes, options)
    return this
  }

  belongsTo(foreignModelName: string, options: IOptions = {}, schemaOptions: any = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('belongsTo', _.merge({}, options, { foreignModelName }))

    this.defineBelongsToSchema(association, schemaOptions)
    this.defineBelongsToVirtual(association)
    return association
  }

  defineBelongsToSchema({ foreignModelName, localField }: IOptions, schemaOptions: any = {}) {
    function get() {
      const _id = this._doc[localField]
      if (!_id) return _id
      if (_id.constructor.name !== 'ObjectID') return _id._id
      return _id
    }
    _.merge(schemaOptions, {
      type: ObjectId,
      ref: foreignModelName,
      get
    })

    const schema: any = {}
    schema[localField] = schemaOptions
    this.add(schema)
  }

  defineBelongsToVirtual(association: Association) {
    const { as, _as, $as, localField, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, _as)) {
        const reference = this._doc[localField]
        // using native mongoose localField populate design for belongsTo
        if (!reference) return null
        if (reference.constructor instanceof association.foreignModel) {
          this[_as] = reference
        } else {
          this[_as] = await this[$fetch]()
        }
      }
      return this[_as]
    }).set(function set(value: any) {
      if (value instanceof association.foreignModel) this[_as] = value
      this[localField] = value
    })

    this.virtual($as).get(function get() {
      return this[_as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[_as]
      return this
    }
  }

  polymorphic(foreignModelNames: string[] = [], options: IOptions = {}, schemaOptions: any = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('polymorphic', _.merge({}, options, { foreignModelNames }))

    this.definePolymorphicSchema(association, schemaOptions)
    this.definePolymorphicVirtual(association)

    return association
  }

  definePolymorphicSchema({ foreignModelNames, localField, typeField }: IOptions, schemaOptions: any = {}) {
    _.merge(schemaOptions, { type: ObjectId })

    const schema: any = {}
    schema[localField] = schemaOptions
    schema[typeField] = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)
  }

  definePolymorphicVirtual(association: Association) {
    const { as, _as, $as, localField, typeField, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!this._doc[localField]) return null
      if (!Object.prototype.hasOwnProperty.call(this, _as)) this[_as] = await this[$fetch]()
      return this[_as]
    }).set(function set(value: any) {
      this[typeField] = value.constructor.modelName
      this[localField] = value._id
      this[_as] = value
    })

    this.virtual($as).get(function get() {
      return this[_as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[_as]
      return this
    }
  }

  hasOne(foreignModelName: string, options: IOptions = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasOne', _.merge({}, options, { foreignModelName }))

    this.defineHasOneVirtual(association)
    if (association.dependent) this.defineDependentHook(association)
    return association
  }

  defineHasOneVirtual(association: Association) {
    const { as, _as, $as, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, _as)) this[_as] = await this[$fetch]()
      return this[_as]
    })

    this.virtual($as).get(function get() {
      return this[_as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[_as]
      return this
    }
  }

  hasMany(foreignModelName: string, options: IOptions = {}, schemaOptions: any = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasMany', _.merge({}, options, { foreignModelName }))
    if (association.nested) this.defineHasManySchema(association, schemaOptions)
    this.defineHasManyVirtual(association)
    if (association.dependent) this.defineDependentHook(association)
    return association
  }

  defineHasManySchema({ foreignModelName, localField }: IOptions, schemaOptions: any = {}) {
    _.merge(schemaOptions, { type: [ObjectId], ref: foreignModelName })
    const schema: any = {}
    schema[localField] = schemaOptions
    this.add(schema)
  }

  defineHasManyVirtual(association: Association) {
    const { as, _as, $as, $fetch, $unset, nested } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, _as)) this[_as] = await this[$fetch]()
      return this[_as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this).collectAssociation({
        document: this,
        association
      })
    }

    this.virtual($as).get(function get() {
      if (this[_as]) return this[_as]
      return (this[_as] = Collection.collect([], {
        association,
        document: this,
      }))
    })

    this.methods[$unset] = function unset() {
      delete this[_as]
      return this
    }
  }

  defineDependentHook(association: Association) {
    this.post('remove', async function() {
      const session = this.$session()
      const { dependent, modelName } = association
      const { associationType, model, localField, typeField } = association.withAssociation
      const query:any = {}
      query[localField] = this.id
      if (associationType === 'polymorphic') {
        query[typeField] = modelName
      }
      if (dependent === 'delete') {
        await model.deleteMany(query, {
          session
        })
      } else {
        const field:any = {}
        field[localField] = null
        await model.updateMany(query, field, {
          session
        })
      }
    })
  }

  softDeleteable(options: ISoftDeleteableOptions = {}) {

    const field = options.field || 'deletedAt'
    this.deleteField = field
    const schemaOptions: any = {}

    schemaOptions[field] = { type: Date }

    const deleter = this.deleter = options.deleter
    const deleterAs = options.deleterAs || 'deletedBy'
    const _deleterAs = Association.cacheKey(deleterAs)
    const $deleterAs = Association.variablize(deleterAs)
    const $fetchDeleterAs = `fetch${Association.capitalize(deleterAs)}`
    const $unsetDeleterAs = `unset${Association.capitalize(deleterAs)}`
    const deleterField = this.deleterField = options.deleterField || Association.idlize(deleterAs)

    if (deleter) {

      function get() {
        const deleteById = this._doc[deleterField]
        if (!deleteById) return deleteById
        if (deleteById.constructor.name !== 'ObjectID') return deleteById._id
        return deleteById
      }

      schemaOptions[deleterField] = {
        type: ObjectId,
        ref: deleter,
        get
      }

      this.virtual(deleterAs).get(async function get() {
        if (!Object.prototype.hasOwnProperty.call(this, _deleterAs)) {
          const reference = this._doc[deleterField]
          if (!reference) return null
          if (reference.constructor instanceof this.model(deleter)) {
            this[_deleterAs] = reference
          } else {
            this[_deleterAs] = await this[$fetchDeleterAs]()
          }
        }
        return this[_deleterAs]
      }).set(function set(value: any) {
        if (value instanceof this.model(deleter)) this[_deleterAs] = value
        this[deleterField] = value
      })

      this.virtual($deleterAs).get(function get() {
        return this[_deleterAs]
      })

      this.methods[$fetchDeleterAs] = function fetch() {
        return Association.findOne({
          modelName: deleter,
          localField: '_id',
          localFieldValue: this[deleterField],
        })
      }

      this.methods[$unsetDeleterAs] = function unset() {
        delete this[_deleterAs]
        return this
      }
    }

    this.add(schemaOptions)

    this.methods.delete = async function(object: mongoose.Document) {
      this[field] = Date.now()
      if (deleter) this[deleterField] = object
      return await this.save()
    }

    this.methods.restore = async function() {
      this[field] = null
      if (deleter) {
        this[$unsetDeleterAs]()
        this[deleterField] = null
      }
      return await this.save()
    }
  }

  static apply(originalClass: any) {
    const mixinStaticMethods = (<any>Object).getOwnPropertyDescriptors(this.prototype)
    Object.keys(mixinStaticMethods).forEach(methodName => {
      if (methodName !== 'constructor') {
        const method = mixinStaticMethods[methodName]
        Object.defineProperty(originalClass.prototype, methodName, method)
      }
    })
  }
}
