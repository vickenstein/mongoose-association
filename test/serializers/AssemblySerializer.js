const mongoose = require('mongoose')
const { Serializer } = require('../../dist/index')

module.exports = class BikeSerializer extends Serializer {

  static get Model() {
    return mongoose.model('Assembly')
  }

  static get properties() {
    return ['id']
  }

  static get associations() {
    return ['part']
  }
}
