require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const Polymorphic = require('src/associations/Polymorphic')
const drop = require('test/helpers/drop')

const testSchema = new mongoose.Schema
const Bike = mongoose.model('Bike')
const Rating = mongoose.model('Rating')
const Car = mongoose.model('Car')

const BIKECOUNT = 5

let ratings = []
let bikes = []
let car
async function setupData() {

  car = await new Car().save()

  const bikeAttributes = []

  for(let i = 0; i < BIKECOUNT; i++) {
    bikeAttributes.push({})
  }

  bikes = await Bike.create(bikeAttributes)

  const ratingAttributes = []
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = bikes[i]
    ratingAttributes.push({
      vehicle: bike
    })
  }

  ratings = await Rating.create(ratingAttributes)
  return true
}

describe("Create an polymorphic association", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe("#constructor()", () => {
    it('creates error when missing foreignModelNames parameter', () => {
      assert.throws(() => { new Polymorphic({}, testSchema) }, "Can\'t create a polymorphic association without specifying any foreignModelName", 'missing property')
    })

    it('creates error when missing as parameter', () => {
      assert.throws(() => { new Polymorphic({ foreignModelNames: ['Car', 'Bike'] }, testSchema) }, "Can\'t create a polymorphic association without \'as\' parameter", 'missing property')
    })

    it('creates the proper foreignModelNames and as', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle' }, testSchema)
      assert.sameMembers(polymorphic.foreignModelNames, ['Car', 'Bike'])
      assert.strictEqual(polymorphic.as, 'vehicle')
    })
  })

  describe("get #localField", () => {
    it('get the property where the reference id is stored', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle' }, testSchema)
      assert.strictEqual(polymorphic.localField, 'vehicleId')
    })

    it('get the property where the reference id is stored with custom localField', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle', localField: 'vehicle_id' }, testSchema)
      assert.strictEqual(polymorphic.localField, 'vehicle_id')
    })
  })

  describe("get #typeField", () => {
    it('get the property where the reference id is stored', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle' }, testSchema)
      assert.strictEqual(polymorphic.typeField, 'vehicleIdType')
    })

    it('get the property where the reference id is stored with custom localField', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle', localField: 'vehicle_id' }, testSchema)
      assert.strictEqual(polymorphic.typeField, 'vehicle_idType')
    })

    it('get the property where the reference id is stored with custom localField and typeField', () => {
      const polymorphic = new Polymorphic({ foreignModelNames: ['Car', 'Bike'], as: 'vehicle', localField: 'vehicle_id', typeField: 'vehicle_id_type' }, testSchema)
      assert.strictEqual(polymorphic.typeField, 'vehicle_id_type')
    })
  })

  describe("#findFor()", () => {
    it('get the associated object', async () => {
      const rating = await Rating.findOne({ _id: ratings[0]._id })
      const ratingBike = await rating.vehicle

      assert.isOk(ratingBike)
      assert.strictEqual(ratingBike._id.toString(), bikes[0]._id.toString())
    })
  })

  describe("#findManyFor()", () => {
    it('get the associated object', async () => {
      const polymorphic = Rating.associate('vehicle')
      const ratedBikes = await polymorphic.findManyFor(ratings)
      assert.isOk(ratedBikes)
      assert.strictEqual(ratedBikes.length, BIKECOUNT)
    })
  })

  describe("set polymorphic", () => {
     it('set the polymorphic to another record', async () => {
      const rating = await Rating.findOne({ _id: ratings[0]._id })
      rating.vehicle = car
      await rating.save()
      const sameRating = await Rating.findOne({ _id: ratings[0]._id })
      const vehicle = await sameRating.vehicle
      assert.strictEqual(vehicle._id.toString(), car._id.toString())
      sameRating.vehicle = bikes[0]
      await sameRating.save()
    })
  })

  describe("#aggregate()", () => {
    it('get an error creating polymorphic aggregate without documents or option { as }', async () => {
      const polymorphic = Rating.associate('vehicle')
      assert.throws(() => { polymorphic.aggregate() }, 'polymorphic aggregation requires an documents or option { as }')
    })
  })


  describe("#aggregate()", () => {
    it('get the associated polymorphic using aggregation', async () => {
      const polymorphic = Rating.associate('vehicle')
      const aggregate = polymorphic.aggregate({ as: 'Bike' })
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
    })
  })

  describe("#aggregate()", () => {
    it('get the associated polymorphic using aggregation', async () => {
      const polymorphic = Rating.associate('vehicle')
      const aggregate = polymorphic.aggregate({ documents: ratings[0] })
      const results = await aggregate
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0]._id.toString(), ratings[0]._id.toString())
    })
  })
})
