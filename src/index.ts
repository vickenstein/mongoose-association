import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import * as inflection from 'inflection'
import * as util from 'util'
import { Association, IOptions } from './associations/Association'
import { SchemaMixin } from './SchemaMixin'
import { Populator } from './Populator'
import { AggregationMatcher } from './AggregationMatcher'
import { Hydrator } from './Hydrator'
import { Fields } from './Fields'
import { Collection } from './Collection'
import { Serializer } from './Serializer'

const POPULATABLE_QUERY = ['find', 'findOne']

declare module 'mongoose' {

  export interface Schema {
    deleteField: string
    model: mongoose.Model<any>
    belongsTo(foreignModelName: string, options?: IOptions, schemaOptions?: any): Association
    polymorphic(foreignModelNames: string[], options?: IOptions, schemaOptions?: any): Association
    hasOne(foreignModelName: string, options?: IOptions): Association
    hasMany(foreignModelName: string, options?: IOptions): Association
    indexAssociations(...associations: any[]): SchemaMixin
  }

  export interface Model<T> {
    associate(as: string): Association
  }

  export interface DocumentQuery<T, DocType extends Document> {
    populateAssociation(options: any): DocumentQuery<any, any>
    collectAssociation(options: any): DocumentQuery<any, any>
    reorder(ids: any): DocumentQuery<any, any>
    noop(): DocumentQuery<any, any>
    model: mongoose.Model<any>
    _model: mongoose.Model<any>
    _conditions: any
    op: string
    _explain(): any
    explain(): void
  }

  export interface Aggregate<T> {
    hydrateAssociation(options: any): Aggregate<T>
    populateAssociation(options: any): Aggregate<T>
    collectAssociation(options: any): Aggregate<T>
    where(options: any): Aggregate<T>
    singular(): Aggregate<T>
    _model: mongoose.Model<any>
    _pipeline: any[]
    _explain(): any
    explain(): void
  }
}

const plugin = (Schema: mongoose.Schema) => {
  Schema.statics.associate = function associate(as: string) {
    return this.schema.associate(as)
  }

  Schema.methods.populateAssociation = function populateAssociation(...fields: string[]) {
    return Populator.populate(this.constructor, this, fields)
  }

  Schema.statics.populateAssociation = function populateAssociation(documents: any, ...fields: string[]) {
    return Populator.populate(this, documents, fields)
  }

  Schema.methods.fetch = function fetch(association: Association) {
    const methodName = association instanceof Object ? association.$fetch : `fetch${Association.capitalize(association)}`
    return this[methodName]()
  }

  Schema.methods.unset = function unset(association: Association) {
    if (association) {
      const methodName = association instanceof Object ? association.$unset : `unset${Association.capitalize(association)}`
      this[methodName]()
    } else {
      this.constructor.schema.associations.forEach((nestedAssociation: Association) => {
        this.unset(nestedAssociation)
      })
    }
    return this
  }

  Schema.statics._explain = function _explain() {
    const associations: any = {
      _id: `${this.modelName}._id`,
      modelName: this.modelName
    }
    this.schema.associations.forEach((association: Association) => {
      if (!association.isReference) {
        associations[association.localField] = `${this.modelName}.${association.localField}`
      }
    })
    return associations
  }

  Schema.statics.explain = function explain() {
    console.log(util.inspect(this._explain(), { depth: 20 }))
  }
}

