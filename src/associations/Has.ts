import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import { Association, IOptions, IAggregateOptions } from './Association'

const OPTIONS = {
  with: 'name of the property that store the reference on the association',
  through: 'name of a model that is intermediary to the association model',
  throughAs: 'name of the property on the through model where it associate with this model',
  // tslint:disable-next-line: max-line-length
  throughWith: 'name of the property on the through model where it associate with the association model',
  dependent: 'delete or nullify, does not trigger schema hook'
}

export class Has extends Association {

  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  static get isReference() {
    return true
  }

  constructor(options: IOptions, schema: mongoose.Schema) {
    if (!options.foreignModelName) {
      throw 'Can\'t create a has association without specifying a foreignModelName'
    }
    if (options.dependent && options.through) {
      throw 'Can\'t create a depedent workflow on a through association'
    }
    if (options.dependent && !_.includes(['delete', 'nullify'], options.dependent)) {
      throw 'Invalid option for dependent, valid options: delete, nullfiy'
    }
    super(options, schema)
  }

  get dependent() {
    return this.define('dependent', null)
  }

  get isReference() {
    return this.constructor.isReference
  }

  get through() {
    return this.define('through', null)
  }

  get throughModel() {
    return this.define('throughModel', this.through && mongoose.model(this.through))
  }

  get throughCollectionName() {
    return this.define(
      'throughCollectionName',
      this.throughModel && this.throughModel.collection.name,
    )
  }

  get throughModelName() {
    return this.define('throughModelName', this.throughModel && this.throughModel.modelName)
  }

  get withAssociation() {
    const model = this.throughModel || this.foreignModel
    return this.define('withAssociation', model.associate(this.with))
  }

  get throughAs() {
    return this.define(
      'throughAs',
      this.throughModelName && Association.decapitalize(this.foreignModelName),
    )
  }

  get _throughAs() {
    return this.define('_throughAs', this.through && Association.cacheKey(this.throughAs))
  }

  get $throughAs() {
    return this.define('$throughAs', this.through && Association.variablize(this.throughAs))
  }

  get throughWith() {
    return this.define(
      'throughWith',
      this.throughModelName && Association.decapitalize(this.throughModelName),
    )
  }

  get _throughWith() {
    return this.define('_throughWith', this.through && Association.cacheKey(this.throughWith))
  }

  get $throughWith() {
    return this.define('$throughWith', this.through && Association.variablize(this.throughWith))
  }

  get throughAsAssociation() {
    return this.define(
      'throughAsAssociation',
      this.throughModel && this.throughModel.associate(this.throughAs),
    )
  }

  get throughWithAssociation() {
    return this.define(
      'throughWithAssociation',
      this.throughModel && this.model.associate(this.throughWith),
    )
  }

  get throughWithAsAssociation() {
    return this.define(
      'throughWithAsAssociation',
      this.withAssociation.isReference ? this.withAssociation.withAssociation
                                       : this.throughWithAssociation,
    )
  }

  get localField() {
    return this.define('localField', '_id')
  }

  get foreignField() {
    return this.define('foreignField', this.withAssociation.localField)
  }

  findFor(document: any, options: any = {}) {
    if (document instanceof Array) {
      if (!document.length) return (new mongoose.Query()).noop()
      return this.findManyFor(document, options)
    }

    if (this.through) {
      const $match: any = {}
      if (this.withAssociation.isReference) {
        $match._id = document[this.throughWithAsAssociation.localField]
      } else {
        if (this.withAssociation.associationType === 'polymorphic') {
          $match[this.withAssociation.typeField] = document.constructor.modelName
        }
        $match[this.withAssociation.localField] = document._id
      }

      const hydrateOptions: any = { model: this.foreignModel, reset: true }
      hydrateOptions[this.throughAsAssociation.with] = { model: this.throughModel }

      const aggregateOptions: IAggregateOptions = {
        $match,
        as: this.foreignModelName
      }

      if (typeof options.preserveNullAndEmptyArrays === 'boolean') {
        aggregateOptions.preserveNullAndEmptyArrays = options.preserveNullAndEmptyArrays
      }

      const aggregate = this.throughAsAssociation.aggregate(aggregateOptions)
        .invertAssociation(this.throughAsAssociation.with, this.throughAs)
        .hydrateAssociation(hydrateOptions)
      if (this.associationType === 'hasOne') aggregate.singular()
      return aggregate
    }

    const { modelName, associationType, localField } = this.withAssociation
    const query = this.constructor.query
    if (associationType === 'polymorphic') {
      const { typeField } = this.withAssociation
      return query({
        modelName,
        localField,
        typeField,
        localFieldValue: document._id,
        type: document.constructor.modelName || document.modelName,
        // second case for explain method
      })
    }
    return query({
      modelName,
      localField,
      localFieldValue: document._id,
    })
  }

