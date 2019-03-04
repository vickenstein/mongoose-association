require('./specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose

const { ClassFinder } = require('node-association')

const currentDir = __dirname

Object.defineProperty(ClassFinder, 'localPath', {
  get: function() { return currentDir }
})

const BikeSerializer = ClassFinder.classFor('Bike', 'Serializer')

const ObjectId = mongoose.Types.ObjectId
const drop = require('./helpers/drop')

const Rider = mongoose.model('Rider')
const Bike = mongoose.model('Bike')
const Part = mongoose.model('Part')
const Assembly = mongoose.model('Assembly')

const BIKECOUNT = 5
const PARTCOUNT = 5
const PARTPERBIKE = 2

const ObjectIds = []
for(let i = 0; i < BIKECOUNT; i++) {
  ObjectIds.push(ObjectId())
}
const colors = ['red', 'red', 'red', 'blue', 'blue']
const bikes = []
const riders = []
const parts = []
const bikeAssemblies = []

async function setupData() {
  for(let i = 0; i < PARTCOUNT; i++) {
    const part = await new Part().save()
    parts.push(part)
  }
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
    for(let j = 0; j < PARTPERBIKE; j++) {
      const part = parts[(i * PARTPERBIKE + j) % PARTCOUNT]
      const bikeAssembly = await new Assembly({
        part,
        vehicle: bike
      }).save()
      bikeAssemblies.push(bikeAssembly)
    }
  }
}

describe("Serializer", () => {

  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  before(() => {
    return setupData()
  })

  describe("#getPopulatableAssociations()", () => {
    it('should return populatable associations', async () => {
      const getPopulatableAssociations = BikeSerializer.getPopulatableAssociations('rider.helmet.strap', 'rider.passport', 'assemblies.part', 'manufacturer')
      assert.sameMembers(getPopulatableAssociations, ['rider.helmet', 'assemblies.part'])
    })
  })

  describe("#toJson()", () => {
    it('should be able to serialize a bike', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0])
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color
      }))
    })
    it('should be able to serialize a bike with only color', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'color')
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        color: bikes[0].color
      }))
    })
    it('should be able to serialize a bike with the rider', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'rider')
      await bikes[0].rider
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        rider: {
          id: riders[0].id,
          age: riders[0].age
        }
      }))
    })
    it('should be able to serialize a bike with assemblies', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'assemblies')
      const assemblies = await bikes[0].assemblies
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        assemblies: [{
          id: assemblies[0].id
        }, {
          id: assemblies[1].id
        }]
      }))
    })
    it('should be able to serialize a bike with parts', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'components')
      const parts = await bikes[0].components
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        components: [{
          id: parts[0].id
        }, {
          id: parts[1].id
        }]
      }))
    })
    it('should be able to serialize a bike with parts', async () => {
      const bike = await Bike.findOne({
        _id: bikes[0].id
      }).populateAssociation('assemblies.part')
      const bikeSerializer = new BikeSerializer(bike, 'assemblies.part')
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        assemblies: [{
          id: bikeAssemblies[0].id,
          part: {
            id: parts[0].id
          }
        }, {
          id: bikeAssemblies[1].id,
          part: {
            id: parts[1].id
          }
        }]
      }))
    })
    it('should be able to serialize a bike with the rider with computed property', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'rider.doubleAge', 'uppercaseColor')
      await bikes[0].rider
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        uppercaseColor: bikes[0].color.toUpperCase(),
        rider: {
          id: riders[0].id,
          age: riders[0].age,
          doubleAge: riders[0].age * 2
        }
      }))
    })
    it('should be able to serialize a bike with the rider with computed async property', async () => {
      const bikeSerializer = new BikeSerializer(bikes[0], 'rider.asyncAge')
      await bikes[0].rider
      assert.strictEqual(JSON.stringify(await bikeSerializer.toJson({})), JSON.stringify({
        id: bikes[0].id,
        color: bikes[0].color,
        rider: {
          id: riders[0].id,
          age: riders[0].age,
          asyncAge: riders[0].age * 2
        }
      }))
    })
  })
})