const patchQueryPrototype = (Query: any) => {
  const _exec = Query.prototype.exec

  if (Query.prototype.populateAssociation) return

  Query.prototype.populateAssociation = function populateAssociation(...fields: string[]) {
    this._populateAssociation = fields
    return this
  }

  Query.prototype.collectAssociation = function collectAssociation(options: any) {
    this._collectAssociation = options
    return this
  }

  Query.prototype.withDeleted = function withDeleted() {
    this._withDeleted = true
    return this
  }

  Query.prototype.checkDeleted = function checkDelete() {
    if (this.schema.deleteField) {
      const condition: any = {}
      condition[this.schema.deleteField] = null
      this.where(condition)
    }
  }

  Query.prototype.reorder = function reorder(ids: Array<any>) {
    this._reorder = ids
    return this
  }

  Query.prototype.exec = function exec(options: any, callback?: (err: any, res: any) => void) {
    const populateAssociation = this._populateAssociation
      && Populator.checkFields(this._populateAssociation)
    const collectAssociation = this._collectAssociation
    const withDeleted = this._withDeleted
    const reorder = this._reorder

    if (!withDeleted) this.checkDeleted()

    if (!populateAssociation && !collectAssociation) return _exec.call(this, options, callback)

    // _.includes(POPULATABLE_QUERY, this.op)not sure if all query type will work ok

    return new Promise((resolve, reject) => {
      if (populateAssociation && populateAssociation.root.length) {
        const aggregate = Populator.aggregateFromQuery(this, populateAssociation)
        aggregate.then((documents: any) => resolve(documents))
          .catch((error: any) => reject(error))
      } else {
        _exec.call(this, options, (error: any, documents: any) => {
          if (error) return reject(error)
          if (reorder) {
            const documentMap = _.keyBy(documents, 'id')
            documents = reorder.map((id: any) => documentMap[id])
          }
          if (collectAssociation) documents = Collection.collect(documents, collectAssociation)
          if (!documents) return resolve(documents)
          return Populator.populate(this.model, documents, populateAssociation)
            .then(() => resolve(documents))
            .catch(populateError => reject(populateError))
        })
      }
    })
  }

  Query.prototype.noop = function noop() {
    this.exec = function exec(options: any, callback?: (err: any, res: any) => void): any {
      return Promise.resolve([])
    }
    return this
  }

  Query.prototype._explain = function _explain() {

    const withDeleted = this._withDeleted
    if (!withDeleted) this.checkDeleted()

    if (!this._populateAssociation) return [['query', this.model.modelName, this._conditions]]

    const fields = Populator.checkFields(this._populateAssociation)

    if (fields.root.length && _.includes(POPULATABLE_QUERY, this.op)) {
      return Populator.aggregateFromQuery(this, fields)._explain()
    }

    return [['query', this.model.modelName, this._conditions]].concat(Populator.explainPopulate(this.model, this.model._explain(), fields))
  }

  Query.prototype.explain = function explain() {
    console.log(util.inspect(this._explain(), { depth: 20 }))
  }
}

