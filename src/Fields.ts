import * as _ from 'lodash'

export class Fields {

  private fields: string[]
  _root: string[]

  constructor(options?: object, ...fields: string[]) {
    if (options && !(options instanceof Object)) fields.unshift(options)
    this.fields = Fields.reduce(...fields)
  }

  static reduce(...fields: string[]): string[] {
    const reducedFields: string[] = []
    fields.forEach((field) => {
      let match = 0
      const regexp = new RegExp(`^${field}`)
      for (let i = 0; i < fields.length; i += 1) {
        if (fields[i].match(regexp)) {
          match += 1
          if (match > 1) break
        }
      }
      if (match <= 1) reducedFields.push(field)
    })
    return reducedFields
  }

  get length() {
    return this.fields.length
  }

  get root() {
    if (!this._root) {
      this._root = _.uniq(this.fields.map(field => field.split('.')[0]))
    }
    return this._root
  }

  children(matchField: string) {
    const fields = new Fields()
    this.fields.forEach((field) => {
      const splitField = field.split('.')
      if (splitField.length > 1 && splitField[0] === matchField) {
        fields.fields.push(splitField.slice(1).join('.'))
      }
    })
    return fields
  }
}
