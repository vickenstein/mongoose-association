require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

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

  describe("#where()", () => {
    it('standard aggregate with match on lookup', async () => {
      const redResult = await Rider.associate('bike').aggregate().where({
        bike: {
          color: 'red'
        }
      })
      assert.strictEqual(redResult.length, 3)
      const blueResult = await Rider.associate('bike').aggregate().where({
        bike: {
          color: 'blue'
        }
      })
      assert.strictEqual(blueResult.length, 2)
    })
    it('standard aggregate with match on root without previous match', async () => {
      const under16RidersWithRedBike = await Rider.associate('bike').aggregate().where({
        rider: {
          age: {
            $lte: 16
          }
        },
        bike: {
          color: 'red'
        }
      })
      assert.strictEqual(under16RidersWithRedBike.length, 2)
    })
  })
})
