const mongoose = require('mongoose')
const { Serializer } = require('../../dist/index')

module.exports = class BikeSerializer extends Serializer {

  static get Model() {
    return mongoose.model('Bike')
  }

  static get properties() {
    return ['id', 'color']
  }

  static get associations() {
    return ['rider', 'assemblies', 'components']
  }

  static get computed() {
    return ['uppercaseColor']
  }
}
