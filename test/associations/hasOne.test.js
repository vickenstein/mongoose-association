require('test/specHelper')
const { assert } = require('chai')
const _ = require('lodash')
const mongoose = require('mongoose')
const drop = require('test/helpers/drop')

const Rating = mongoose.model('Rating')
const Alien = mongoose.model('Alien')
const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Rider = mongoose.model('Rider')
const Helmet = mongoose.model('Helmet')
const Settings = mongoose.model('Settings')

describe("assign association class", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })
  describe("#associations", () => {
    it('create an association record on the model', () => {
      // console.log(_.get(Alien, 'schema.associations.hasOne.indexedByForeignKey'))
      // assert.isOk(_.get(Alien, 'schema.associations.hasOne.indexedByForeignKey.alientId'), 'auto generate correct foreignField')
      // assert.strictEqual(_.get(Alien, 'schema.associations.hasOne.indexedByForeignKey.alientId').localField, 'alien', 'auto generate correct virtual localField')
    })
  })
  describe("#hasOne", () => {
    it('create and fetch has one association model', async () => {
      const bike = await new Bike().save()
      const rider = await new Rider({
        bike
      }).save()
      const bikeRider = await bike.rider
      assert.strictEqual(bikeRider._id.toString(), rider._id.toString())
    })

    it('create and fetch has one association model on polymorphic type', async () => {
      const bike = await new Bike().save()
      const rating = await new Rating({
        vehicle: bike
      }).save()
      const bikeRating = await bike.rating
      assert.strictEqual(bikeRating._id.toString(), rating._id.toString())
    })

    it('create and fetch hasOne association model on multiple types', async () => {
      const settings = await new Settings().save()
      const bike = await new Bike({
        settings
      }).save()
      const vehicle = await settings.vehicle
      assert.strictEqual(vehicle._id.toString(), bike._id.toString())
    })

    it('create and fetch hasOne association model on multiple types that are polymorphic', async () => {
      const settings = await new Settings().save()
      const car = await new Car({
        solutions: settings
      }).save()
      const solutionVehicle = await settings.solutionVehicle
      assert.strictEqual(solutionVehicle._id.toString(), car._id.toString())
    })

    it('create and fetch hasOne through association model', async () => {
      const bike = await new Bike().save()
      const helmet = await new Helmet().save()
      const rider = await new Rider({
        bike,
        helmet
      }).save()
      const bikeHelmet = await bike.helmet
      assert.strictEqual(bikeHelmet._id.toString(), helmet._id.toString())
    })
  })
})
