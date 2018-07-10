require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const drop = require('test/helpers/drop')

const Alien = mongoose.model('Alien')
const Registration = mongoose.model('Registration')
const Car = mongoose.model('Car')

const ALIENCOUNT = 5
const aliens = []
const cars = []
const registrations = []
let approver

async function setupData() {
  for(let i = 0; i < ALIENCOUNT; i++) {
    const alien = await new Alien().save()
    aliens.push(alien)
    const car = await new Car().save()
    cars.push(car)
  }
  approver = await new Alien().save()
  aliens.push(approver)

  for(let i = 0; i < ALIENCOUNT; i++) {
    const registration = await new Registration({
      owner: aliens[i],
      approver,
      car: cars[i]
    }).save()
    registrations.push(registration)
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

  describe('accessing associated values', () => {
    it("fetch alien registrations with the owner relation", async () => {
      const alien = await Alien.findOne({ _id: aliens[0]._id })
      const ownedRegistration = await alien.ownedRegistration
      assert.strictEqual(ownedRegistration.length, 1)
      assert.strictEqual(ownedRegistration[0].constructor, Registration)
    })

    it("fetch alien registrations with the owner relation", async () => {
      const alien = await Alien.findOne({ _id: aliens[0]._id })
      const cars = await alien.cars
      assert.strictEqual(cars.length, 1)
      assert.strictEqual(cars[0].constructor, Car)
    })

    it("fetch alien registrations with the owner relation", async () => {
      const alien = await Alien.findOne({ _id: approver._id })
      const approvedCars = await alien.approvedCars
      assert.strictEqual(approvedCars.length, ALIENCOUNT)
      assert.strictEqual(approvedCars[0].constructor, Car)
    })

    it("fetch alien registrations with the owner relation", async () => {
      const car = await Car.findOne({ _id: cars[0]._id })
      const alien = await car.alien
      assert.strictEqual(alien.constructor, Alien)
      assert.strictEqual(alien._id.toString(), aliens[0]._id.toString())
    })
  })
})
