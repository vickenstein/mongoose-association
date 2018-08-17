require('../specHelper')
const { assert } = require('chai')
const mongoose = require('mongoose')
const { Has } = require('../../dist/associations/Has')

const testSchema = new mongoose.Schema

describe("Some shared functionality of the has reference", () => {
  describe("#constructor()", () => {
    it('creates error when missing parameter', () => {
      assert.throws(() => { new Has({}, testSchema) }, "Can\'t create a has association without specifying a foreignModelName", 'missing property')
    })

    it('creates the proper foreignModelName', () => {
      const has = new Has({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(has.foreignModelName, 'Rider')
    })
  })

  describe("get #with", () => {
    it('get the property where the association stores the reference to this model', () => {
      const has = new Has({ foreignModelName: 'Rider' }, mongoose.model('Bike').schema)
      assert.strictEqual(has.with, 'bike')
    })

    it('get the property where the association stores the reference to this model with custom with', () => {
      const has = new Has({ foreignModelName: 'Rider', with: 'roughRider' }, mongoose.model('Bike').schema)
      assert.strictEqual(has.with, 'roughRider')
    })
  })

  describe("get #trough", () => {
    it('get null for has association without a through model', () => {
      const has = new Has({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(has.through, null)
    })

    it('get the through model name', () => {
      const has = new Has({ foreignModelName: 'Rider', through: 'Helmet' }, testSchema)
      assert.strictEqual(has.through, 'Helmet')
    })
  })

  describe("get #throughModel", () => {
    it('get null for an has association without through', () => {
      const has = new Has({ foreignModelName: 'Rider' }, testSchema)
      assert.strictEqual(has.throughModel, null)
    })

    it('get the model for the through association', () => {
      const has = new Has({ foreignModelName: 'Rider', through: 'Bike' }, testSchema)
      assert.strictEqual(has.throughModel, mongoose.model('Bike'))
    })
  })

  describe("get #withAssociation", () => {
    it('fetches the correct withAssociation', () => {
      const Bike = mongoose.model('Bike')
      const riderAssociation = Bike.associate('rider')
      const withAssociation = riderAssociation.withAssociation
      assert.isOk(withAssociation)
    })
  })

  describe("get #throughAs", () => {
    it('fetches the correct throughAs', () => {
      const Rating = mongoose.model('Rating')
      const riderAssociation = Rating.associate('rider')
      const throughAs = riderAssociation.throughAs
      assert.strictEqual(throughAs, 'rider')
    })
  })

  describe("get #throughAsAssociation", () => {
    it('fetches the correct throughAsAssociation', () => {
      const Rating = mongoose.model('Rating')
      const riderAssociation = Rating.associate('rider')
      const throughAsAssociation = riderAssociation.throughAsAssociation
      assert.isOk(throughAsAssociation)
    })
  })
})
