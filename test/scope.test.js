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
const Problem = mongoose.model('Problem')

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
const problems = []

async function setupData() {
  for(let i = 0; i < PARTCOUNT; i++) {
    const part = await new Part({
      color: i % 2 ? 'red': 'blue'
    }).save()
    parts.push(part)
    const license = await new License({
      valid: !!(i % 2)
    }).save()
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
  for(let i = 0; i < BIKECOUNT * 2; i++) {
    const problem = await new Problem({
      solved: !!(i % 2),
      car: cars[Math.floor(i / 2)]
    }).save()
    problems.push(problem)
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

  describe('#virtual()', () => {
    it('properly return a scoped hasMany through association', async () => {
      const car = cars[0]
      const redParts = await car.redParts
      assert.strictEqual(redParts.length, 1)
    })
    it('properly return a scoped hasMany association', async () => {
      const car = cars[0]
      const solvedProblems = await car.solvedProblems
      assert.strictEqual(solvedProblems.length, 1)
    })
    it('properly return a scoped nested association', async () => {
      const bike = bikes[0]
      const invalidLicenses = await bike.invalidLicenses
      assert.strictEqual(invalidLicenses.length, 2)
    })
  })
  describe('#populate', () => {
    it('properly populates association of scoped hasMany through association', async () => {
      const car = cars[0]
      await car.populateAssociation('redParts')
      assert.strictEqual(car._redParts.length, 1)
      const carRating = carRatings[0]
      await carRating.populateAssociation('vehicle.redParts')
      assert.strictEqual(carRating._vehicle._redParts.length, 1)
    })
    it('properly populates association of scoped hasMany association', async () => {
      const car = cars[0]
      await car.populateAssociation('solvedProblems')
      assert.strictEqual(car._solvedProblems.length, 1)
      const carRating = carRatings[0]
      await carRating.populateAssociation('vehicle.solvedProblems')
      assert.strictEqual(carRating._vehicle._solvedProblems.length, 1)
    })
    it('properly populates association of scoped nested association', async () => {
      const bike = bikes[0]
      await bike.populateAssociation('invalidLicenses')
      assert.strictEqual(bike._invalidLicenses.length, 2)
      const rider = riders[0]
      await rider.populateAssociation('bike.invalidLicenses')
      assert.strictEqual(rider._bike._invalidLicenses.length, 2)
    })
  })
})
