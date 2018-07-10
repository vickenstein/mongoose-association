require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

const testSchema = new mongoose.Schema
const Rider = mongoose.model('Rider')
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

async function setupData() {
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = await new Bike({ _id: ObjectIds[i] }).save()
    bikes.push(bike)
    const car = await new Car({ _id: ObjectIds[i] }).save()
    cars.push(car)
    const rider = await new Rider({ _id: ObjectIds[i], bike: bikes[i] }).save()
    riders.push(rider)
    const rating = await new Rating({ _id: ObjectIds[i], vehicle: bikes[i] }).save()
    ratings.push(rating)
    const carRating = await new Rating({ vehicle: cars[i] }).save()
    carRatings.push(carRating)
  }
}

describe("Some shared functionality of the has reference", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe('#findFor()', () => {
    it('get the associated belongsTo object', async () => {
      // bike <- rider
      const foundBike = await Bike.findOne({ _id: ObjectIds[0] })
      const bikeRider = await foundBike.rider

      assert.isOk(bikeRider)
      assert.strictEqual(bikeRider._id.toString(), riders[0]._id.toString())
    })

    it('get the associated polymorphic object', async () => {
      // car <- rating
      const foundCar = await Car.findOne({ _id: ObjectIds[0] })
      const carRating = await foundCar.rating

      assert.isOk(carRating)
      assert.strictEqual(carRating._id.toString(), carRatings[0]._id.toString())
    })

    it('get the associated object through a polymorphic relationship', async () => {
      // rating => bike <- rider
      const rating = await Rating.findOne({ _id: ObjectIds[0] })
      const rider = await rating.rider
      assert.isOk(rider)
      assert.strictEqual(rider.constructor.modelName, 'Rider')
      assert.strictEqual(rider._id.toString(), riders[0]._id.toString())
    })

    it('get the associated object through a polymorphic relationship', async () => {
      // rider -> bike <= rating
      const rider = await Rider.findOne({ _id: ObjectIds[0] })
      const riderRating = await rider.rating
      assert.isOk(riderRating)
      assert.strictEqual(riderRating.constructor.modelName, 'Rating')
    })
  })

  describe("findManyFor()", () => {
    it('get the associated hasOne through aggregation', async () => {
      const hasOne = Rider.associate('rating')
      const aggregate = hasOne.findFor(riders)
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
    })
  })

  describe("#aggregate()", () => {
    it('get the associated hasOne using aggregation', async () => {
      const hasOne = Bike.associate('rider')
      const aggregate = hasOne.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
    })

    it('get the associated hasOne using aggregation', async () => {
      const hasOne = Bike.associate('rider')
      const aggregate = hasOne.aggregate({ documents: bikes[0] })
      const results = await aggregate
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0]._id.toString(), bikes[0]._id.toString())
    })

    it('get the associated polymorphic using aggregation', async () => {
      const hasOne = Bike.associate('rating')
      const aggregate = hasOne.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
    })

    it('get the associated polymorphic using aggregation', async () => {
      const hasOne = Bike.associate('rating')
      const aggregate = hasOne.aggregate({ documents: bikes[0] })
      const results = await aggregate
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0]._id.toString(), bikes[0]._id.toString())
    })

    it('get the associated hasOne through aggregation', async () => {
      const hasOne = Rider.associate('rating')
      const aggregate = hasOne.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
      assert.isOk(results[0].rating)
    })

    it('get the associated hasOne through aggregation', async () => {
      const hasOne = Rider.associate('rating')
      const aggregate = hasOne.aggregate({ documents: riders[0] })
      const results = await aggregate
      assert.strictEqual(results.length, 1)
      const mongooseRequestCount = mongoose.requestCount
      const rating = await results[0].rating
      assert.isOk(rating._id.toString(), ratings[0]._id.toString())
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
