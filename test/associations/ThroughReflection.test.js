require('test/specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const ThroughReflection = require('src/associations/ThroughReflection')

const Rating = mongoose.model('Rating')
const Bike = mongoose.model('Bike')

describe("Create an polymorphic association", () => {
  describe("get #throughWithIsReference", () => {
    it('return true for reflection where the reference is on through model', () => {
      const association = Bike.findAs('helmet')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.throughWithIsReference, true)
    })

    it('return undefined for reflection where the reference is not on the through model', () => {
      const association = Rating.findAs('rider')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.throughWithIsReference, undefined)
    })
  })

  describe("get #localField", () => {
    it('creates the proper join localField when reference is on through model', () => {
      const association = Bike.findAs('helmet')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.localField, '_id')
      assert.strictEqual(reflection.$localField, '$_id')
    })

    it('creates the proper join localField when reference is not on the through model', () => {
      const association = Rating.findAs('rider')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.localField, 'bikeId')
      assert.strictEqual(reflection.$localField, '$bikeId')
    })
  })

  describe("get #foreignField", () => {
    it('creates the proper join foreignField when reference is on through model', () => {
      const association = Bike.findAs('helmet')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.foreignField, 'helmetId')
      assert.strictEqual(reflection.$foreignField, '$helmetId')
    })

    it('creates the proper join foreignField when reference is not on the through model', () => {
      const association = Rating.findAs('rider')
      const reflection = new ThroughReflection(association)
      assert.strictEqual(reflection.foreignField, '_id')
      assert.strictEqual(reflection.$foreignField, '$_id')
    })
  })

  // need more testing for implementation
  // describe("get #throughWithPolymorphic", () => {
  //   it('return false when the throughWith association is not polymorphic', () => {
  //     const association = Rating.findAs('rider')
  //     const reflection = new ThroughReflection(association)
  //     assert.strictEqual(reflection.throughWithPolymorphic, false)
  //   })

  //   it('return true when the throughWith association is polymorphic', () => {
  //     const association = Rating.findAs('rider')
  //     const reflection = new ThroughReflection(association)
  //     assert.strictEqual(reflection.throughWithPolymorphic, false)
  //   })
  // })
})

