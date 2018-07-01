const SchemaMixin = require('./src/SchemaMixin')
const Populator = require('./src/Populator')

const plugin = (Schema, options = {}) => {
  Schema.methods.populateAssociation = function(...fields) {
    return Populator.populate(this.constructor, this, paths)
  }

  Schema.statics.populateAssociation = function(documents, ...fields) {
    return Populator.populate(this, documents, paths)
  }
}

const patchQueryPrototype = (Query) => {
  const _exec = Query.prototype.exec

  if (Query.prototype.populateAssociation) return

  Query.prototype.populateAssociation = function(...fields) {
    this._populateAssociation = fields
    return this
  }

  Query.prototype.exec = function(op, callback) {
    if (!this._populateAssociation) return _exec.call(this, op, callback)

    const fields = this._populateAssociation
    return new Promise((resolve, reject) => {
      _exec.call(this, op, (error, documents) => {
        if (error) return reject(error), callback(error)
        if (!documents) return resolve(documents), callback(null, documents)
        resolve(Populator.populate(this.model, documents, ...fields))
      })
    })
  }
}

module.exports = function(mongoose) {
  //apply helper methods to mongoose schema for generating associations
  SchemaMixin.apply(mongoose.Schema)

  //patch mongoose Query to perform association population during queries
  patchQueryPrototype(mongoose.Query)

  //using mongoose plugin to apply mongoose model static methods and instance methods for populating
  mongoose.plugin(plugin)
}
