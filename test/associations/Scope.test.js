require('../specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { BelongsTo } = require('../../dist/associations')
const { Scope } = require('../../dist/associations/Scope')

const testSchema = new mongoose.Schema

describe("Scope", () => {
  describe("#constructor()", () => {
    it('properly creates scope', () => {
      const Bike = mongoose.model('Bike')
      const Rider = mongoose.model('Rider')
      const association = new BelongsTo({
        foreignModelName: 'Bike'
      }, Rider.schema)
      const scope = new Scope('Test', association, {})
      assert.isOk(scope)
    })
  })

  describe("#as()", () => {
    it('properly returns as', () => {
      const Bike = mongoose.model('Bike')
      const Rider = mongoose.model('Rider')
      const association = new BelongsTo({
        foreignModelName: 'Bike'
      }, Rider.schema)
      const scope = new Scope('Test', association, {})
      assert.strictEqual(scope.as, 'testBike')
    })
  })
})
