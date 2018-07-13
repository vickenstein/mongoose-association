const Has = require('./Has')

module.exports = class HasOne extends Has {
  static get query() {
    return HasOne.findOne
  }

  get associationType() {
    return this.define('associationType', 'hasOne')
  }
}
