const Association = require('./src/association')
const populateAssociation = require('./src/populateAssociation')

module.exports = function(mongoose) {

  Association.assign(mongoose.Schema)

  patchQueryPrototype()
  return plugin

  function plugin(schema, options = {}) {
    schema.methods.populateAssociation = function(...fields) {
      return populateAssociation(this.constructor, this, paths)
    }

    schema.statics.populateAssociation = function(documents, ...fields) {
      return populateAssociation(this, documents, paths)
    }
  }

  function patchQueryPrototype() {
    const Query = mongoose.Query
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
          resolve(populateAssociation(this.model, documents, ...fields))
        })
      })
    }
  }
}
