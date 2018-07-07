const Association = require('./Association')
const mongoose = require('mongoose')

const OPTIONS = {
  with: 'name of the property that store the reference on the association',
  through: 'name of a model that is intermediary to the association model',
  throughAs: 'name of the property on the through model where it associate with this model',
  throughWith: 'name of the property on the through model where it associate with the association model'
}

module.exports = class Has extends Association {
  static get options() {
    return Object.keys(OPTIONS).concat(Association.options)
  }

  constructor(options) {
    if (!options.foreignModelName) throw "Can\'t create a has association without specifying a foreignModelName"
    return super(...arguments)
  }

  get isReference() {
    return true
  }

  get with() {
    return this.define('with', Association.decapitalize(this.modelName))
  }

  get through() {
    return this.define('through', null)
  }

  get throughModel() {
    return this.define('throughModel', this.through && mongoose.model(this.through))
  }

  get throughCollectionName() {
    return this.define('throughCollectionName', this.throughModel && this.throughModel.collection.name)
  }

  get throughModelName() {
    return this.define('throughModelName', this.throughModel && this.throughModel.modelName)
  }

  get withAssociation() {
    const model = this.throughModel || this.foreignModel
    return this.define('withAssociation', model.findAs(this.with))
  }

  get withAsAssociation() {
    return this.define('asAssociation', this.model.findAs(this.with))
  }

  get throughAs() {
    return this.define('throughAs', this.throughModelName && Association.decapitalize(this.foreignModelName))
  }

  get $throughAs() {
    return this.define('$throughAs', this.through && Association.variablize(this.throughAs))
  }

  get throughAsAssociation() {
    return this.define('throughAsAssociation', this.throughModel && this.throughModel.findAs(this.throughAs))
  }

  get throughWith() {
    return this.define('throughWith', this.throughModelName && Association.decapitalize(this.throughModelName))
  }

  get throughWithAssociation() {
    return this.define('throughWithAssociation', this.throughModel && this.foreignModel.findAs(this.throughWith))
  }
}
