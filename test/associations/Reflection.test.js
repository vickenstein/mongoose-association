require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const Reflection = require('src/associations/Reflection')

const Bike = mongoose.model('Bike')

describe("Create an polymorphic association", () => {
  describe("#constructor()", () => {
    it('creates error when missing foreignModelNames parameter', () => {
      assert.throws(() => { new Reflection() }, "a Reflection requires an association", 'missing property')
    })

    it('creates the proper foreignModelNames and as', () => {
      const association = Bike.findAs('rider')
      const reflection = new Reflection(association)
      assert.isOk(reflection)
    })
  })
})
