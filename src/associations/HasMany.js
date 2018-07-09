const inflection = require('inflection')
const Has = require('./Has')

module.exports = class HasMany extends Has {
  static get query() {
    return HasMany.find
  }

  get associationType() {
    return this.define('associationType', 'hasMany')
  }

  get as() {
    return this.define('as', inflection.pluralize(Has.decapitalize(this.foreignModelName)))
  }

  get throughWith() {
    return this.define('throughWith', this.throughModelName && inflection.pluralize(Has.decapitalize(this.throughModelName)))
  }
}
