const Association = require('./Association')

const OPTIONS = { localField: 'name of the property to store the reference id' }

module.exports = class BelongsTo extends Association {
  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options) {
    if (!options.foreignModelName) throw "Can't create a belongsTo association without specifying a foreignModelName"
    return super(...arguments)
  }

  get associationType() {
    return this.define('associationType', 'belongsTo')
  }

  findFor(document) {
    if (document instanceof Array) {
      return this.findManyFor(document)
    }

    return BelongsTo.findOne({
      modelName: this.foreignModelName,
      localField: '_id',
      localFieldValue: document[this.localField]
    })
  }

  findManyFor(documents) {
    return BelongsTo.find({
      modelName: this.foreignModelName,
      localField: '_id',
      localFieldValue: documents.map(document => document[this.localField])
    })
  }

  index(order, options) {
    this.schema.indexAssociations([this, order], options)
    return this
  }
}
