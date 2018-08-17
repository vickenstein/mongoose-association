require('./specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = mongoose.Types.ObjectId
const drop = require('./helpers/drop')

const Rider = mongoose.model('Rider')
const Bike = mongoose.model('Bike')

const BIKECOUNT = 5

const ObjectIds = []
for(let i = 0; i < BIKECOUNT; i++) {
  ObjectIds.push(ObjectId())
}
const colors = ['red', 'red', 'red', 'blue', 'blue']
const bikes = []
const riders = []

async function setupData() {
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = await new Bike({
      _id: ObjectIds[i],
      color: colors[i]
    }).save()
    bikes.push(bike)
    const rider = await new Rider({
      _id: ObjectIds[i],
      bike: bikes[i],
      age: 15 + i
    }).save()
    riders.push(rider)
  }
}

describe("assign association class", () => {

  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe("#remove()", () => {
    it('should be able to delete a bike', async () => {
      await bikes[0].delete(riders[0])
      assert.strictEqual(bikes[0].deletedById.toString(), riders[0].id.toString())
      assert.isOk(bikes[0].deletedAt)
      const deletedBy = await bikes[0].deletedBy
      assert.strictEqual(deletedBy.id.toString(), riders[0].id.toString())
      const sameBikes = await Bike.find()
      assert.strictEqual(sameBikes.length, BIKECOUNT - 1)

      const sameBikesViaAggregate = await Bike.associate('rider').aggregate()
      assert.strictEqual(sameBikesViaAggregate.length, BIKECOUNT - 1)

      const sameRidersWithPopulate = await Rider.associate('bike').aggregate({ preserveNullAndEmptyArrays: true })
      assert.strictEqual(sameRidersWithPopulate.length, BIKECOUNT)
      assert.isOk(sameRidersWithPopulate[1]._bike)
      assert.notOk(sameRidersWithPopulate[0]._bike)
    })
    it('should return all bike with deleted', async () => {
      const sameBikes = await Bike.find().withDeleted()
      assert.strictEqual(sameBikes.length, BIKECOUNT)
    })
  })

  describe("#restore()", () => {
    it('should be able to delete a bike', async () => {
      await bikes[0].restore()
      assert.notOk(bikes[0].deletedAt)
      const deletedBy = await bikes[0].deletedBy
      assert.notOk(deletedBy)
      const sameBikes = await Bike.find()
      assert.strictEqual(sameBikes.length, BIKECOUNT)

      const sameBikesViaAggregate = await Bike.associate('rider').aggregate()
      assert.strictEqual(sameBikesViaAggregate.length, BIKECOUNT)

      const sameRidersWithPopulate = await Rider.associate('bike').aggregate({ preserveNullAndEmptyArrays: true })
      assert.strictEqual(sameRidersWithPopulate.length, BIKECOUNT)
      assert.isOk(sameRidersWithPopulate[1]._bike)
      assert.isOk(sameRidersWithPopulate[0]._bike)
    })
  })
})
