import * as mongoose from 'mongoose'
import { Association } from './associations/Association'

interface IOptions {
  document: mongoose.Document,
  association: Association,
}

export class Collection<T> extends Array<T> {

  document: mongoose.Document
  association: Association

  private constructor(...items: Array<T>) {
     super(...items)
  }

  static collect<T>(documents: Array<T>, options: IOptions): Collection<T> {
    const array = Object.create(Collection.prototype)
    array._push(...documents)
    array.document = options.document
    array.association = options.association
    return array
  }

  _push(...documents: Array<T>) {
    super.push(...documents)
  }

  async pushDocument(...foreignObjects: any[]) {
    if (!this.association.through) {
      const { as } = this.association.withAssociation
      foreignObjects.forEach((foreignObject: any) => (foreignObject[as] = this.document))
      const condition: any = { _id: foreignObjects.map(foreignObject => foreignObject._id) }
      const attributes: any = {}
      Object.keys(foreignObjects[0].$__.activePaths.states.modify).forEach(key => {
        attributes[key] = foreignObjects[0][key]
      })
      await foreignObjects[0].constructor.updateMany(condition, attributes)
      foreignObjects.forEach(foreignObject => {
        foreignObject.$__.activePaths.states.modify = {}
      })
    }
    this._push(...foreignObjects)
    if (this.association.through) {
      const throughAttributes = foreignObjects.map(foreignObject => {
        const throughAttribute: any = {}
        throughAttribute[this.association.throughAsAssociation.as] = foreignObject
        throughAttribute[this.association.withAssociation.as] = this.document
        return throughAttribute
      })
      await this.association.throughModel.create(throughAttributes)
    }
    return foreignObjects.length === 1 ? foreignObjects[0] : foreignObjects
  }

  async create(attributes: any = {}, options: any) {
    if (attributes instanceof Array) return this.createMany(attributes, options)
    const model = this.association.foreignModel
    if (!this.association.through) {
      const { as } = this.association.withAssociation
      attributes[as] = this.document
    }
    const foreignObject = await model.create(attributes, options)
    this._push(foreignObject)
    if (this.association.through) {
      const throughAttributes: any = {}
      throughAttributes[this.association.throughAsAssociation.as] = foreignObject
      throughAttributes[this.association.withAssociation.as] = this.document
      await this.association.throughModel.create(throughAttributes)
    }
    return foreignObject
  }

  async createMany(attributes: any[] = [], options: any) {
    const model = this.association.foreignModel
    if (!this.association.through) {
      attributes.forEach(attribute => {
        const { as } = this.association.withAssociation
        attribute[as] = this.document
      })
    }
    const foreignObjects: Array<T> = await model.create(attributes, options)
    this._push(...foreignObjects)
    if (this.association.through) {
      const throughAttributes = foreignObjects.map(foreignObject => {
        const throughAttribute: any = {}
        throughAttribute[this.association.throughAsAssociation.as] = foreignObject
        throughAttribute[this.association.withAssociation.as] = this.document
        return throughAttribute
      })
      await this.association.throughModel.create(throughAttributes)
    }
    return foreignObjects
  }
}
