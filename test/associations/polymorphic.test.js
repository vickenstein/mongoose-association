require('test/specHelper')
const { assert } = require('chai')
const _ = require('lodash')
const mongoose = require('mongoose')
const drop = require('test/helpers/drop')

const Car = mongoose.model('Car')
const Rating = mongoose.model('Rating')
const Bike = mongoose.model('Bike')

describe("assign association class", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })
  describe("#associations", () => {
    it('create an association record on the model', () => {
      assert.isOk(_.get(Rating, 'schema.associations.polymorphic.indexedByForeignKey.vehicleId'), 'auto generate correct foreignField')
      assert.strictEqual(_.get(Rating, 'schema.associations.polymorphic.indexedByForeignKey.vehicleId').localField, 'vehicle', 'auto generate correct virtual localField')
    })
  })
  describe("#polymorphic", () => {
    it('create a mongoose object with Car as association', async () => {
      const car = await new Car().save()
      const rating = await new Rating({
        vehicle: car
      }).save()
      assert.strictEqual(rating.vehicleId, car._id)
      assert.strictEqual(rating.vehicleIdType, 'Car')
    })

    it('create a mongoose object with Bike as association', async () => {
      const bike = await new Bike().save()
      const rating = await new Rating({
        vehicle: bike
      }).save()
      assert.strictEqual(rating.vehicleId, bike._id)
      assert.strictEqual(rating.vehicleIdType, 'Bike')
    })

    it('fetch association through its localField', async () => {
      const rating = await Rating.findOne()
      const vehicle = await rating.vehicle
      assert.isOk(vehicle, 'fetched a vehicle')
      assert.strictEqual(vehicle.constructor.modelName, 'Car')
    })

    it('fetch single association via populate to cache request', async () => {
      const rating = await Rating.findOne().populateAssociation('vehicle')
      const mongooseRequestCount = mongoose.requestCount
      const vehicle = await rating.vehicle
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount, 'no new request to mongo db')
    })

    it('fetch multiple association via populate to cache request', async () => {
      const ratings = await Rating.find().populateAssociation('vehicle')
      const mongooseRequestCount = mongoose.requestCount
      const vehicle = await ratings[0].vehicle
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount, 'no new request to mongo db')
    })
  })
})