const patchAggregatePrototype = (Aggregate: any) => {
  const _exec = Aggregate.prototype.exec

  if (Aggregate.prototype.hydrateAssociation) return

  Aggregate.prototype.populateAssociation = function populateAssociation(...options: any[]) {
    if (options.length > 1 || !(options[0] instanceof Object)) {
      this._populateAssociation = _.merge(
        this._populateAssociation || {},
        { _fields: new Fields(...options) }
      )
    } else if (options[0] instanceof Fields) {
      this._populateAssociation = _.merge(
        this._populateAssociation || {},
        { _fields: options[0] }
      )
    } else {
      this._populateAssociation = _.merge(
        this._populateAssociation || {},
        options[0]
      )
    }
    return this
  }

  Aggregate.prototype.hydrateAssociation = function hydrateAssociation(options: any) {
    if (options.reset) {
      delete options.reset
      this._hydrateAssociation = options
    } else {
      this._hydrateAssociation = _.merge(this._hydrateAssociation || {}, options)
    }
    return this
  }

  Aggregate.prototype.invertAssociation = function invertAssociation(from: string, to: string) {
    if (from && to) {
      this._invertAssociation = {
        from,
        to
      }
    }
    return this
  }

  Aggregate.prototype.singular = function singular() {
    this._singular = true
    return this
  }

  Aggregate.prototype.collectAssociation = function collectAssociation(options: any) {
    this._collectAssociation = options
    return this
  }

  Aggregate.prototype.withDeleted = function withDeleted() {
    this._withDeleted = true
    return this
  }

  Aggregate.prototype.checkDeleted = function checkDelete() {

    const model = this._model
    const schema = model.schema
    if (schema.deleteField) {
      const localMatch = AggregationMatcher.match(this._pipeline)
      const match: any = {}
      match[schema.deleteField] = null
      if (localMatch) {
        _.merge(localMatch.$match, match)
      } else {
        this._pipeline.unshift({
          $match: match
        })
      }
    }
    const lookups = AggregationMatcher.lookups(this._pipeline)

    lookups.forEach((lookup: any) => {
      const foreignModel = _.find(mongoose.models, (model: mongoose.Model<any>) => {
        return model.collection.collectionName === lookup.$lookup.from
      })
      if (foreignModel) {
        if (foreignModel.schema.deleteField) {
          const localMatch = AggregationMatcher.match(lookup.$lookup.pipeline)
          const match: any = {}
          match[foreignModel.schema.deleteField] = null
          _.merge(localMatch.$match, match)
        }
      }
    })
  }

  Aggregate.prototype.exec = function exec(callback?: (err: any, res: any) => void) {
    const populateAssociation = this._populateAssociation
    const hydrateAssociation = this._hydrateAssociation
    const invertAssociation = this._invertAssociation
    const collectAssociation = this._collectAssociation
    const singular = this._singular
    const withDeleted = this._withDeleted

    if (!populateAssociation
        && !hydrateAssociation
        && !invertAssociation
        && !singular
        && withDeleted) return _exec.call(this, callback)

    if (populateAssociation && populateAssociation._fields) {
      Populator.prePopulateAggregate(this, populateAssociation._fields)
    }

    if (!withDeleted) this.checkDeleted()

    return new Promise((resolve, reject) => {
      _exec.call(this, (error: any, documents: any) => {

        if (error) return reject(error)
        if (!documents) return resolve(documents)
        if (invertAssociation) {
          documents = documents.map((document: any) => {
            const nestedDcoument = document[invertAssociation.to]
            delete document[invertAssociation.to]
            nestedDcoument[invertAssociation.from] = document
            return nestedDcoument
          })
        }
        if (hydrateAssociation) documents = Hydrator.hydrate(documents, hydrateAssociation)
        if (collectAssociation) documents = Collection.collect(documents, collectAssociation)
        if (populateAssociation) {
          return Populator.populateAggregate(this._model, documents, populateAssociation)
            .then(() => {
              if (singular) [documents] = documents
              return resolve(documents)
            })
        }
        if (singular) [documents] = documents
        return resolve(documents)
      })
    })
  }

  Aggregate.prototype._explain = function _explain() {
    const populateAssociation = this._populateAssociation
    const withDeleted = this._withDeleted

    let explain = [['aggregate', this._model.modelName, this._pipeline]]

    if (!populateAssociation && withDeleted) return explain
    if (populateAssociation && populateAssociation._fields) {
      Populator.prePopulateAggregate(this, populateAssociation._fields)
    }

    if (!withDeleted) this.checkDeleted()

    explain = [['aggregate', this._model.modelName, this._pipeline]]
    return explain.concat(Populator.explainPopulateAggregate(
      this._model,
      [this._model._explain()],
      populateAssociation
    ))
  }

  Aggregate.prototype.explain = function explain() {
    console.log(util.inspect(this._explain(), { depth: 20 }))
  }

  Aggregate.prototype.where = function where(match: any) {
    new AggregationMatcher(this, match)
    return this
  }
}

const patchModel = (mongoose: any) => {
  const modelMethod = mongoose.model
  mongoose.model = function model(name: string, schema: mongoose.Schema, collection?: string, skipInit?: boolean) {
    const currentModel = modelMethod.apply(this, [name, schema, collection, skipInit])
    if (schema) schema.model = currentModel
    return currentModel
  }
}

export function mongooseAssociation(mongoose: any) {
  // apply cirular reference to schema to fetch it's model during runtime
  patchModel(mongoose)

  // apply helper methods to mongoose schema for generating associations
  SchemaMixin.apply(mongoose.Schema)

  // patch mongoose Query to perform association population during queries
  patchQueryPrototype(mongoose.Query)

  // patch mongoose Aggregation to perform association hydration during aggregations
  patchAggregatePrototype(mongoose.Aggregate)

  // using mongoose plugin to apply mongoose model
  // static methods and instance methods for populating
  mongoose.plugin(plugin)
}

export {
  Serializer
}
