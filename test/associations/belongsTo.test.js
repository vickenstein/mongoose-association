require('../specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { BelongsTo } = require('../../dist/associations/BelongsTo')
const drop = require('../helpers/drop')

const testSchema = new mongoose.Schema

const Bike = mongoose.model('Bike')
const Rider = mongoose.model('Rider')

const BIKECOUNT = 5

let riders = []
let bikes = []
async function setupData() {

  const bikeAttributes = []

  for(let i = 0; i < BIKECOUNT; i++) {
    bikeAttributes.push({})
  }

  bikes = await Bike.create(bikeAttributes)

  const riderAttributes = []
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = bikes[i]
    riderAttributes.push({
      bike
    })
  }

  riders = await Rider.create(riderAttributes)
  return true
}

describe("Create an belongsTo association", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
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
      const rider = await Rider.findOne({ _id: riders[0]._id })
      const riderBike = await rider.bike
      assert.isOk(riderBike, 'found the associated bike')
      assert.strictEqual(riderBike._id.toString(), bikes[0]._id.toString())
    })
  })

  describe("findManyFor()", () => {
    it('get the belongsTo association for many documents', async () => {
      const belongsTo = Rider.associate('bike')
      const riderBikes = await belongsTo.findManyFor(riders)
      assert.strictEqual(riderBikes.length, riders.length)
    })
  })

  describe("set belongsTo", () => {
     it('set the belongsTo to another record', async () => {
      const rider = await Rider.findOne({ _id: riders[0]._id })
      rider.bike = bikes[2]
      await rider.save()
      const sameRider = await Rider.findOne({ _id: riders[0]._id })
      const bike = await sameRider.bike
      assert.strictEqual(bike._id.toString(), bikes[2]._id.toString())
      sameRider.bike = bikes[0]
      await sameRider.save()
    })
  })

  describe("#aggregate()", () => {
    it('get the associated belongsTo using aggregation', async () => {
      const belongsTo = Rider.associate('bike')
      const aggregate = belongsTo.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
    })
  })

  describe("#aggregate()", () => {
    it('get the associated belongsTo using aggregation', async () => {
      const belongsTo = Rider.associate('bike')
      const aggregate = belongsTo.aggregate({ documents: riders[0] })
      const results = await aggregate
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0]._id.toString(), riders[0]._id.toString())
    })
  })
})
