import * as mongoose from 'mongoose'
import { Association, IOptions, IAggregateOptions } from './Association'

const OPTIONS = {
  foreignModelNames: 'name of the models this belongsTo polymorphically',
  localField: 'name of the property to store the reference id',
  typeField: 'name of the property to store the reference type',
}

export class Polymorphic extends Association {
  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options: IOptions, schema: mongoose.Schema) {
    if (!options.foreignModelNames || !options.foreignModelNames.length) {
      throw 'Can\'t create a polymorphic association without specifying any foreignModelNames'
    }
    if (!options.as) throw 'Can\'t create a polymorphic association without \'as\' parameter'
    super(options, schema)
  }

  get associationType() {
    return this.define('associationType', 'polymorphic')
  }

  get typeField() {
    return this.define('typeField', `${this.localField}Type`)
  }

  findFor(document: any) {
    if (document instanceof Array) {
      return this.findManyFor(document)
    }
    const { localField, typeField } = this
    return Polymorphic.findOne({
      modelName: document[typeField],
      localField: '_id',
      localFieldValue: document[localField],
    })
  }

  findManyFor(documents: any[]) {
    return Polymorphic.find({
      modelName: documents[0][this.typeField],
      localField: '_id',
      localFieldValue: documents.map(document => document[this.localField]),
    })
  }

  aggregateMatch(options: IAggregateOptions) {
    const $match = super.aggregateMatch(options)
    $match[this.typeField] = options.documents ? options.documents[0][this.typeField] : options.as
    return $match
  }

  aggregateLookUp(aggregate: mongoose.Aggregate<any>, options: IAggregateOptions) {
    const foreignModel = mongoose.model(
      options.documents
        ? options.documents[0][this.typeField]
        : options.as,
    )
    const foreignModelCollectionName = foreignModel.collection.name
    aggregate.lookup({
      from: foreignModelCollectionName,
      let: { localField: this.$localField },
      pipeline: [{ $match: { $expr: { $eq: ['$$localField', this.$foreignField] } } }],
      as: this.as,
    })

    if (options.hydrate) {
      const hydrateOptions: any = { model: this.model }
      hydrateOptions[this.as] = { model: foreignModel }
      aggregate.hydrateAssociation(hydrateOptions)
    }
  }

  aggregate(options: IAggregateOptions = {}) {
    if (!options.documents && !options.as) {
      throw 'polymorphic aggregation requires an documents or option { as }'
    }
    return super.aggregate(options)
  }

  index(order: number, options: object) {
    this.schema.indexAssociations([this, order], options)
    return this
  }
}
