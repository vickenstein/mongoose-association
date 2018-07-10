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
    return Populator.populate(this.constructor, this, fields)
  }

  Schema.statics.populateAssociation = function(documents, ...fields) {
    return Populator.populate(this, documents, fields)
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

    const fields = (this._populateAssociation[0] && this._populateAssociation[0] instanceof Fields) ?
      this._populateAssociation[0] :
      new Fields(...this._populateAssociation)

    return new Promise((resolve, reject) => {
      if (fields.root.length > 1 && _.includes(POPULATABLE_QUERY, this.op)) {
        const aggregate = Populator.aggregateFromQuery(this, fields)
        aggregate.then(documents => resolve(documents)).catch(error => {
          return reject(error), callback(error)
        })
      } else {
        _exec.call(this, options, (error, documents) => {
          if (error) return reject(error), callback(error)
          if (!documents) return resolve(documents), callback(null, documents)
          Populator.populate(this.model, documents, fields).then(result => resolve(documents)).catch(error => {
            return reject(error), callback(error)
          })
        })
      }
    })
  }
}

const patchAggregatePrototype = (Aggregate) => {
  const _exec = Aggregate.prototype.exec

  if (Aggregate.prototype.hydrateAssociation) return

  Aggregate.prototype.populateAssociation = function(options) {
    if (options instanceof Fields) {
      this._populateAssociation = options
    } else {
      this._populateAssociation = _.merge(this._populateAssociation || {}, options)
    }
    return this
  }

  Aggregate.prototype.hydrateAssociation = function(options) {
    if (options.reset) {
      delete options.reset
      this._hydrateAssociation = options
    } else {
      this._hydrateAssociation = _.merge(this._hydrateAssociation || {}, options)
    }
    return this
  }

  Aggregate.prototype.invertAssociation = function(from, to) {
    if (from, to) {
      this._invertAssociation = {
        from,
        to
      }
    }
    return this
  }

  Aggregate.prototype.singular = function() {
    this._singular = true
    return this
  }

  Aggregate.prototype.exec = function(callback) {
    const populateAssociation = this._populateAssociation
    const hydrateAssociation = this._hydrateAssociation
    const invertAssociation = this._invertAssociation
    const singular = this._singular

    if (!populateAssociation && !hydrateAssociation && !invertAssociation && !singular) return _exec.call(this, callback)

    return new Promise((resolve, reject) => {
      _exec.call(this, (error, documents) => {
        if (error) return reject(error), callback(error)
        if (!documents) return resolve(documents), callback(null, documents)
        if (invertAssociation) {
          documents = documents.map(document => {
            const nestedDcoument = document[invertAssociation.to]
            delete document[invertAssociation.to]
            nestedDcoument[invertAssociation.from] = document
            return nestedDcoument
          })
        }
        if (hydrateAssociation) documents = Hydrator.hydrate(documents, hydrateAssociation)
        if (populateAssociation) {
          Populator.populateAggregate(this._model, documents, populateAssociation).then(documents => {
            if (singular) documents = documents[0]
            resolve(documents)
          })
        } else {
          if (singular) documents = documents[0]
          resolve(documents)
        }
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
