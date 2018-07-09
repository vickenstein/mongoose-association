const _ = require('lodash')
const SchemaMixin = require('./src/SchemaMixin')
const Populator = require('./src/Populator')
const Hydrator = require('./src/Hydrator')
const Fields = require('./src/Fields')

const POPULATABLE_QUERY = ['find', 'findOne']

const plugin = (Schema, options = {}) => {
  Schema.statics.associate = function(as) {
    return this.schema.associate(as)
  }

  Schema.methods.populateAssociation = function(...fields) {
    return Populator.populate(this.constructor, this, paths)
  }

  Schema.statics.populateAssociation = function(documents, ...fields) {
    return Populator.populate(this, documents, paths)
  }
}

const patchQueryPrototype = (Query) => {
  const _exec = Query.prototype.exec

  if (Query.prototype.populateAssociation) return

  Query.prototype.populateAssociation = function(...fields) {
    this._populateAssociation = fields
    return this
  }

  Query.prototype.exec = function(options, callback) {
    if (!this._populateAssociation) return _exec.call(this, options, callback)

    const fields = new Fields(...this._populateAssociation)

    return new Promise((resolve, reject) => {
      if (fields.root.length > 1 && _.includes(POPULATABLE_QUERY, this.op)) {
        const aggregate = Populator.aggregateFromQuery(this)
        aggregate.then(documents => resolve(documents)).catch(error => {
          return reject(error), callback(error)
        })
      }

      _exec.call(this, options, (error, documents) => {
        if (error) return reject(error), callback(error)
        if (!documents) return resolve(documents), callback(null, documents)
        resolve(Populator.populate(this.model, documents, fields))
      })
    })
  }
}

const patchAggregatePrototype =(Aggregate) => {
  const _exec = Aggregate.prototype.exec

  if (Aggregate.prototype.hydrateAssociation) return

  Aggregate.prototype.populateAssociation = function(...fields) {
    this._populateAssociation = fields
    return this
  }

  Aggregate.prototype.hydrateAssociation = function(options) {
    this._hydrateAssociation = options
    return this
  }

  Aggregate.prototype.mapAssociation = function(field) {
    this._mapAssociation = field
    return this
  }

  Aggregate.prototype.singular = function() {
    this._singular = true
    return this
  }

  Aggregate.prototype.exec = function(callback) {
    const populateAssociation = this._populateAssociation
    const hydrateAssociation = this._hydrateAssociation
    const mapAssociation = this._mapAssociation
    const singular = this._singular

    if (!hydrateAssociation && !mapAssociation && !singular) return _exec.call(this, callback)

    return new Promise((resolve, reject) => {
      _exec.call(this, (error, documents) => {
        if (error) return reject(error), callback(error)
        if (!documents) return resolve(documents), callback(null, documents)
        if (mapAssociation) {
          documents = documents.map(document => document[mapAssociation])
        }
        if (hydrateAssociation) documents = Hydrator.hydrate(documents, hydrateAssociation)
        if (populateAssociation) documents = Populator.populate(this.foreignModel || this.model, documents, ...fields)
        if (singular) documents = documents[0]
        resolve(documents)
      })
    })
  }
}

const patchModel = (mongoose) => {
  const modelMethod = mongoose.model
  mongoose.model = function(name, schema, collection, skipInit) {
    const model = modelMethod.apply(this, Array.from(arguments))
    if (schema) schema.model = model
    return model
  }
}

module.exports = function(mongoose) {
  //apply cirular reference to schema to fetch it's model during runtime
  patchModel(mongoose)

  //apply helper methods to mongoose schema for generating associations
  SchemaMixin.apply(mongoose.Schema)

  //patch mongoose Query to perform association population during queries
  patchQueryPrototype(mongoose.Query)

  //patch mongoose Aggregation to perform association hydration during aggregations
  patchAggregatePrototype(mongoose.Aggregate)

  //using mongoose plugin to apply mongoose model static methods and instance methods for populating
  mongoose.plugin(plugin)
}
