const Association = require('./Association')
const mongoose = require('mongoose')

const OPTIONS = {
  foreignModelNames: 'name of the models this belongsTo polymorphically',
  localField: 'name of the property to store the reference id',
  typeField: 'name of the property to store the reference type'
}

module.exports = class Polymorphic extends Association {

  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options) {
    if (!options.foreignModelNames || !options.foreignModelNames.length) throw "Can\'t create a polymorphic association without specifying any foreignModelNames"
    if (!options.as) throw "Can\'t create a polymorphic association without \'as\' parameter"
    return super(...arguments)
  }

  get associationType() {
    return this.define('associationType', 'polymorphic')
  }

  get typeField() {
    return this.define('typeField', `${this.localField}Type`)
  }

  findFor(document) {
    if (document instanceof Array) {
      return this.findManyFor(document)
    }
    const { localField, typeField } = this
    return Polymorphic.findOne({
      modelName: document[typeField],
      localField: '_id',
      localFieldValue: document[localField]
    })
  }

  findManyFor(documents) {
    return Polymorphic.find({
      modelName: documents[0][this.typeField],
      localField: '_id',
      localFieldValue: documents.map(document => document[this.localField])
    })
  }

  aggregateMatch(options) {
    const $match = super.aggregateMatch(options)
    $match[this.typeField] = options.documents ? options.documents[0][this.typeField] : options.as
    return $match
  }

  aggregateLookUp(aggregate, options) {
    const foreignModel = mongoose.model(options.documents ? options.documents[0][this.typeField] : options.as)
    const foreignModelCollectionName = foreignModel.collection.name
    aggregate.lookup({
      from: foreignModelCollectionName,
      'let': { localField: this.$localField },
      pipeline: [{
        $match: {
          $expr: { $eq: ['$$localField', this.$foreignField] }
        }
      }],
      as: this.as
    })


    if (options.hydrate !== false) {
      const hydrateOptions = { model: this.model }
      hydrateOptions[this.as] = { model: foreignModel }
      aggregate.hydrateAssociation(hydrateOptions)
    }
  }

  aggregate(options = {}) {
    if (!options.documents && !options.as) throw 'polymorphic aggregation requires an documents or option { as }'
    return super.aggregate(options)
  }
}
