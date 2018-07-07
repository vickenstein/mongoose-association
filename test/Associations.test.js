require('test/specHelper')
const { assert } = require('chai')
const Associations = require('src/Associations')
const mongoose = require('mongoose')

describe("Create an holder for all associations for mongoose", () => {
  describe("#constructor()", () => {
    it('can create new associations', () => {
      assert.isOk(new Associations(), 'newing an association')
    })
    it('can create new associations with schema', () => {
      const schema = mongoose.model('Rider').schema
      const associations = new Associations(schema)
      assert.isOk(associations.schema)
      assert.isOk(associations.schema.model)
    })
  })

  describe("get #model()", () => {
    it('can get the model of associations', () => {
      const Rider = mongoose.model('Rider')
      const schema = Rider.schema
      const associations = new Associations(schema)
      assert.strictEqual(associations.model, Rider)
    })
  })

  describe("get #modelName()", () => {
    it('can get the model name of associations', () => {
      const Rider = mongoose.model('Rider')
      const schema = Rider.schema
      const associations = new Associations(schema)
      assert.strictEqual(associations.modelName, Rider.modelName)
    })
  })

  describe("get #collectionName()", () => {
    it('can get the collection name of associations', () => {
      const Rider = mongoose.model('Rider')
      const schema = Rider.schema
      const associations = new Associations(schema)
      assert.strictEqual(associations.collectionName, Rider.collection.name)
    })
  })

  describe("#get()", () => {
    it('can get an belongsTo association by its as', () => {

    })
  })
})
