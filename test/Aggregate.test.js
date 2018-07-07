require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

const Car = mongoose.model('Car')
const Bike = mongoose.model('Bike')
const Rider = mongoose.model('Rider')
const Rating = mongoose.model('Rating')
const Assembly = mongoose.model('Assembly')
const Part = mongoose.model('Part')

describe("proper aggregate pipeline for fetching data", () => {
  beforeEach(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  describe("setup schema and documents", () => {
    it("create persisted objects with hasOne relation and can be found through aggregation", async () => {
      const _id1 = ObjectId()
      const _id2 = ObjectId()
      const car1 = await new Car({
        _id: _id1
      }).save()
      const bike1 = await new Bike({
        _id: _id1
      }).save()
      const car2 = await new Car({
        _id: _id2
      })
      const bike2 = await new Bike({
        _id: _id2
      }).save()
      const rider1 = await new Rider({
        bike: bike1
      }).save()
      const rider2 = await new Rider({
        bike: bike2
      }).save()
      const car1Rating = await new Rating({
        vehicle: car1
      }).save()
      const bike1Rating = await new Rating({
        vehicle: bike1
      }).save()
      const car2Rating = await new Rating({
        vehicle: car2
      }).save()
      const bike2Rating = await new Rating({
        vehicle: bike2
      }).save()

      const results = await Rating.aggregate([{
        $match: {
          vehicleIdType: 'Bike' // limit through polymorphic association on single type
        }
      },{
        $lookup: {
          from: 'bikes',
          'let': { localField: '$vehicleId' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$_id'] }
            }
          }],
          as: 'vehicle'
        }
      }, {
        $unwind: '$vehicle'
      }, {
        $match: {
          'vehicle._id': rider1.bikeId
        }
      }])

      assert.strictEqual(results.length, 1)
      assert.isOk(results[0].vehicle)

      const resultsDeep = await Rating.aggregate([{
        $match: {
          vehicleIdType: 'Bike'
        }
      },{
        $lookup: {
          from: 'bikes',
          'let': { localField: '$vehicleId' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$_id'] }
            }
          }],
          as: 'vehicle'
        }
      }, {
        $unwind: '$vehicle'
      }, {
        $lookup: {
          from: 'riders',
          'let': { localField: '$vehicle._id'},
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$bikeId'] }
            }
          }],
          as: 'vehicle.rider'
        }
      }, {
        $unwind: '$vehicle.rider'
      }])

      assert.strictEqual(resultsDeep.length, 2)
      for(let i = 0; i < resultsDeep.length; i++) {
        const result = resultsDeep[i]
        assert.isOk(result.vehicle, 'fetched vehicle')
        assert.isOk(result.vehicle.rider, 'fetched vehicle rider')
      }
    })

    it('create persisted objects with hasMany relation and can be found through aggregation', async () => {
      const _id1 = ObjectId()
      const _id2 = ObjectId()
      const car1 = await new Car({
        _id: _id1
      }).save()
      const bike1 = await new Bike({
        _id: _id1
      }).save()
      const car2 = await new Car({
        _id: _id2
      }).save()
      const bike2 = await new Bike({
        _id: _id2
      }).save()
      const part1 = await new Part({
        _id: _id1
      }).save()
      const part2 = await new Part({
        _id: _id2
      }).save()
      const car1Part1Assembly = await new Assembly({
        vehicle: car1,
        part: part1
      }).save()
      const car1Part2Assembly = await new Assembly({
        vehicle: car1,
        part: part2
      }).save()
      const car2Part1Assembly = await new Assembly({
        vehicle: car2,
        part: part1
      }).save()
      const car2Part2Assembly = await new Assembly({
        vehicle: car2,
        part: part2
      }).save()
      const bike1Part1Assembly = await new Assembly({
        vehicle: bike1,
        part: part1
      }).save()
      const bike1Part2Assembly = await new Assembly({
        vehicle: bike1,
        part: part2
      }).save()
      const bike2Part1Assembly = await new Assembly({
        vehicle: bike2,
        part: part1
      }).save()
      const bike2Part2Assembly = await new Assembly({
        vehicle: bike2,
        part: part2
      }).save()

      const result = await Part.aggregate([{
        $lookup: {
          from: 'assemblies',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              vehicleIdType: 'Bike',
              $expr: { $eq: ['$$localField', '$partId'] }
            }
          }],
          as: 'assemblies'
        }
      }])

      assert.strictEqual(result.length, 2)

      const resultsDeep = await Part.aggregate([{
        $lookup: {
          from: 'assemblies',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              vehicleIdType: 'Bike',
              $expr: { $eq: ['$$localField', '$partId'] }
            }
          }],
          as: 'assemblies'
        }
      }, {
        $unwind: '$assemblies'
      }])
    })
  })
})