  findManyFor(documents: any[], options: any = {}) {

    if (this.through) {
      const $match: any = {}
      if (this.withAssociation.isReference) {
        const ids = documents.map(document => document[this.throughWithAsAssociation.localField])
        $match._id = { $in: ids }
      } else {
        if (this.withAssociation.associationType === 'polymorphic') {
          $match[this.withAssociation.typeField] = documents[0].constructor.modelName
        }
        const ids = documents.map(document => document._id)
        $match[this.withAssociation.localField] = { $in: ids }
      }

      const hydrateOptions: any = { model: this.foreignModel, reset: true }
      hydrateOptions[this.throughAsAssociation.with] = { model: this.throughModel }

      const aggregateOptions: IAggregateOptions = {
        $match,
        as: this.foreignModelName,
      }

      if (typeof options.preserveNullAndEmptyArrays === 'boolean') {
        aggregateOptions.preserveNullAndEmptyArrays = options.preserveNullAndEmptyArrays
      }

      return this.throughAsAssociation.aggregate(aggregateOptions)
        .invertAssociation(this.throughAsAssociation.with, this.throughAs)
        .hydrateAssociation(hydrateOptions)
    }
    const { modelName, associationType, localField } = this.withAssociation
    if (associationType === 'polymorphic') {
      const { typeField } = this.withAssociation
      return Has.find({
        modelName,
        localField,
        typeField,
        localFieldValue: documents.map(document => document._id),
        type: documents[0].constructor.modelName || documents[0].modelName,
        // second case for explain method
      })
    }
    return Has.find({
      modelName,
      localField,
      localFieldValue: documents.map(document => document._id),
    })
  }

  aggregateLookUpMatch(options: IAggregateOptions) {
    let $match: any = {}
    if (this.nested) {
      $match = { $expr: { $in: ['$_id', '$$localField']} }
    } else {
      $match = super.aggregateLookUpMatch(options)
      if (this.withAssociation.associationType === 'polymorphic') {
        $match[this.withAssociation.typeField] = this.modelName
      }
    }
    return $match
  }

  aggregateThroughLookUpMatch(options?: IAggregateOptions) {
    const $match: any = {
      $expr: { $eq: ['$$localField', this.throughAsAssociation.$foreignField] },
    }
    if (this.throughAsAssociation.withAssociation &&
        this.throughAsAssociation.withAssociation.associationType === 'polymorphic') {
      $match[this.throughAsAssociation.withAssociation.typeField] = this.throughModelName
    }
    return $match
  }

  aggregateLookUp(aggregate: mongoose.Aggregate<any>, options: IAggregateOptions = {}) {
    if (this.through) {
      const $match = this.aggregateLookUpMatch(options)
      const preserveNullAndEmptyArrays = !!options.preserveNullAndEmptyArrays

      aggregate.lookup({
        from: this.throughCollectionName,
        let: { localField: this.throughWithAsAssociation.$localField },
        pipeline: [{ $match }],
        as: this.throughWithAsAssociation.as,
      })
      aggregate.unwind({
        path: this.throughWithAsAssociation.$as,
        preserveNullAndEmptyArrays
      })
      const $throughMatch = this.aggregateThroughLookUpMatch(options)
      aggregate.lookup({
        from: this.foreignCollectionName,
        // tslint:disable-next-line: max-line-length
        let: { localField: `${this.throughWithAsAssociation.$as}.${this.throughAsAssociation.localField}` },
        pipeline: [{ $match: $throughMatch }],
        as: this.throughAs,
      })
      aggregate.unwind({
        path: this.$throughAs,
        preserveNullAndEmptyArrays
      })
      if (this.associationType === 'hasMany') {
        const $group: any = { _id: '$_id' }
        $group[options.scopeAs || this.as] = { $push: this._throughAs }
        $group[this.throughWith] = { $push: this.throughWithAsAssociation._as }
        aggregate.group($group)
      }
      if (options.hydrate !== false) {
        const hydrateOptions: any = { model: this.model }
        hydrateOptions[options.scopeAs || this.as] = { model: this.foreignModel }
        hydrateOptions[this.throughWithAsAssociation.as] = { model: this.throughModel }
        aggregate.hydrateAssociation(hydrateOptions)
      }
    } else {
      super.aggregateLookUp(aggregate, options)
    }
  }
}
