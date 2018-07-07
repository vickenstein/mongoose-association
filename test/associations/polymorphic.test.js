require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const Polymorphic = require('src/associations/Polymorphic')
const drop = require('test/helpers/drop')

const testSchema = new mongoose.Schema
const Rating = mongoose.model('Rating')
const Bike = mongoose.model('Bike')

describe("Create an polymorphic association", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
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
      const bike = await new Bike().save()
      await new Rating({
        vehicle: bike
      }).save()

      const rating = await Rating.findOne()
      const ratingBike = await rating.vehicle

      assert.isOk(ratingBike)
      assert.strictEqual(ratingBike._id.toString(), bike._id.toString())
    })
  })
})
