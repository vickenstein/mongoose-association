// NODE_PATH=. mocha benchmark/lookupHasMany.js -s 0 --timeout 15000

require('test/specHelper')
const _ = require('lodash')
const drop = require('test/helpers/drop')
const Benchmark = require('benchmark')
const mongoose = require('mongoose')
const Bike = mongoose.model('Bike')
const Rider = mongoose.model('Rider')
const Helmet = mongoose.model('Helmet')

// bike => rider <= helmet

const BIKECOUNT = 100

async function setupData() {

  const bikeAttributes = []
  const helmetAttributes = []

  for(let i = 0; i < BIKECOUNT; i++) {
    bikeAttributes.push({})
    helmetAttributes.push({})
  }

  const bikes = await Bike.create(bikeAttributes)
  const helmets = await Helmet.create(helmetAttributes)


  const riderAttributes = []
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = bikes[i]
    const helmet = helmets[i]
    riderAttributes.push({
      bike,
      helmet
    })
  }

  const riders = await Rider.create(riderAttributes)
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
      const helmets = await Helmet.aggregate([{
        $lookup: {
          from: 'riders',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$helmetId'] }
            }
          }, {
            $lookup: {
              from: 'bikes',
              'let': { localField: '$bikeId' },
              pipeline: [{
                $match: {
                  $expr: { $eq: ['$$localField', '$_id'] }
                }
              }],
              as: 'bike'
            }
          }, {
            $unwind: '$bike'
          }],
          as: 'rider'
        }
      }, {
        $unwind: '$rider'
      }])
    })
  })

  describe('unwinding', () => {
    it('perform aggregate', async () => {
      const helmets = await Helmet.aggregate([{
        $lookup: {
          from: 'riders',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$helmetId'] }
            }
          }],
          as: 'rider'
        }
      }, {
        $unwind: '$rider'
      }, {
        $lookup: {
          from: 'bikes',
          'let': { localField: '$rider.bikeId' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$_id'] }
            }
          }],
          as: 'rider.bike'
        }
      }, {
        $unwind: '$rider.bike'
      }])
    })
  })

  describe('preload with second query', () => {
    it('preload', async () => {
      const helmets = await Helmet.aggregate([{
        $lookup: {
          from: 'riders',
          'let': { localField: '$_id' },
          pipeline: [{
            $match: {
              $expr: { $eq: ['$$localField', '$helmetId'] }
            }
          }],
          as: 'rider'
        }
      }, {
        $unwind: '$rider'
      }])

      const bikeIds = {}

      helmets.forEach(helmet => {
        bikeIds[helmet.rider.bikeId] = true
      })

      const bikes = Bike.find({
        _id: Object.keys(bikeIds)
      })

      const bikesHash = _.keyBy(bikes, '_id')

      helmets.forEach(helmet => {
        helmet.rider.bike = bikesHash[helmet.rider.bikeId]
      })
    })
  })
})
