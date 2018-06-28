require('test/specHelper')
const { assert } = require('chai')
const MongooseAssociation = require('index')
const mongoose = require('mongoose')

MongooseAssociation.assign(mongoose.Schema)

const BandSchema = new mongoose.Schema({})
BandSchema.hasMany('Member')
BandSchema.hasMany('Instrument', {
  localField: 'toys',
  foriegnKey: 'band_id'
})
const Band = mongoose.model('Band', BandSchema)

const MemberSchema = new mongoose.Schema({})
MemberSchema.belongsTo('Band')
const Member = mongoose.model('Member', MemberSchema)

const InstrumentSchema = new mongoose.Schema({})
InstrumentSchema.belongsTo('Band', {
  foriegnKey: 'brand_id'
})
const Instrument = mongoose.model('Instrument', InstrumentSchema)

describe("assign association class", () => {

  describe("#hasMany", () => {
    it('', async () => {
      const count = 5
      const band = await new Band().save()
      for (let i = 0; i < count; i++) {
        let member = await new Member({
          band: band
        }).save()
        let instrument = await new Instrument({
          band: band
        }).save()
      }
      const members = await band.members
      const toys = await band.toys
      assert.strictEqual(members.length, count)
      assert.strictEqual(toys.length, count)
    })
  })
})
