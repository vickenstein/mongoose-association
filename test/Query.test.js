require('./specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const drop = require('./helpers/drop')

const Rider = mongoose.model('Rider')
const Helmet = mongoose.model('Helmet')
const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Rating = mongoose.model('Rating')
const Part = mongoose.model('Part')
const Assembly = mongoose.model('Assembly')
const License = mongoose.model('License')

const BIKECOUNT = 5
const PARTCOUNT = 5
const PARTPERBIKE = 2
const ObjectIds = []
for(let i = 0; i < BIKECOUNT; i++) {
  ObjectIds.push(ObjectId())
}
const bikes = []
const cars = []
const ratings = []
const carRatings = []
const riders = []
const helmets = []
const parts = []
const bikeAssemblies = []
const carAssemblies = []
const licenses = []

async function setupData() {
  for(let i = 0; i < PARTCOUNT; i++) {
    const part = await new Part().save()
    parts.push(part)
    const license = await new License().save()
    licenses.push(license)
  }
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = await new Bike({
      _id: ObjectIds[i],
      licenses: [licenses[i], licenses[(i + 2) % PARTCOUNT]]
    }).save()
    bikes.push(bike)
    const car = await new Car({ _id: ObjectIds[i] }).save()
    cars.push(car)
    const helmet = await new Helmet().save()
    helmets.push(helmet)
    const rider = await new Rider({ _id: ObjectIds[i], bike: bikes[i], helmet: helmets[i] }).save()
    riders.push(rider)
    const rating = await new Rating({ _id: ObjectIds[i], vehicle: bikes[i] }).save()
    ratings.push(rating)
    const carRating = await new Rating({ vehicle: cars[i] }).save()
    carRatings.push(carRating)
    for(let j = 0; j < PARTPERBIKE; j++) {
      const part = parts[(i * PARTPERBIKE + j) % PARTCOUNT]
      const bikeAssembly = await new Assembly({
        part,
        vehicle: bike
      }).save()
      bikeAssemblies.push(bikeAssembly)
      const carAssembly = await new Assembly({
        part,
        vehicle: car
      }).save()
      carAssemblies.push(carAssembly)
    }
  }
}

describe("mongose standard queries, find, findOne with population", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe('#findOne()', () => {
    it('get the associated nested hasMany objects', async () => {
      const result = await Bike.findOne({ _id: bikes[0]._id }).populateAssociation('licenses')
      assert.strictEqual(result.constructor, Bike)
      let mongooseRequestCount = mongoose.requestCount
      const licenses = await result.licenses
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
    it('get the associated nested hasMany objects through another model', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('bike.licenses')
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const licenses = await bike.licenses
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
    it('get the associated belongsTo object', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const helmet = await result.helmet
      const bike = await result.bike
      assert.strictEqual(helmet.constructor, Helmet)
      assert.strictEqual(bike.constructor, Bike)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated belongsTo, and hasOne object with nested population', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.rating')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const rating = await bike.rating
      assert.strictEqual(rating.constructor, Rating)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated belongsTo, and hasMany object with nested population', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.assemblies')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const assemblies = await bike.assemblies
      assert.strictEqual(assemblies[0].constructor, Assembly)
      assert.strictEqual(assemblies.length, PARTPERBIKE)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated belongsTo, and hasOne through hasMany object with nested population', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.assemblies.part')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const assemblies = await bike.assemblies
      const part = await assemblies[0].part
      assert.strictEqual(part.constructor, Part)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated belongsTo, and hasMany through object with nested population', async () => {
      const result = await Rider.findOne({ _id: riders[0]._id }).populateAssociation('helmet', 'bike.components')
      assert.strictEqual(result.constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const bike = await result.bike
      const components = await bike.components
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated hasMany through with an single association population', async () => {
      const result = await Part.findOne({ _id: parts[0]._id }).populateAssociation('bikes')
      assert.strictEqual(result.constructor, Part)
      let mongooseRequestCount = mongoose.requestCount
      const bikes = await result.bikes
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
    it('get the associated hasMany through with an single association population', async () => {
      const result = await Part.findOne({ _id: parts[0]._id }).populateAssociation('bikes.rider.helmet')
      assert.strictEqual(result.constructor, Part)
      let mongooseRequestCount = mongoose.requestCount
      const bikes = await result.bikes
      const rider = await bikes[0].rider
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
    it('get the associated belongsTo association with multi part match query', async () => {
      const result = await Rider.findOne({
        _id: riders[0].id,
        bikeId: bikes[0].id
      }).populateAssociation('bike')
      assert.isOk(result)
      assert.strictEqual(result.id.toString(), riders[0].id.toString())
    })
  })

  describe('#find', () => {
    it('get the associated belongsTo association with $or query', async () => {
      const result = await Rider.find({
        $or: [
          {
            _id: riders[0].id
          },
          {
            bikeId: bikes[0].id
          }
        ]
      }).populateAssociation('bike')
      assert.isOk(result)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].$bike.id.toString(), bikes[0].id.toString())
    })
  })

  describe('#aggregate()', () => {
    it('aggregate with old school syntax', (next) => {
      Rider.aggregate([{ $match: { age: 5 } }]).exec((error, data) => {
        if (data) next()
      })
    })
    it('get the associated belongsTo through aggregation with association population', async () => {
      const results = await Rider.associate('bike').aggregate().populateAssociation('helmet')
      assert.strictEqual(results.length, riders.length)
      assert.strictEqual(results[0].constructor, Rider)
      let mongooseRequestCount = mongoose.requestCount
      const helmet = await results[0].helmet
      const bike = await results[0].bike
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
