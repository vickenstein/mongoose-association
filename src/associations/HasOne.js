const Has = require('./Has')
const mongoose = require('mongoose')

module.exports = class HasOne extends Has {
  static get query() {
    return HasOne.findOne
  }

  get associationType() {
    return this.define('associationType', 'hasOne')
  }
}
