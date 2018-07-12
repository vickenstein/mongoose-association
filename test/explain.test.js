require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

const Rider = mongoose.model('Rider')
const Helmet = mongoose.model('Helmet')
const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Rating = mongoose.model('Rating')
const Part = mongoose.model('Part')
const Assembly = mongoose.model('Assembly')

const BIKECOUNT = 5
const PARTCOUNT = 5
const PARTPERBIKE = 2
const ObjectIds = []
for(let i = 0; i < BIKECOUNT; i++) {
  ObjectIds.push(ObjectId())
}
const bikes = []
const cars = []
const ratings = []
const carRatings = []
const riders = []
const helmets = []
const parts = []
const bikeAssemblies = []
const carAssemblies = []

async function setupData() {
  for(let i = 0; i < PARTCOUNT; i++) {
    const part = await new Part().save()
    parts.push(part)
  }
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = await new Bike({ _id: ObjectIds[i] }).save()
    bikes.push(bike)
    const car = await new Car({ _id: ObjectIds[i] }).save()
    cars.push(car)
    const helmet = await new Helmet().save()
    helmets.push(helmet)
    const rider = await new Rider({ _id: ObjectIds[i], bike: bikes[i], helmet: helmets[i] }).save()
    riders.push(rider)
    const rating = await new Rating({ _id: ObjectIds[i], vehicle: bikes[i] }).save()
    ratings.push(rating)
    const carRating = await new Rating({ vehicle: cars[i] }).save()
    carRatings.push(carRating)
    for(let j = 0; j < PARTPERBIKE; j++) {
      const part = parts[(i * PARTPERBIKE + j) % PARTCOUNT]
      const bikeAssembly = await new Assembly({
        part,
        vehicle: bike
      }).save()
      bikeAssemblies.push(bikeAssembly)
      const carAssembly = await new Assembly({
        part,
        vehicle: car
      }).save()
      carAssemblies.push(carAssembly)
    }
  }
}

describe("assign association class", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe("#explain()", () => {
    it('standard query', () => {
      const explain = Rider.findOne({ _id: riders[0]._id })._explain()
      assert.strictEqual(explain[0][0], 'query')
      assert.strictEqual(explain[0][1], 'Rider')
      assert.deepEqual(explain[0][2], { _id: riders[0]._id })
    })

    it('standard query with population', () => {
      const explain = Rider.findOne({ _id: riders[0]._id }).populateAssociation('bike')._explain()
      assert.strictEqual(explain[0][0], 'aggregate')
      assert.strictEqual(explain[0][1], 'Rider')
    })

    it('standard aggregation', () => {
      const explain = Rider.associate('bike').aggregate()._explain()
      assert.strictEqual(explain[0][0], 'aggregate')
      assert.strictEqual(explain[0][1], 'Rider')
    })

    it('standard aggregation with population on root document', () => {
      const explain = Rider.associate('bike').aggregate().populateAssociation('helmet')._explain()
      assert.strictEqual(explain[0][0], 'aggregate')
      assert.strictEqual(explain[0][1], 'Rider')
    })

    it('standard aggregation with population on nested document', () => {
      const explain = Rider.associate('bike').aggregate().populateAssociation({
        bike: ['rating']
      })._explain()
      assert.strictEqual(explain[1][0], 'query')
      assert.strictEqual(explain[1][1], 'Rating')
      assert.deepEqual(explain[1][2], { vehicleId: [ 'Bike._id' ], vehicleIdType: 'Bike' })
    })

    it('standard aggregation with population on nested document', () => {
      const explain = Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.assemblies.part')._explain()
      assert.strictEqual(explain[1][0], 'aggregate')
      assert.strictEqual(explain[1][1], 'Assembly')
    })
  })
})
