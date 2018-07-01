const _ = require('lodash')

module.exports = class Fields {
  constructor(...fields) {
    this.fields = Fields.reduce(...fields)
  }

  static reduce(...fields) {
    const reducedFields = []
    fields.forEach(field => {
      let match = 0
      const regexp = new RegExp(`^${field}`)
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].match(regexp)) {
          match++
          if (match > 1) break
        }
      }
      if (match <= 1) reducedFields.push(field)
    })
    return reducedFields
  }

  get length() {
    return this.fields.length
  }

  get root() {
    return _.uniq(this.fields.map(field => field.split('.')[0]))
  }

  children(matchField) {
    const fields = new Fields
    this.fields.forEach(field => {
      const splitField = field.split('.')
      if (splitField.length > 1 && splitField[0] === matchField) {
        fields.fields.push(splitField.slice(1).join('.'))
      }
    })
    return fields
  }
}
