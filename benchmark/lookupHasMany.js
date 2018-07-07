// NODE_PATH=. mocha benchmark/lookupHasMany.js --no-timouts -s 0

require('test/specHelper')
const _ = require('lodash')
const drop = require('test/helpers/drop')
const Benchmark = require('benchmark')
const mongoose = require('mongoose')
const Car = mongoose.model('Car')
const Assembly = mongoose.model('Assembly')
const Part = mongoose.model('Part')

const CARCOUNT = 100
const PARTPERCAR = 2
const PARTCOUNT = 10

async function setupData() {

  const partAttributes = []

  for(let i = 0; i < PARTCOUNT; i++) {
    partAttributes.push({})
  }

  const parts = await Part.create(partAttributes)

  const carAttributes = []
  for(let i = 0; i < CARCOUNT; i++) {
    carAttributes.push({})
  }

  const cars = await Car.create(carAttributes)

  const assemblyAttributes = []
  for(let i = 0; i < PARTPERCAR * CARCOUNT; i++) {
    const car = cars[Math.floor(i / PARTPERCAR)]
    const part = parts[i % PARTCOUNT]
    assemblyAttributes.push({
      vehicle: car,
      part
    })
  }

  const assemblies = await Assembly.create(assemblyAttributes)

  return true
}

describe('benchmarking aggregate lookup speed', () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })
  describe('nested pipeline', () => {
    it('perform aggregation', async () => {
      const parts = await Part.aggregate([{
        $lookup: {
          from: 'assemblies',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              vehicleIdType: 'Car',
              $expr: { $eq: ['$$localField', '$partId'] }
            }
          }, {
            $lookup: {
              from: 'cars',
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
          }],
          as: 'assemblies'
        }
      }])
    })
  })

  describe('unwind and group', () => {
    it('perform aggregation', async () => {
      const parts = await Part.aggregate([{
        $lookup: {
          from: 'assemblies',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              vehicleIdType: 'Car',
              $expr: { $eq: ['$$localField', '$partId'] }
            }
          }],
          as: 'assemblies'
        }
      }, {
        $unwind: {
          path: "$assemblies",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $lookup: {
          from: "cars",
          'let': { localField: '$assemblies.vehicleId' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$_id'] }
            }
          }],
          as: 'assemblies.vehicle'
        }
      }, {
        $unwind: '$assemblies.vehicle'
      }, {
        $group: {
          _id: "$_id",
          assemblies: { $push: "$assemblies" }
        }
      }])
    })
  })

  describe('preload with second query', () => {
    it('preload', async () => {
      const parts = await Part.aggregate([{
        $lookup: {
          from: 'assemblies',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              vehicleIdType: 'Car',
              $expr: { $eq: ['$$localField', '$partId'] }
            }
          }],
          as: 'assemblies'
        }
      }])

      const vehicleIds = {}
      parts.forEach(part => {
        part.assemblies.forEach(assembly => {
          vehicleIds[assembly.vehicleId] = true
        })
      })

      const cars = await Car.find({
        _id: Object.keys(vehicleIds)
      })

      const carsHash = _.keyBy(cars, '_id')

      parts.forEach(part => {
        part.assemblies.forEach(assembly => {
          assembly.vehicle = carsHash[assembly.vehicleId]
        })
      })
    })
  })
})
