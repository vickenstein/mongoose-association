const Has = require('./Has')

module.exports = class HasMany extends Has {
  get associationType() {
    return 'hasOne'
  }

  findFor(document) {
    const { through, withAssociation } = this
    if (through) {
      return this.aggregateFor(document)
    } else {
      const { modelName, associationType, localField } = withAssociation
      if (associationType === 'polymorphic') {
        const { typeField } = withAssociation
        return QueryBuilder.find({
          modelName,
          localField,
          localFieldValues: document._id,
          typeField,
          type: document.constructor.modelName
        })
      } else {
        return QueryBuilder.find({
          modelName,
          localField,
          localFieldValues: document._id
        })
      }
    }
  }

  aggregateFor(document) {

    const throughReflection = new ThroughReflection(this)

    const aggregate = throughReflection.aggregate()

    aggregate.unwind(throughReflection.$throughAs)

    // if (foreignTypeField) {
    //   const match = {}

    //   aggregate.match(match)
    // }

    return aggregate.hydrateAssociation().singular()
  }
}
