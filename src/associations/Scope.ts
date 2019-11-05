import { Association } from './Association'
import * as mongoose from 'mongoose'

const OPTIONS = {
  as: 'name of the property to store the reference object',
}

export interface IOptions {

}

export class Scope {

  name: string
  association: Association
  match: any

  ['constructor']: typeof Scope

  constructor(name: string, association: Association, match: any = {}, options: IOptions = {}) {
    this.name = name
    this.association = association
    this.match = match
    this.options = options
    return this
  }

  static get options(): string[] {
    return Object.keys(OPTIONS)
  }

  set options(options: any) {
    this.constructor.options.forEach((option: string) => {
      const value = options[option]
      if (value) this.define(option, options[option])
    })
  }

  define(property: string, value: any) {
    Object.defineProperty(this, property, { value })
    return value
  }

  get as() {
    return this.define('as', `${Association.decapitalize(this.name)}${Association.capitalize(this.association.as)}`)
  }

  get _as() {
    return this.define('_as', Association.cacheKey(this.as))
  }

  get $as() {
    return this.define('$as', Association.variablize(this.as))
  }

  get $fetch() {
    return this.define('$fetch', `fetch${Association.capitalize(this.as)}`)
  }

  get $unset() {
    return this.define('$unset', `unset${Association.capitalize(this.as)}`)
  }

  get localField() {
    return this.define('localField', this.association.localField)
  }

  get foreignField() {
    return this.define('foreignField', this.association.foreignField)
  }

  get through() {
    return this.define('through', this.association.through)
  }

  get throughAsAssociation() {
    return this.define('throughAsAssociation', this.association.throughAsAssociation)
  }

  get associationType() {
    return this.define('associationType', this.association.associationType)
  }

  get nested() {
    return this.define('nested', this.association.nested)
  }

  get foreignModelName() {
    return this.define('foreignModelName', this.association.foreignModelName)
  }

  findFor(document: any): mongoose.DocumentQuery<any, any> | mongoose.Aggregate<any> {
    const query = this.association.findFor(document, {
      preserveNullAndEmptyArrays: false
    })

    if (this.association.through) {
      query.where({
        [this.association.throughAsAssociation.as]: this.match
      })
    } else {
      query.where(this.match)
    }

    return query
  }

  aggregateTo(aggregate: mongoose.Aggregate<any>) {
    const query = this.association.aggregateTo(aggregate, {
      preserveNullAndEmptyArrays: false,
      scopeAs: this.as
    })

    if (this.association.through) {
      query.where({
        [this.association.throughAsAssociation.as]: this.match
      })
    } else {
      query.where({
        [this.as]: this.match
      })
    }

    return query
  }
}
