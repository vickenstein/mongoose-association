require('test/specHelper')
const { assert } = require('chai')
const _ = require('lodash')
const mongoose = require('mongoose')
const drop = require('test/helpers/drop')

const Rider = mongoose.model('Rider')
const Bike = mongoose.model('Bike')

const Registration = mongoose.model('Registration')
const Alien = mongoose.model('Alien')

describe("assign association class", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })
  describe("#associations", () => {
    it('create an association record on the model', () => {
      assert.isOk(_.get(Rider, 'schema.associations.belongsTo.indexedByForeignKey.bikeId'), 'auto generate correct foreignField')
      assert.strictEqual(_.get(Rider, 'schema.associations.belongsTo.indexedByForeignKey.bikeId').localField, 'bike', 'auto generate correct virtual localField')
      assert.isOk(_.get(Registration, 'schema.associations.belongsTo.indexedByForeignKey.approver_id'), 'manually defined correct foreignField')
      assert.strictEqual(_.get(Registration, 'schema.associations.belongsTo.indexedByForeignKey.approver_id').localField, 'approver', 'manually defined correct virtual localField')
    })
  })

  describe("#belongsTo", () => {
    it('create a mongoose object with objectId as association', async () => {
      const bike = await new Bike().save()
      const rider = await new Rider({
        bikeId: bike._id,
      }).save()
      assert.strictEqual(rider.bikeId, bike._id)
    })

    it('create a mongoose object with objectId as association with custom defined foreignField', async () => {
      const alien = await new Alien().save()
      const registration = await new Registration({
        approver_id: alien._id
      }).save()
      assert.strictEqual(registration.approver_id, alien._id)
    })

    it('create a mongoose object with object as association', async () => {
      const bike = await new Bike().save()
      const rider = await new Rider({
        bikeId: bike,
      }).save()
      assert.strictEqual(rider.bikeId, bike._id)
    })

    it('create a mongoose object with object as association with custom defined foreignField', async () => {
      const alien = await new Alien().save()
      const registration = await new Registration({
        approver_id: alien
      }).save()
      assert.strictEqual(registration.approver_id, alien._id)
    })

    it('create a mongoose object with object on localField as association', async () => {
      const bike = await new Bike().save()
      const rider = await new Rider({
        bike,
      }).save()
      assert.strictEqual(rider.bikeId, bike._id)
    })

    it('create a mongoose object with object on localField as association with custom defined foreignField', async () => {
      const alien = await new Alien().save()
      const registration = await new Registration({
        approver: alien
      }).save()
      assert.strictEqual(registration.approver_id, alien._id)
    })

    it('fetch the association object when requesting by localField', async () => {
      const rider = await Rider.findOne()
      const bike = await rider.bike
      assert.isOk(bike, 'fetch a bike')
      const registration = await Registration.findOne()
      const approver = await registration.approver
      assert.isOk(approver, 'fetch an alien who is the approver')
    })

    it('fetch single association via populate to cache request', async () => {
      const rider = await Rider.findOne().populateAssociation('bike')
      const mongooseRequestCount = mongoose.requestCount
      const bike = await rider.bike
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('fetch multiple association via populate to cache request', async () => {
      const riders = await Rider.find().populateAssociation('bike')
      const mongooseRequestCount = mongoose.requestCount
      const bike = await riders[0].bike
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
