const mongoose = require('mongoose')
const { Serializer } = require('../../dist/index')

module.exports = class BikeSerializer extends Serializer {

  static get Model() {
    return mongoose.model('Part')
  }

  static get properties() {
    return ['id']
  }

}
