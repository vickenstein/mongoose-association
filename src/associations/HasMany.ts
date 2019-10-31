import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import * as inflection from 'inflection'
import { Has } from './Has'

const OPTIONS = {
  nested: 'create has many nested within model'
}

export class HasMany extends Has {

  static get options() {
    return Object.keys(OPTIONS).concat(Has.options)
  }

  static get query(): any {
    return HasMany.find
  }

  get associationType() {
    return this.define('associationType', 'hasMany')
  }

  get as() {
    return this.define('as', inflection.pluralize(Has.decapitalize(this.foreignModelName)))
  }

  get throughWith() {
    return this.define(
      'throughWith',
      this.throughModelName && inflection.pluralize(Has.decapitalize(this.throughModelName)),
    )
  }

  get localField() {
    if (this.nested) {
      return this.define(
        'localField',
        inflection.pluralize(Has.idlize(inflection.singularize(this.as)))
      )
    } else {
      return super.localField
    }
  }

  get foreignField() {
    if (this.nested) {
      return this.define(
        'foreignField',
        '_id'
      )
    } else {
      return this.define('foreignField', this.withAssociation.localField)
    }
  }

  findFor(document: any, options: any = {}) {
    if (this.nested) {
      return this.findNestedFor(document)
    }
    return super.findFor(document, options)
  }

  findManyFor(documents: any[], options: any = {}) {
    if (this.nested) {
      return this.findManyNestedFor(documents)
    }
    return super.findManyFor(documents, options)
  }

  findNestedFor(document: any) {
    if (document instanceof Array) {
      if (!document.length) return (new mongoose.Query()).noop()
      return this.findManyNestedFor(document)
    }

    const { foreignModelName: modelName, localField, foreignField } = this

    return HasMany.find({
      modelName,
      localField: foreignField,
      localFieldValue: document[localField]
    }).reorder(document[localField])
  }

  findManyNestedFor(documents: any[]) {
    const { foreignModelName: modelName, localField, foreignField } = this

    return HasMany.find({
      modelName,
      localField: foreignField,
      localFieldValue: _.flatten(_.map(documents, document => document[localField]))
    })
  }
}
