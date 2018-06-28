require('test/specHelper')
const { assert } = require('chai')
const { Schema } = require('mongoose')
const MongooseAssociation = require('index')

describe("assign association class", () => {
  describe("static #assign", () => {
    it('resulting class has methods of mongoose association', () => {
      MongooseAssociation.assign(Schema)
      const TestSchema = new Schema()
      assert.isOk(TestSchema.belongsTo)
      assert.isOk(TestSchema.hasOne)
      assert.isOk(TestSchema.hasMany)
      assert.isOk(TestSchema.polymorphic)
    })
  })
})
