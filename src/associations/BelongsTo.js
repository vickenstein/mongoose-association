const Association = require('./Association')
const QueryBuilder = require('../QueryBuilder')

const OPTIONS = {
  localField: 'name of the property to store the reference id'
}

module.exports = class BelongsTo extends Association {

  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options) {
    if (!options.foreignModelName) throw "Can\'t create a belongsTo association without specifying a foreignModelName"
    return super(...arguments)
  }

  get associationType() {
    return 'belongsTo'
  }

  get localField() {
    return this.define('localField', Association.idlize(this.as))
  }

  findFor(document) {
    const { localField } = this
    return QueryBuilder.findOne({
      modelName: this.foreignModelName,
      localField: '_id',
      localFieldValue: document[localField]
    })
  }
}
