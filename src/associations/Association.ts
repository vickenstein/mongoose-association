import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import * as inflection from 'inflection'

const { ObjectId } = mongoose.Types
const OPTIONS = {
  foreignModelName: 'name of the model this belongsTo',
  as: 'name of the property to store the reference object',
}

export interface IOptions {
  foreignModelName?: string,
  foreignModelNames?: string,
  as?: string,
  localField?: string,
  with?: string,
  through?: string,
  throughAs?: string,
  throughWith?: string,
  typeField?: string,
  dependent?: string,
  nested?: boolean
}

export interface IAggregateOptions {
  documents?: any,
  $match?: object,
  hydrate?: boolean,
  as?: string,
  scopeAs?: string,
  preserveNullAndEmptyArrays?: boolean
}

export class Association {

  schema: mongoose.Schema
  foreignModelName: string
  through: string
  typeField: string
  withAssociation: Association
  throughAssociation: Association
  throughAsAssociation: Association
  throughModel: mongoose.Model<any>
  isReference: boolean
  dependent: string
  nested: boolean

  ['constructor']: typeof Association

  static findOne({ modelName, localField, localFieldValue, typeField, type }: {
    modelName: string,
    localField: string,
    localFieldValue: any,
    typeField?: string,
    type?: string,
  }): mongoose.DocumentQuery<any, any> {
    const query: any = {}
    query[localField] = localFieldValue
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).findOne(query)
  }

  static find({ modelName, localField, localFieldValue, typeField, type }: {
    modelName: string,
    localField: string,
    localFieldValue: string[],
    typeField?: string,
    type?: string,
  }): mongoose.DocumentQuery<any, any> {
    const query: any = {}
    query[localField] = localFieldValue
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).find(query)
  }

  constructor(options: IOptions, schema: mongoose.Schema) {
    if (!schema) throw 'missing schema for association'
    this.options = options
    this.schema = schema
    return this
  }

  static get options(): string[] {
    return Object.keys(OPTIONS)
  }

  static cacheKey(string: string) {
    return `_${string}`
  }

  static variablize(string: string) {
    return `$${string}`
  }

  static idlize(string: string) {
    return `${string}Id`
  }

  static decapitalize(string: string) {
    return `${string.charAt(0).toLowerCase()}${string.substr(1)}`
  }

  static capitalize(string: string) {
    return `${string.charAt(0).toUpperCase()}${string.substr(1)}`
  }

  static get isReference() {
    return false
  }

  static get query() {
    return Association.findOne
  }

  set options(options: any) {
    this.constructor.options.forEach((option: string) => {
      const value = options[option]
      if (value) this.define(option, options[option])
    })
  }

  define(property: string, value: any) {
    Object.defineProperty(this, property, { value })
    return value
  }

  get associationType(): string {
    return ''
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

  get $fetch() {
    return this.define('$fetch', `fetch${Association.capitalize(this.as)}`)
  }

  get $unset() {
    return this.define('$unset', `unset${Association.capitalize(this.as)}`)
  }

  get _as() {
    return this.define('_as', Association.cacheKey(this.as))
  }

  get $as() {
    return this.define('$as', Association.variablize(this.as))
  }

  get with() {
    return this.define('with', Association.decapitalize(this.modelName))
  }

  get _with() {
    return this.define('$with', Association.cacheKey(this.with))
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

  findFor(document: any, options?: any): any {
    return
  }

  findForMany(documents: any, options?: any): any {
    return
  }

  generateAggregateOnModel(options?: IAggregateOptions) {
    const aggregate = this.model.aggregate()
    aggregate.association = this
    return aggregate
  }

  aggregateMatch(options: IAggregateOptions) {
    const $match: any = {}
    if (options.documents) {
      $match._id = { $in: options.documents.map((document: any) => ObjectId(document._id)) }
    }
    if (options.$match) _.merge($match, options.$match)
    return $match
  }

  aggregate(options: IAggregateOptions = {}) {
    if (options.documents && !(options.documents instanceof Array)) {
      options.documents = [options.documents]
    }
    const aggregate = this.generateAggregateOnModel(options)
    const $match = this.aggregateMatch(options)
    if ($match && Object.keys($match).length) aggregate.match($match)
    return this.aggregateTo(aggregate, options)
  }

  aggregateTo(aggregate: mongoose.Aggregate<any>, options: IAggregateOptions = {}) {
    this.aggregateLookUp(aggregate, options)
    const preserveNullAndEmptyArrays = typeof options.preserveNullAndEmptyArrays == 'boolean' ? options.preserveNullAndEmptyArrays : true
    if (this.associationType !== 'hasMany' && !this.through) {
      aggregate.unwind({
        path: this.$as,
        preserveNullAndEmptyArrays
      })
    }
    return aggregate
  }

  aggregateLookUpMatch(options?: IAggregateOptions) {
    return { $expr: { $eq: ['$$localField', this.$foreignField] } }
  }

  aggregateLookUp(aggregate: mongoose.Aggregate<any>, options: IAggregateOptions = {}) {
    const $match = this.aggregateLookUpMatch(options)

    aggregate.lookup({
      from: this.foreignCollectionName,
      let: { localField: this.$localField },
      pipeline: [{ $match }],
      as: options.scopeAs || this.as,
    })

    if (options.hydrate !== false) {
      const hydrateOptions: any = { model: this.model }
      hydrateOptions[options.scopeAs || this.as] = { model: this.foreignModel }
      aggregate.hydrateAssociation(hydrateOptions)
    }
  }
}
