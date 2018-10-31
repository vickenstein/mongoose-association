const mongoose = require('mongoose')
const { Serializer } = require('../../dist/index')

module.exports = class HelmetSerializer extends Serializer {

  static get Model() {
    return mongoose.model('Helmet')
  }

  static get properties() {
    return ['id']
  }

  static get associations() {
    return ['rider']
  }
}
