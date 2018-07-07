const Association = require('./Association')
const QueryBuilder = require('../QueryBuilder')

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
    return 'polymorphic'
  }

  get localField() {
    return this.define('localField', Association.idlize(this.as))
  }

  get typeField() {
    return this.define('typeField', `${this.localField}Type`)
  }

  findFor(document) {
    const { localField, typeField } = this
    return QueryBuilder.findOne({
      modelName: document[typeField],
      localField: '_id',
      localFieldValue: document[localField]
    })
  }
}
