require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const HasMany = require('src/associations/HasMany')
const drop = require('test/helpers/drop')

const testSchema = new mongoose.Schema
const Car = mongoose.model('Car')
const Assembly = mongoose.model('Assembly')
const Part = mongoose.model('Assembly')

// const CARCOUNT = 5
// const ObjectIds = []
// for(let i = 0; i < CARCOUNT; i++) {
//   ObjectIds.push()
// }


describe("Some shared functionality of the has reference", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  describe('setup', () => {

  })

  describe('#findFor()', () => {
    it('get the associated belongsTo object', async () => {
      // bike <- rider
      for()
      const bike = await new Bike().save()
      const rider = await new Rider({
        bike
      }).save()

      const foundBike = await Bike.findOne()
      const bikeRider = await foundBike.rider

      assert.isOk(bikeRider)
      assert.strictEqual(bikeRider._id.toString(), rider._id.toString())
    })

    it('get the associated polymorphic object', async () => {
      // car <- rating
      const car = await new Car().save()
      const rating = await new Rating({
        vehicle: car
      }).save()

      const foundCar = await Car.findOne()
      const carRating = await foundCar.rating

      assert.isOk(carRating)
      assert.strictEqual(carRating._id.toString(), rating._id.toString())
    })

    it('get the associated object through a polymorphic relationship', async () => {
      // rating => bike <- rider
      const bike = await Bike.findOne()
      const rating = await new Rating({
        vehicle: bike
      }).save()

      const rider = await rating.rider
      assert.isOk(rider)
      assert.strictEqual(rider.constructor.modelName, 'Rider')
    })

    it('get the associated object through a polymorphic relationship', async () => {
      // rider -> bike <= rating
      const bike = await Bike.findOne()
      const rating = await bike.rating
      const rider = await bike.rider
      const riderRating = await rider.rating
      assert.isOk(riderRating)
      assert.strictEqual(riderRating.constructor.modelName, 'Rating')
    })
  })
})
