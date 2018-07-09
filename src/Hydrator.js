module.exports = class Hydrator {
  static hydrate(documents, model) {
    if (model) {
      return documents.map(document => {
        return model.hydrate(document)
      })
    }
    return documents
  }
}
