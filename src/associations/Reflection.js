module.exports = class Reflection {
  static variablize(string) {
    return `$${string}`
  }

  constructor(association) {
    if (!association) throw 'a Reflection requires an association'
    this.association = association
  }

  define(property, value) {
    Object.defineProperty(this, property, {
      value
    })
    return value
  }
}
