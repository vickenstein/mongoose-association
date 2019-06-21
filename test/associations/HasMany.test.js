require('../specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { HasMany } = require('../../dist/associations/HasMany')
const { Collection } = require('../../dist/Collection')
const drop = require('../helpers/drop')

const testSchema = new mongoose.Schema
const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Assembly = mongoose.model('Assembly')
const Part = mongoose.model('Part')
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

describe("Some shared functionality of the has reference", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe('#findFor()', () => {
    it('get the associated belongsTo objects', async () => {
      const part = await Part.findOne({ _id: parts[0]._id })
      const assemblies = await part.assemblies
      assert.isOk(assemblies)
      assert.isOk(assemblies instanceof Collection)
      assert.strictEqual(assemblies.length, PARTPERBIKE * 2)
    })

    it('get the associated polymorphic objects', async () => {
      const bike = await Bike.findOne({ _id: ObjectIds[0] })
      const assemblies = await bike.assemblies
      assert.isOk(assemblies)
      assert.isOk(assemblies instanceof Collection)
      assert.strictEqual(assemblies.length, PARTPERBIKE)
    })

    it('get the associated object through', async () => {
      const part = await Part.findOne({ _id: parts[0]._id })
      const bikes = await part.bikes
      assert.isOk(bikes)
      assert.isOk(bikes instanceof Collection)
      assert.strictEqual(bikes.length, PARTPERBIKE)
    })

    it('get the associated object through', async () => {
      const bike = await Bike.findOne({ _id: bikes[0]._id })
      const parts = await bike.components
      assert.isOk(parts)
      assert.isOk(parts instanceof Collection)
      assert.strictEqual(parts.length, PARTPERBIKE)
    })

    it('get the associated nested objects', async () => {
      const bike = await Bike.findOne({ _id: bikes[0]._id })
      const licenses = await bike.licenses
      assert.isOk(licenses)
      assert.isOk(licenses instanceof Collection)
      assert.strictEqual(licenses.length, 2)
    })
  })

  describe("findManyFor()", () => {
    it ('get the associate hasMany', async () => {
      const hasMany = Bike.associate('assemblies')
      const aggregate = await hasMany.findManyFor(bikes)
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT * PARTPERBIKE)
    })
    it ('get the associate hasMany through and invert result', async () => {
      const hasMany = Bike.associate('components')
      const aggregate = hasMany.findManyFor(bikes)
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT * PARTPERBIKE)
      assert.strictEqual(results[0].constructor, Part)
    })
    it('get the associated nested hasMany', async () => {
      const hasMany = Bike.associate('licenses')
      const licenses = await hasMany.findManyFor(bikes)
      assert.strictEqual(licenses.length, PARTCOUNT)
    })
  })

  describe("#aggregate()", () => {
    it('get the associated belongsTo using aggregation', async () => {
      const hasMany = Part.associate('assemblies')
      const aggregate = hasMany.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, PARTCOUNT)
      const mongooseRequestCount = mongoose.requestCount
      const assemblies = await results[0].assemblies
      assert.strictEqual(assemblies.length, PARTPERBIKE * 2)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated polymorphic using aggregation', async () => {
      const hasMany = Bike.associate('assemblies')
      const aggregate = hasMany.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
      const mongooseRequestCount = mongoose.requestCount
      const assemblies = await results[0].assemblies
      assert.strictEqual(assemblies.length, PARTPERBIKE)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated through using aggregation', async () => {
      const hasMany = Bike.associate('components')
      const aggregate = hasMany.aggregate()
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
      const mongooseRequestCount = mongoose.requestCount
      const components = await results[0].components
      assert.strictEqual(components.length, PARTPERBIKE)
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })

    it('get the associated hasOne through aggregation', async () => {
      const hasMany = Bike.associate('components')
      const aggregate = hasMany.aggregate({ documents: bikes })
      const results = await aggregate
      assert.strictEqual(results.length, BIKECOUNT)
      assert.strictEqual(results[0].constructor, Bike)
    })
  })
})
