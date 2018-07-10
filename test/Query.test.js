require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

const Rider = mongoose.model('Rider')
const Helmet = mongoose.model('Helmet')
const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Rating = mongoose.model('Rating')

const BIKECOUNT = 5
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

async function setupData() {
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
  }
}

describe("mongose standard queries, find, findOne with population", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe('#findOne()', () => {
    it('get the associated belongsTo object', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const helmet = await result.helmet
      const bike = await result.bike
      assert.strictEqual(helmet.constructor, Helmet)
      assert.strictEqual(bike.constructor, Bike)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated belongsTo object with nested population', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.rating')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const rating = await bike.rating
      assert.strictEqual(rating.constructor, Rating)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
