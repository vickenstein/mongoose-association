require('./specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = mongoose.Types.ObjectId
const drop = require('./helpers/drop')

const Bike = mongoose.model('Bike')
const Car = mongoose.model('Car')
const Part = mongoose.model('Part')
const Assembly = mongoose.model('Assembly')

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

async function setupData() {
  for(let i = 0; i < PARTCOUNT; i++) {
    const part = await new Part().save()
    parts.push(part)
  }
  for(let i = 0; i < BIKECOUNT; i++) {
    const bike = await new Bike({ _id: ObjectIds[i] }).save()
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

describe("assign association class", () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe("#dependent()", () => {
    it('delete all assembly for bike when on remove of bike', async () => {
      const bike = await Bike.findOne({
        _id: ObjectIds[0]
      })

      await bike.remove()

      const assemblies = await Assembly.find({
        vehicleId: ObjectIds[0],
        vehicleIdType: 'Bike'
      })

      assert.strictEqual(assemblies.length, 0)
    })
    it('nullify all assembly for bike when on remove of bike', async () => {
      const car = await Car.findOne({
        _id: ObjectIds[0]
      })

      await car.remove()

      const assemblies = await Assembly.find({
        vehicleId: null,
        vehicleIdType: 'Car'
      })

      assert.strictEqual(assemblies.length, 2)
    })
  })
})
