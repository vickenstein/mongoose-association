module.exports = class Collection extends Array {
  static collect(documents, options) {
    if (!options.document || !options.association) throw 'missing collection options'
    return new Collection(options.document, options.association, documents)
  }

  constructor(document, association, array = []) {
    super(...array)
    if (!document) throw 'missing document for associating collection'
    if (!association) throw 'missing association for creating collection'
    this.document = document
    this.association = association
  }

  _push() {
    super.push(...arguments)
  }

  async push(...foreignObjects) {
    if (!this.association.through) {
      const {as} = this.association.withAssociation
      foreignObjects.forEach(foreignObject => foreignObject[as] = this.document)
      const condition = { _id: foreignObjects.map(foreignObject => foreignObject._id) }
      const attributes = {}
      Object.keys(foreignObjects[0].$__.activePaths.states.modify).forEach(key => {
        attributes[key] = foreignObjects[0][key]
      })
      await foreignObjects[0].constructor.updateMany(condition, attributes)
      foreignObjects.forEach(foreignObject => foreignObjects[0].$__.activePaths.states.modify = {})
    }
    this._push(...foreignObjects)
    if (this.association.through) {
      const throughAttributes = foreignObjects.map(foreignObject => {
        const throughAttribute = {}
        throughAttribute[this.association.throughAsAssociation.as] = foreignObject
        throughAttribute[this.association.withAssociation.as] = this.document
        return throughAttribute
      })
      const throughObjects = await this.association.throughModel.create(throughAttributes)
    }
    return foreignObjects.length == 1 ? foreignObjects[0] : foreignObjects
  }

  async create(attributes = {}, options) {
    if (attributes instanceof Array) return this.createMany(attributes, options)
    const model = this.association.foreignModel
    if (!this.association.through) {
      const {as} = this.association.withAssociation
      attributes[as] = this.document
    }
    const foreignObject = await model.create(attributes, options)
    this._push(foreignObject)
    if (this.association.through) {
      const throughAttributes = {}
      throughAttributes[this.association.throughAsAssociation.as] = foreignObject
      throughAttributes[this.association.withAssociation.as] = this.document
      const throughObject = await this.association.throughModel.create(throughAttributes)
    }
    return foreignObject
  }

  async createMany(attributes = [], options) {
    const model = this.association.foreignModel
    if (!this.association.through) {
      attributes.forEach(attribute => {
        const {as} = this.association.withAssociation
        attribute[as] = this.document
      })
    }
    const foreignObjects = await model.create(attributes, options)
    this._push(...foreignObjects)
    if (this.association.through) {
      const throughAttributes = foreignObjects.map(foreignObject => {
        const throughAttribute = {}
        throughAttribute[this.association.throughAsAssociation.as] = foreignObject
        throughAttribute[this.association.withAssociation.as] = this.document
        return throughAttribute
      })
      const throughObjects = await this.association.throughModel.create(throughAttributes)
    }
    return foreignObjects
  }
}
