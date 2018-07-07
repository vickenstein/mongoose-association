const mongoose = require('mongoose')

module.exports = class QueryBuilder {
  static findOne({ modelName, localField, localFieldValue, typeField, type }) {
    const query = {}
    query[localField] = localFieldValue
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).findOne(query)
  }

  static find({ modelName, localField, localFieldValues, typeField, type }) {
    const query = {}
    query[localField] = localFieldValues
    if (typeField && type) query[typeField] = type
    return mongoose.model(modelName).find(query)
  }
}
