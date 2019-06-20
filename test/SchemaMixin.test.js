require('./specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = mongoose.Types.ObjectId
const drop = require('./helpers/drop')

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

  describe("#associate()", () => {
    it('find already defined associations', () => {
      const testSchema = new Schema()
      assert.throws(() => { testSchema.associate('test', 'test') }, 'this schema does not have any associations')
      assert.isOk(Bike.associate('rider'))
      assert.isNotOk(Bike.associate('surfer'))
    })
  })

  describe("static #assign()", () => {
    it('resulting class has methods of mongoose association', () => {
      const testSchema = new Schema()
      assert.isOk(testSchema.belongsTo)
      assert.isOk(testSchema.hasOne)
      assert.isOk(testSchema.hasMany)
      assert.isOk(testSchema.polymorphic)
    })
  })

  describe("#fetch() #unset()", () => {
    it('return the query / aggregation for an association', async () => {
      const bike = await Bike.findOne().populateAssociation('rider')
      let mongooseRequestCount = mongoose.requestCount
      let rider = await bike.fetch('rider')
      assert.isOk(rider)
      assert.notEqual(mongooseRequestCount, mongoose.requestCount)
      mongooseRequestCount = mongoose.requestCount
      rider = await bike.rider
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      rider = await bike.unset().rider
      assert.notEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })

  describe("#fetch() #unset()", () => {
    it('return the query / aggregation for an association', async () => {
      const bike = await Bike.findOne().populateAssociation('rider')
      let mongooseRequestCount = mongoose.requestCount
      let rider = await bike.fetchRider()
      assert.isOk(rider)
      assert.notEqual(mongooseRequestCount, mongoose.requestCount)
      mongooseRequestCount = mongoose.requestCount
      rider = await bike.rider
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      rider = await bike.unsetRider().rider
      assert.notEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
