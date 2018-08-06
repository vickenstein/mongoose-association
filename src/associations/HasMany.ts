import * as inflection from 'inflection'
import { Has } from './Has'

export class HasMany extends Has {

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
}
