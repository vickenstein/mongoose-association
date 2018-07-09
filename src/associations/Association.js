const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const OPTIONS = {
  foreignModelName: 'name of the model this belongsTo',
  as: 'name of the property to store the reference object'
}

module.exports = class Association {
  static findOne({ modelName, localField, localFieldValue, typeField, type }) {
    const query = {}
    query[localField] = localFieldValue
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).findOne(query)
  }

  static find({ modelName, localField, localFieldValue, typeField, type }) {
    const query = {}
    query[localField] = localFieldValue
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).find(query)
  }

  constructor(options, schema) {
    if (!schema) throw 'missing schema for association'
    this.options = options
    this.schema = schema
  }

  static get options () {
    return Object.keys(OPTIONS)
  }

  static variablize(string) {
    return `$${string}`
  }

  static idlize(string) {
    return `${string}Id`
  }

  static decapitalize(string) {
    return `${string.charAt(0).toLowerCase()}${string.substr(1)}`
  }

  set options(options) {
    this.constructor.options.forEach(option => {
      const value = options[option]
      if (value) this.define(option, options[option])
    })
  }

  define(property, value) {
    Object.defineProperty(this, property, {
      value
    })
    return value
  }

  get model() {
    return this.define('model', this.schema.model)
  }

  get modelName() {
    return this.define('modelName', this.model.modelName)
  }

  get localField() {
    return this.define('localField', Association.idlize(this.as))
  }

  get foreignField() {
    return this.define('foreignField', '_id')
  }

  get collectionName() {
    return this.define('collectionName', this.model.collection.name)
  }

  get foreignModel() {
    return this.define('foreignModel', mongoose.model(this.foreignModelName))
  }

  get foreignCollectionName() {
    return this.define('foreignCollectionName', this.foreignModel.collection.name)
  }

  get as() {
    return this.define('as', Association.decapitalize(this.foreignModelName))
  }

  get $as() {
    return this.define('$as', Association.variablize(this.as))
  }

  get with() {
    return this.define('with', Association.decapitalize(this.modelName))
  }

  get $with() {
    return this.define('$with', Association.variablize(this.with))
  }

  get $localField() {
    return this.define('$localField', Association.variablize(this.localField))
  }

  get $foreignField() {
    return this.define('$foreignField', Association.variablize(this.foreignField))
  }

  generateAggregateOnModel() {
    const aggregate = this.model.aggregate()
    aggregate.association = this
    return aggregate
  }

  aggregateMatch(options) {
    let $match = {}
    if (options.documents) {
      $match._id = { $in: options.documents.map(document => ObjectId(document._id)) }
    }
    if (options.$match) _.merge($match, options.$match)
    return $match
  }

  aggregate(options = {}) {
    if (options.documents && !(options.documents instanceof Array)) options.documents = [options.documents]
    const aggregate = this.generateAggregateOnModel(options)
    const $match = this.aggregateMatch(options)
    if ($match && Object.keys($match).length) aggregate.match($match)
    return this.aggregateTo(aggregate, options)
  }

  aggregateTo(aggregate, options) {
    this.aggregateLookUp(aggregate, options)
    if (this.associationType !== 'hasMany' && !this.through) aggregate.unwind(this.$as)
    return aggregate
  }

  aggregateLookUpMatch(options) {
    return {
      $expr: { $eq: ['$$localField', this.$foreignField] }
    }
  }

  aggregateLookUp(aggregate, options) {
    const $match = this.aggregateLookUpMatch(options)

    aggregate.lookup({
      from: this.foreignCollectionName,
      'let': { localField: this.$localField },
      pipeline: [{
        $match
      }],
      as: this.as
    })
  }
}
