require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const BelongsTo = require('src/associations/BelongsTo')
const drop = require('test/helpers/drop')

const testSchema = new mongoose.Schema
const Rider = mongoose.model('Rider')
const Bike = mongoose.model('Bike')

describe("Create an belongsTo association", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  describe("#constructor()", () => {
    it('creates error when missing parameter', () => {
      assert.throws(() => { new BelongsTo({}), testSchema }, "Can\'t create a belongsTo association without specifying a foreignModelName", 'missing property')
    })

    it('creates the proper foreignModelName', () => {
      const belongsTo = new BelongsTo({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(belongsTo.foreignModelName, 'Rider')
    })
  })

  describe("get #localField", () => {
    it('get the property where the reference id is stored', () => {
      const belongsTo = new BelongsTo({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(belongsTo.localField, 'riderId')
    })

    it('get the property where the reference id is stored with custom as', () => {
      const belongsTo = new BelongsTo({ foreignModelName: 'Rider', as: 'roughRider' }, testSchema)
      assert.strictEqual(belongsTo.localField, 'roughRiderId')
    })

    it('get the property where the reference id is stored with custom localField', () => {
      const belongsTo = new BelongsTo({ foreignModelName: 'Rider', localField: 'rough_rider_id' }, testSchema)
      assert.strictEqual(belongsTo.localField, 'rough_rider_id')
    })

    it('get the property where the reference id is stored with custom as and localField', () => {
      const belongsTo = new BelongsTo({ foreignModelName: 'Rider', as: 'roughRider', localField: 'rough_rider_id' }, testSchema)
      assert.strictEqual(belongsTo.localField, 'rough_rider_id')
    })
  })

  describe("#findFor()", () => {
    it('get the belongsTo association for a document', async () => {
      const bike = await new Bike().save()
      await new Rider({
        bike
      }).save()

      const rider = await Rider.findOne()
      const riderBike = await rider.bike
      assert.isOk(riderBike, 'found the associated bike')
      assert.strictEqual(riderBike._id.toString(), bike._id.toString())
    })
  })
})
