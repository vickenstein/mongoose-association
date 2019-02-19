import * as _ from 'lodash'
import * as mongoose from 'mongoose'
import { Fields } from './Fields'
import { Association } from './associations/Association'

const ObjectId = mongoose.Types.ObjectId

interface LoDashStatic {
  [enumerateMethod: string]: any
}

export class Populator {
  static checkFields(populateFields: any) {
    if (populateFields[0] && populateFields[0] instanceof Fields) {
      return populateFields[0]
    }
    return new Fields(...populateFields)
  }

  static async populate(model: mongoose.Model<any>, documents: any, ...populateFields: any[]) {
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) [populateFields] = populateFields
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root

    await Promise.all(rootFields.map((rootField: string): Promise<any> => {
      const childrenFields = fields.children(rootField)
      return this.populateField(model, documents, rootField, childrenFields)
    }))

    return documents
  }

  static explainPopulate(model: mongoose.Model<any>, documents: any, ...populateFields: any[]) {
    if (!(documents instanceof Array)) documents = [documents]
    if (populateFields[0] instanceof Array) [populateFields] = populateFields
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root

    return _.flatten(rootFields.map((rootField: string): Promise<any> => {
      const childrenFields = fields.children(rootField)
      return this.explainPopulateField(model, documents, rootField, childrenFields)
    }))
  }

  static async populateField(model: mongoose.Model<any>, documents: any, field: string, childrenFields: Fields) {
    const _field = Association.cacheKey(field)
    const association = model.associate(field)
    const results = await association.findFor(documents).populateAssociation(childrenFields)
    const enumerateMethod = association.associationType === 'hasMany' ? _.groupBy : _.keyBy
    const { localField } = association
    let { foreignField } = association
    if (association.through) {
      foreignField = (document: any) => document[association.throughAsAssociation._with][foreignField]
    }
    const indexedResults = enumerateMethod(results, foreignField)
    documents.forEach((document: any) => {
      document[_field] = indexedResults[document[localField]]
    })
    return documents
  }

  static explainPopulateField(model: mongoose.Model<any>, documents: any, field: string, childrenFields: Fields) {
    const association = model.associate(field)
    return association.findFor(documents).populateAssociation(childrenFields)._explain()
  }

  static prePopulateAggregate(aggregate: mongoose.Aggregate<any>, ...populateFields: any[]) {
    const fields = this.checkFields(populateFields)

    const rootFields = fields.root
    const model = aggregate._model
    rootFields.forEach((rootField: string) => {
      const childrenFields = fields.children(rootField)
      const association = model.associate(rootField)
      association.aggregateTo(aggregate)
      if (childrenFields.length) {
        const options: any = {}
        options[rootField] = childrenFields
        aggregate.populateAssociation(options)
      }
    })
  }

  static async populateAggregate(model: mongoose.Model<any>, documents: any, populateOptions: any) {
    const populateFields = Object.keys(populateOptions)
    const promises: Promise<any>[] = []
    populateFields.forEach(field => {
      if (field !== '_fields') {
        const _field = Association.cacheKey(field)
        const nestedDocuments: any[] = _.compact(_.flatten(documents.map((document: any) => document[_field])))
        if (nestedDocuments.length) {
          promises.push(this.populate(
            nestedDocuments[0].constructor,
            nestedDocuments,
            populateOptions[field]
          ))
        }
      }
    })
    await Promise.all(promises)
    return documents
  }

  static explainPopulateAggregate(model: mongoose.Model<any>, documents: any, populateOptions: any = {}) {
    let explain: any[] = []
    Object.keys(populateOptions).forEach(field => {
      if (field !== '_fields') {
        const association = model.associate(field)
        const { foreignModel } = association
        explain = explain.concat(this.explainPopulate(
          foreignModel,
          [foreignModel._explain()],
          populateOptions[field]
        ))
      }
    })
    return explain
  }

  static queryConditionToAggregateMatch(conditions: any) {
    Object.keys(conditions).forEach(key => {
      const value = conditions[key]
      if (!/^\$/.test(key) && value instanceof Array && typeof value[0] !== 'number' && ObjectId.isValid(value[0])) {
        conditions[key] = { $in: value.map((aValue: any) => ObjectId(aValue)) }
      } else {
        conditions[key] = this.deepQueryConditionStringToObjectId(value)
      }
    })
    return conditions
  }

  static deepQueryConditionStringToObjectId(node: any): any {
    if (typeof node !== 'number' && ObjectId.isValid(node)) {
      if (node instanceof Object || typeof node === 'string' && node.length === 24) {
        return ObjectId(node)
      }
    } else if (node instanceof Object) {
      Object.keys(node).forEach(key => {
        node[key] = this.deepQueryConditionStringToObjectId(node[key])
      })
    } else if (node instanceof Array) {
      return node.map(branch => this.deepQueryConditionStringToObjectId(branch))
    }
    return node
  }

  static aggregateFromQuery(query: mongoose.DocumentQuery<any, any>, fields: any) {
    const aggregate = query.model.aggregate()
      .match(this.queryConditionToAggregateMatch(query._conditions))
    if (query.op === 'findOne') aggregate.limit(1).singular()
    fields.root.forEach((field: string) => {
      const association = query.model.associate(field)
      association.aggregateTo(aggregate)
      const children = fields.children(field)
      if (children.length) {
        const options: any = {}
        options[field] = children
        aggregate.populateAssociation(options)
      }
    })
    aggregate.hydrateAssociation({ model: query.model })
    return aggregate
  }
}
