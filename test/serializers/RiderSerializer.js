const { Serializer } = require('../../dist/index')

module.exports = class RiderSerializer extends Serializer {

  static get properties() {
    return ['id', 'age']
  }

}
