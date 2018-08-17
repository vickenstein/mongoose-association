require('../specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Association } = require('../../dist/associations/Association')

const testSchema = new mongoose.Schema

describe("Some shared functionality of association object", () => {
  describe("#constructor()", () => {
    it('cannot create association without a schema', () => {
      assert.throws(() => { new Association({}) }, 'missing schema for association', 'missing schema')
    })
  })

  describe("get #model()", () => {
    it('fetch the model for the association', () => {
      const Rider = mongoose.model('Rider')
      const association = new Association({}, Rider.schema)
      assert.strictEqual(association.model, Rider)
    })
  })

  describe("get #modelName()", () => {
    it('fetch the modelName for the association', () => {
      const Rider = mongoose.model('Rider')
      const association = new Association({}, Rider.schema)
      assert.strictEqual(association.modelName, 'Rider')
    })
  })

  describe("get #collectionName()", () => {
    it('fetch the collectionName for the association', () => {
      const Rider = mongoose.model('Rider')
      const association = new Association({}, Rider.schema)
      assert.strictEqual(association.collectionName, Rider.collection.name)
    })
  })

  describe("get #foreignModel", () => {
    it('get the foreign mongoose model', () => {
      const association = new Association({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(association.foreignModel.modelName, 'Rider')
    })
  })

  describe("get #as", () => {
    it('get the property where the reference object is stored', () => {
      const association = new Association({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(association.as, 'rider')
    })

    it('get the property where the reference object is stored with custom as', () => {
      const association = new Association({ foreignModelName: 'Rider', as: 'roughRider' }, testSchema)
      assert.strictEqual(association.as, 'roughRider')
    })
  })

  describe("get #$as", () => {
    it('get the property where the reference object cache is stored', () => {
      const association = new Association({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(association.$as, '$rider')
    })

    it('get the property where the reference object is stored with custom as', () => {
      const association = new Association({ foreignModelName: 'Rider', as: 'roughRider' }, testSchema)
      assert.strictEqual(association.$as, '$roughRider')
    })
  })

  describe("get #_as", () => {
    it('get the property where the reference object cache is stored', () => {
      const association = new Association({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(association._as, '_rider')
    })

    it('get the property where the reference object is stored with custom as', () => {
      const association = new Association({ foreignModelName: 'Rider', as: 'roughRider' }, testSchema)
      assert.strictEqual(association._as, '_roughRider')
    })
  })
})
