/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-underscore-dangle: [2, {
  "allow": [
    "_exec",
    "_explain",
    "_populateAssociation",
    "_hydrateAssociation",
    "_invertAssociation",
    "_singular",
    "_conditions",
    "_fields",
    "_model",
    "_pipeline"
  ] }] */

const _ = require('lodash')
const inflection = require('inflection')
const util = require('util')
const SchemaMixin = require('./src/SchemaMixin')
const Populator = require('./src/Populator')
const Hydrator = require('./src/Hydrator')
const Fields = require('./src/Fields')
const Collection = require('./src/Collection')

const POPULATABLE_QUERY = ['find', 'findOne']

const plugin = Schema => {
  Schema.statics.associate = function associate(as) {
    return this.schema.associate(as)
  }

  Schema.methods.populateAssociation = function populateAssociation(...fields) {
    return Populator.populate(this.constructor, this, fields)
  }

  Schema.statics.populateAssociation = function populateAssociation(documents, ...fields) {
    return Populator.populate(this, documents, fields)
  }

  Schema.methods.fetch = function fetch(association) {
    const methodName = association instanceof Object ? association.$fetch : `fetch${inflection.capitalize(association)}`
    return this[methodName]()
  }

  Schema.methods.unset = function unset(association) {
    if (association) {
      const methodName = association instanceof Object ? association.$unset : `unset${inflection.capitalize(association)}`
      this[methodName]()
    } else {
      this.constructor.schema.associations.forEach(nestedAssociation => {
        this.unset(nestedAssociation)
      })
    }
    return this
  }

  Schema.statics._explain = function _explain() {
    const associations = {
      _id: `${this.modelName}._id`,
      modelName: this.modelName
    }
    this.schema.associations.forEach(association => {
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

const patchQueryPrototype = Query => {
  const _exec = Query.prototype.exec

  if (Query.prototype.populateAssociation) return

  Query.prototype.populateAssociation = function populateAssociation(...fields) {
    this._populateAssociation = fields
    return this
  }

  Query.prototype.collectAssociation = function collectAssociation(options) {
    this._collectAssociation = options
    return this
  }

  Query.prototype.exec = function exec(options, callback) {
    const populateAssociation = this._populateAssociation && Populator.checkFields(this._populateAssociation)
    const collectAssociation = this._collectAssociation

    if (!populateAssociation && !collectAssociation) return _exec.call(this, options, callback)

    //_.includes(POPULATABLE_QUERY, this.op) not sure if all query type will work ok

    return new Promise((resolve, reject) => {
      if (populateAssociation && populateAssociation.root.length) {
        const aggregate = Populator.aggregateFromQuery(this, populateAssociation)
        aggregate.then(documents => resolve(documents))
          .catch(error => reject(error))
      } else {
        _exec.call(this, options, (error, documents) => {
          if (error) return reject(error)
          if (collectAssociation) documents = Collection.collect(documents, collectAssociation)
          if (!documents) return resolve(documents)
          return Populator.populate(this.model, documents, populateAssociation)
            .then(() => resolve(documents))
            .catch(populateError => reject(populateError))
        })
      }
    })
  }

  Query.prototype._explain = function _explain() {
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

const patchAggregatePrototype = Aggregate => {
  const _exec = Aggregate.prototype.exec

  if (Aggregate.prototype.hydrateAssociation) return

  Aggregate.prototype.populateAssociation = function populateAssociation(...options) {
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

  Aggregate.prototype.hydrateAssociation = function hydrateAssociation(options) {
    if (options.reset) {
      delete options.reset
      this._hydrateAssociation = options
    } else {
      this._hydrateAssociation = _.merge(this._hydrateAssociation || {}, options)
    }
    return this
  }

  Aggregate.prototype.invertAssociation = function invertAssociation(from, to) {
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

  Aggregate.prototype.collectAssociation = function collectAssociation(options) {
    this._collectAssociation = options
    return this
  }

  Aggregate.prototype.exec = function exec(callback) {
    const populateAssociation = this._populateAssociation
    const hydrateAssociation = this._hydrateAssociation
    const invertAssociation = this._invertAssociation
    const collectAssociation = this._collectAssociation
    const singular = this._singular

    if (!populateAssociation
        && !hydrateAssociation
        && !invertAssociation
        && !singular) return _exec.call(this, callback)

    if (populateAssociation && populateAssociation._fields) {
      Populator.prePopulateAggregate(this, populateAssociation._fields)
    }

    return new Promise((resolve, reject) => {
      _exec.call(this, (error, documents) => {
        if (error) return reject(error)
        if (!documents) return resolve(documents)
        if (invertAssociation) {
          documents = documents.map(document => {
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
    let explain = [['aggregate', this._model.modelName, this._pipeline]]
    if (!populateAssociation) return explain
    if (populateAssociation && populateAssociation._fields) {
      Populator.prePopulateAggregate(this, populateAssociation._fields)
    }
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
}

const patchModel = mongoose => {
  const modelMethod = mongoose.model
  mongoose.model = function model(name, schema, collection, skipInit) {
    const currentModel = modelMethod.apply(this, [name, schema, collection, skipInit])
    if (schema) schema.model = currentModel
    return currentModel
  }
}

module.exports = function mongooseAssociation(mongoose) {
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
