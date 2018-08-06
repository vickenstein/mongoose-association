import { Has } from './Has'

export class HasOne extends Has {

  static get query() {
    return Has.findOne
  }

  get associationType() {
    return this.define('associationType', 'hasOne')
  }
}
