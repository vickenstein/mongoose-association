const mongoose = require('mongoose')
const { Serializer } = require('../../dist/index')

module.exports = class RiderSerializer extends Serializer {

  static get Model() {
    return mongoose.model('Rider')
  }

  static get properties() {
    return ['id', 'age']
  }

  static get associations() {
    return ['helmet']
  }

  static get computed() {
    return ['doubleAge']
  }
}
