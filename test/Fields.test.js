const { assert } = require('chai')
const { Fields } = require('dist/Fields')

describe("assign association class", () => {
  describe("static #reduce", () => {
    it('return a list of reduced fields', () => {
      assert.sameMembers(
        Fields.reduce('test2.test3.test4', 'test1', 'test1.test2.test3', 'test1.test2.test4', 'test1.test2'),
        ['test1.test2.test3', 'test2.test3.test4', 'test1.test2.test4']
      )
    })
  })

  describe("get #root", () => {
    it('return a list of root fields', () => {
      const fields = new Fields('test2.test3.test4', 'test1', 'test1.test2.test3', 'test1.test2.test4', 'test1.test2')
      assert.sameMembers(fields.root, ['test1', 'test2'])
    })
  })

  describe("#children", () => {
    it('return a new fields with the correct fields', () => {
      const fields = new Fields('test2.test3.test4', 'test1', 'test1.test2.test3', 'test1.test2.test4', 'test1.test2')
      assert.sameMembers(fields.children('test1').fields, ['test2.test3', 'test2.test4'])
    })
  })
})
