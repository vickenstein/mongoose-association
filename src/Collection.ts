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

  _spliceIn(position: number, ...documents: Array<T>) {
    super.splice(position, 0, ...documents)
  }

  _spliceOut(position: number, count: number) {
    super.splice(position, count)
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
      await this.association.throughModel.insertMany(throughAttributes)
    }
    return foreignObjects.length === 1 ? foreignObjects[0] : foreignObjects
  }

  async addNestedDocument(options: any = {}, ...foreignObjects: any[]) {
    const hasPosition = typeof options.position === 'number'
    const { isSynchronized } = this
    if (hasPosition) {
      this.document[this.association.localField].splice(options.position, 0, ...foreignObjects)
      if (isSynchronized) this._spliceIn(options.position, ...foreignObjects)
    } else {
      this.document[this.association.localField].push(...foreignObjects)
      if (isSynchronized) this._push(...foreignObjects)
    }
    await this.document.save(options)
    return foreignObjects
  }

  async removeNestedDocument(options: any, ...foreignObjects: any[]) {
    // todo: need to add this functionality
  }

  get isSynchronized() {
    // @ts-ignore
    return !this.document[this.association.localField].some((id, index) => {
      // @ts-ignore
      return (this[index] && this[index].id) !== id.toString()
    })
  }

  async create(attributes: any = {}, options: any) {
    if (attributes instanceof Array) return this.createMany(attributes, options)
    const model = this.association.foreignModel
    if (!this.association.through && !this.association.nested) {
      const { as } = this.association.withAssociation
      attributes[as] = this.document
    }
    const foreignObject = await model.create(attributes, options)
    if (this.association.nested) {
      await this.addNestedDocument(options, foreignObject)
    } else {
      this._push(foreignObject)
    }
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
    if (!this.association.through && !this.association.nested) {
      attributes.forEach(attribute => {
        const { as } = this.association.withAssociation
        attribute[as] = this.document
      })
    }
    const foreignObjects: Array<T> = await model.insertMany(attributes, options)
    if (this.association.nested) {
      await this.addNestedDocument(options, ...foreignObjects)
    } else {
      this._push(...foreignObjects)
    }
    if (this.association.through) {
      const throughAttributes = foreignObjects.map(foreignObject => {
        const throughAttribute: any = {}
        throughAttribute[this.association.throughAsAssociation.as] = foreignObject
        throughAttribute[this.association.withAssociation.as] = this.document
        return throughAttribute
      })
      await this.association.throughModel.insertMany(throughAttributes)
    }
    return foreignObjects
  }
}
