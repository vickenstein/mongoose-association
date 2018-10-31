import * as mongoose from 'mongoose'
import * as _ from 'lodash'
import { Fields } from './Fields'
import { ClassFinder } from 'node-association'
declare module 'mongoose' {

  export interface Document {
    [property: string]: any
  }

}

export class Serializer {

  document: mongoose.Document
  fields: Fields
  _properties: string[]

  ['constructor']: typeof Serializer

  static get Model(): mongoose.Model<any> {
    return undefined
  }

  get Model() {
    return this.constructor.Model
  }

  static get properties() {
    return ['id']
  }

  static get computed(): string[] {
    return []
  }

  static get associations(): string[] {
    return []
  }

  static getPopulatableAssociations(...fields: string[]): string[] {
    //@ts-ignore werid syntax need to fix
    const populateFields = (fields[0] instanceof Fields) ? fields[0] : new Fields(...fields)
    const populatableFields: string[] = []
    populateFields.fields.forEach((field: string) => {
      const populatableField = this.getPopulatableAssociation(field)
      if (populatableField) populatableFields.push(populatableField)
    })
    //@ts-ignore werid syntax need to fix
    return (new Fields(...populatableFields)).fields
  }

  static getPopulatableAssociation(field: string) {
    const populatableFields: string[] = []
    let serializer = this
    field.split('.').some(subfield => {
      if (_.includes(serializer.associations, subfield)) {
        const association = serializer.Model.associate(subfield)
        serializer = this.prototype.Serializer(association.foreignModelName)
        populatableFields.push(subfield)
        return false
      }
      return true
    })
    return populatableFields.join('.')
  }

  constructor(document: mongoose.Document, ...fields: string[]) {
    this.document = document
    //@ts-ignore werid syntax need to fix
    this.fields = (fields[0] instanceof Fields) ? fields[0] : new Fields(...fields)
  }

  get isLean() {
    return this.properties.length
  }

  get properties() {
    if (!this._properties) {
      this._properties = _.intersection(this.fields.root, this.constructor.properties)
    }
    return this._properties
  }

  get associations() {
    return _.intersection(this.fields.root, this.constructor.associations)
  }

  Serializer(modelName: string) {
    return ClassFinder.classFor(modelName, 'Serializer')
  }

  toJson(json: any) {
    if (!json) return json
    if (!this.document) return this.document
    if (!this.isLean) {
      this.constructor.properties.forEach(property => {
        json[property] = this.document[property]
      })
    } else {
      this.properties.forEach(property => {
        json[property] = this.document[property]
      })
    }

    this.associations.forEach((as: string) => {

      const association = this.Model.associate(as)
      const nestedDocument = this.document[association._as]

      if (!nestedDocument) return null

      const NestedSerializer = this.Serializer(association.foreignModelName)

      if (nestedDocument instanceof Array) {
        const childrenFields = this.fields.children(as)
        json[association.as] = nestedDocument.map(aNestedDocument => ({}))
        json[association.as].forEach((nestedJson: any, index: number) => {
          const nestedSerializer = new NestedSerializer(nestedDocument[index], childrenFields)
          nestedSerializer.toJson(nestedJson)
        })
      } else {
        json[association.as] = {}
        const nestedSerializer = new NestedSerializer(nestedDocument, this.fields.children(as))
        nestedSerializer.toJson(json[association.as])
      }
    })
    return json
  }

}
