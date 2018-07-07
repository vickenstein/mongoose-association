module.exports = class Hydrator {
  static hydrate(model, documents, ...fields) {
    return documents.map(document => {
      return model.hydrate(document)
    })
  }
}
