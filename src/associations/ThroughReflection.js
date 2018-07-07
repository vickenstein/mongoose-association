const Reflection = require('./Reflection')

module.exports = class ThroughReflection extends Reflection {
  aggregate(document) {
    const aggregate = this.association.foreignModel.aggregate()

    aggregate.lookup({
      from: this.throughCollectionName,
      'let': { localField: this.$localField },
      pipeline: [{
        $match: {
          $expr: { $eq: ['$$localField', this.$foreignField] }
        }
      }],
      as: this.throughAs
    })

    return aggregate
  }

  get throughCollectionName() {
    return this.define('throughCollectionName', this.association.throughCollectionName)
  }

  get throughWithAssociation() {
    return this.define('throughWithAssociation', this.association.throughWithAssociation)
  }

  get throughWithIsReference() {
    return this.define('throughWithIsReference', this.throughWithAssociation.isReference)
  }

  get throughAsAssociation() {
    return this.define('throughAsAssociation', this.association.throughAsAssociation)
  }

  get throughWithPolymorphic() {
    return this.define('throughWithPolymorphic', this.association.throughWithAssociation.associationType === 'polymorphic')
  }

  get throughAsPolymorphic() {
    return this.define('throughAsPolymorphic', this.association.throughAsAssociation.associationType === 'polymorphic')
  }

  get localField() {
    return this.define(
      'localField',
      this.throughWithIsReference ? '_id' : this.throughWithAssociation.localField
    )
  }

  get $localField() {
    return this.define('$localField', Reflection.variablize(this.localField))
  }

  get foreignField() {
    return this.define(
      'foreignField',
      this.throughWithIsReference ? this.throughAsAssociation.localField : '_id'
    )
  }

  get $foreignField() {
    return this.define('$foreignField', Reflection.variablize(this.foreignField))
  }

  get throughAs() {
    return this.define('throughAs', this.association.throughAs)
  }

  get $throughAs() {
    return this.define('$throughAs', this.association.$throughAs)
  }

  // get throughOne() {
  //   return this.define('throughOne', this.)
  // }
}
