const Association = require('./Association')
const mongoose = require('mongoose')

const OPTIONS = {
  with: 'name of the property that store the reference on the association',
  through: 'name of a model that is intermediary to the association model',
  throughAs: 'name of the property on the through model where it associate with this model',
  throughWith: 'name of the property on the through model where it associate with the association model'
}

module.exports = class Has extends Association {
  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options) {
    if (!options.foreignModelName) throw "Can\'t create a has association without specifying a foreignModelName"
    return super(...arguments)
  }

  get isReference() {
    return true
  }

  get through() {
    return this.define('through', null)
  }

  get throughModel() {
    return this.define('throughModel', this.through && mongoose.model(this.through))
  }

  get throughCollectionName() {
    return this.define('throughCollectionName', this.throughModel && this.throughModel.collection.name)
  }

  get throughModelName() {
    return this.define('throughModelName', this.throughModel && this.throughModel.modelName)
  }

  get withAssociation() {
    const model = this.throughModel || this.foreignModel
    return this.define('withAssociation', model.associate(this.with))
  }

  get throughAs() {
    return this.define('throughAs', this.throughModelName && Association.decapitalize(this.foreignModelName))
  }

  get $throughAs() {
    return this.define('$throughAs', this.through && Association.variablize(this.throughAs))
  }

  get throughWith() {
    return this.define('throughWith', this.throughModelName && Association.decapitalize(this.throughModelName))
  }

  get $throughWith() {
    return this.define('$throughWith', this.through && Association.variablize(this.throughWith))
  }

  get throughAsAssociation() {
    return this.define('throughAsAssociation', this.throughModel && this.throughModel.associate(this.throughAs))
  }

  get throughWithAssociation() {
    return this.define('throughWithAssociation', this.throughModel && this.model.associate(this.throughWith))
  }

  get throughWithAsAssociation() {
    return this.define('throughWithAsAssociation', this.withAssociation.isReference ? this.withAssociation.withAssociation : this.throughWithAssociation)
  }

  get localField() {
    return this.define('localField', '_id')
  }

  get foreignField() {
    return this.define('foreignField', this.withAssociation.localField)
  }

  findFor(document) {
    if (document instanceof Array) {
      return this.findManyFor(document)
    }

    if (this.through) {
      const $match = {}
      if (this.withAssociation.isReference) {
        $match._id = document[this.throughWithAsAssociation.localField]
      } else {
        if (this.withAssociation.associationType === 'polymorphic') $match[this.withAssociation.typeField] = document.constructor.modelName
        $match[this.withAssociation.localField] = document._id
      }

      const hydrateOptions = { model: this.foreignModel, reset: true }
      hydrateOptions[this.throughAsAssociation.with] = { model: this.throughModel }

      const aggregate = this.throughAsAssociation.aggregate({ $match, as: this.foreignModelName }).invertAssociation(this.throughAsAssociation.with, this.throughAs).hydrateAssociation(hydrateOptions)
      if (this.associationType === 'hasOne') aggregate.singular()
      return aggregate
    } else {
      const { modelName, associationType, localField } = this.withAssociation
      const query = this.constructor.query
      if (associationType === 'polymorphic') {
        const { typeField } = this.withAssociation
        return query({
          modelName,
          localField,
          localFieldValue: document._id,
          typeField,
          type: document.constructor.modelName
        })
      } else {
        return query({
          modelName,
          localField,
          localFieldValue: document._id
        })
      }
    }
  }

  findManyFor(documents) {
    if (this.through) {

      const $match = {}

      if (this.withAssociation.isReference) {
        $match._id = {
          $in: documents.map(document => document[this.throughWithAsAssociation.localField])
        }
      } else {
        if (this.withAssociation.associationType === 'polymorphic') $match[this.withAssociation.typeField] = documents[0].constructor.modelName
        $match[this.withAssociation.localField] = {
          $in: documents.map(document => document._id)
        }
      }

      const hydrateOptions = { model: this.foreignModel, reset: true }
      hydrateOptions[this.throughAsAssociation.with] = { model: this.throughModel }

      return this.throughAsAssociation.aggregate({
        $match, as: this.foreignModelName
      }).invertAssociation(this.throughAsAssociation.with, this.throughAs).hydrateAssociation(hydrateOptions)
    } else {

      const { modelName, associationType, localField } = this.withAssociation
      if (associationType === 'polymorphic') {
        const { typeField } = this.withAssociation
        return Has.find({
          modelName,
          localField,
          localFieldValue: documents.map(document => document._id),
          typeField,
          type: documents[0].constructor.modelName
        })
      } else {
        return Has.find({
          modelName,
          localField,
          localFieldValue: documents.map(document => document._id)
        })
      }
    }
  }

  aggregateLookUpMatch(options, through) {
    let $match = {}
    if (through) {
      $match = {
        $expr: { $eq: ['$$localField', this.throughAsAssociation.$foreignField] }
      }
    } else {
      $match = super.aggregateLookUpMatch(options)
    }
    if (this.withAssociation.associationType === 'polymorphic') $match[this.withAssociation.typeField] = this.modelName
    return $match
  }

  aggregateThroughLookUpMatch(options) {
    const $match = {
      $expr: { $eq: ['$$localField', this.throughAsAssociation.$foreignField] }
    }
    if (this.throughAsAssociation.withAssociation && this.throughAsAssociation.withAssociation.associationType === 'polymorphic') {
      $match[this.throughAsAssociation.withAssociation.typeField] = this.throughModelName
    }
    return $match
  }

  aggregateLookUp(aggregate, options) {
    if (this.through) {
      const $match = this.aggregateLookUpMatch(options)

      aggregate.lookup({
        from: this.throughCollectionName,
        'let': { localField: this.throughWithAsAssociation.$localField },
        pipeline: [{
          $match
        }],
        as: this.throughWithAsAssociation.as
      })
      aggregate.unwind(this.throughWithAsAssociation.$as)
      const $throughMatch = this.aggregateThroughLookUpMatch(options)
      aggregate.lookup({
        from: this.foreignCollectionName,
        'let': { localField: `${this.throughWithAsAssociation.$as}.${this.throughAsAssociation.localField}` },
        pipeline: [{
          $match: $throughMatch
        }],
        as: this.throughAs
      })
      aggregate.unwind(this.$throughAs)
      if (this.associationType === 'hasMany') {
        const $group = { _id: "$_id" }
        $group[this.as] = {
          $push: this.$throughAs
        }
        $group[this.throughWith] = {
          $push: this.throughWithAsAssociation.$as
        }
        aggregate.group($group)
      }
      if (options.hydrate !== false) {
        const hydrateOptions = { model: this.model }
        hydrateOptions[this.as] = { model: this.foreignModel }
        hydrateOptions[this.throughWithAsAssociation.as] = { model: this.throughModel }
        aggregate.hydrateAssociation(hydrateOptions)
      }
    } else {
      super.aggregateLookUp(aggregate, options)
    }
  }
}
