import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import { SchemaMixin } from './SchemaMixin'
import { Association } from './associations/Association'
import { Scope } from './associations/Scope'
import * as associations from './associations/index'

interface IASSOCIATIONS {
  [type: string]: any
}

interface IasIndex {
  [as: string]: Association | Scope
}

const ASSOCIATIONS: IASSOCIATIONS = {
  belongsTo: associations.BelongsTo,
  polymorphic: associations.Polymorphic,
  hasOne: associations.HasOne,
  hasMany: associations.HasMany,
}

export class Associations {

  schema: SchemaMixin
  asIndexed: IasIndex

  static get types() {
    return Object.keys(ASSOCIATIONS)
  }

  static classOf(type: string) {
    return ASSOCIATIONS[type]
  }

  constructor(schema: SchemaMixin) {
    this.schema = schema
    this.asIndexed = {}
  }

  associate(as: string) {
    return this.asIndexed[as]
  }

  get model() {
    return this.schema.model
  }

  get modelName() {
    return this.model.modelName
  }

  get collectionName() {
    return this.model.collection.name
  }

  add(type: string, options: object) {
    if (!_.includes(Associations.types, type)) throw `${type} is not a valid association type`
    const ASSOCIATION = Associations.classOf(type)
    const association = new ASSOCIATION(options, this.schema)
    return this.index(association)
  }

  index(association: Association) {
    const { as } = association
    return (this.asIndexed[as] = association)
  }

  indexScope(scope: Scope) {
    const { as } = scope
    return (this.asIndexed[as] = scope)
  }

  forEach(func: (association: Association | Scope) => void) {
    Object.keys(this.asIndexed).forEach(as => func(this.associate(as)))
  }
}
