require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Schema } = mongoose

const Bike = mongoose.model('Bike')

describe("assign association class", () => {
  describe("#associatesociation()", () => {
    it('find already defined associations', () => {
      const testSchema = new Schema()
      assert.throws(() => { testSchema.associate('test', 'test') }, 'this schema does not have any associations')
      assert.isOk(Bike.associate('rider'))
      assert.isNotOk(Bike.associate('surfer'))
    })
  })

  describe("static #assign()", () => {
    it('resulting class has methods of mongoose association', () => {
      const testSchema = new Schema()
      assert.isOk(testSchema.belongsTo)
      assert.isOk(testSchema.hasOne)
      assert.isOk(testSchema.hasMany)
      assert.isOk(testSchema.polymorphic)
    })
  })
})
