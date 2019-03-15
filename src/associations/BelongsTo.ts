import * as mongoose from 'mongoose'
import { Association, IOptions } from './Association'

const OPTIONS = { localField: 'name of the property to store the reference id' }

export class BelongsTo extends Association {

  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options: IOptions, schema: mongoose.Schema) {
    if (!options.foreignModelName) {
      throw 'Can\'t create a belongsTo association without specifying a foreignModelName'
    }
    super(options, schema)
  }

  get associationType() {
    return this.define('associationType', 'belongsTo')
  }

  findFor(document: any): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any> {
    if (document instanceof Array) {
      if (!document.length) return (new mongoose.Query()).noop()
      return this.findManyFor(document)
    }

    return BelongsTo.findOne({
      modelName: this.foreignModelName,
      localField: '_id',
      localFieldValue: document[this.localField],
    })
  }

  findManyFor(documents: any[]): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any> {
    return BelongsTo.find({
      modelName: this.foreignModelName,
      localField: '_id',
      localFieldValue: documents.map(document => document[this.localField]),
    })
  }

  index(order: number, options: object) {
    this.schema.indexAssociations([this, order], options)
    return this
  }
}
