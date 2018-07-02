const mongoose = require('mongoose')

module.exports = class QueryBuilder {
  static findOne(modelName, field, value, type) {
    const query = {}
    query[field] = value
    if (type) query[`${field}Type`] = type
    return mongoose.model(modelName).findOne(query)
  }

  static find(modelName, field, values, type) {
    const query = {}
    query[field] = values
    if (type) query[`${field}Type`] = type
    return mongoose.model(modelName).find(query)
  }
}
