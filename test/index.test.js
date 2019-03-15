require('./specHelper')

const { assert } = require('chai')
const mongoose = require('mongoose')

describe("mongoose Query noop", () => {
  it('returns empty Array doesnt matter what options are passed and no database calls are made', async() => {
    const mongooseRequestCount = mongoose.requestCount
    const result = await (new mongoose.Query()).noop()
    assert.strictEqual(result.constructor, Array)
    assert.strictEqual(result.length, 0)
    assert.strictEqual(mongoose.requestCount, mongooseRequestCount)
  })
})
