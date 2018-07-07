const inflection = require('inflection')
const mongoose = require('mongoose')

const OPTIONS = {
  foreignModelName: 'name of the model this belongsTo',
  as: 'name of the property to store the reference object'
}

module.exports = class Association {
  constructor(options, schema) {
    if (!schema) throw 'missing schema for association'
    this.options = options
    this.schema = schema
  }

  static get options () {
    return Object.keys(OPTIONS)
  }

  static variablize(string) {
    return `$${string}`
  }

  static idlize(string) {
    return `${string}Id`
  }

  static decapitalize(string) {
    return `${string.charAt(0).toLowerCase()}${string.substr(1)}`
  }

  set options(options) {
    this.constructor.options.forEach(option => {
      const value = options[option]
      if (value) this.define(option, options[option])
    })
  }

  define(property, value) {
    Object.defineProperty(this, property, {
      value
    })
    return value
  }

  get model() {
    return this.schema.model
  }

  get modelName() {
    return this.model.modelName
  }

  get collectionName() {
    return this.model.collection.name
  }

  get foreignModel() {
    return mongoose.model(this.foreignModelName)
  }

  get as() {
    return this.define('as', Association.decapitalize(this.foreignModelName))
  }

  get $as() {
    return this.define('$as', Association.variablize(this.as))
  }
}
