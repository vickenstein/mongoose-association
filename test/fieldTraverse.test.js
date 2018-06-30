const { assert } = require('chai')
const FieldTraverse = require('src/fieldTraverse')

describe("assign association class", () => {
  describe("static #reduce", () => {
    it('return a list of reduced fields', () => {
      assert.sameMembers(
        FieldTraverse.reduce('test1', 'test1.test2.test3', 'test2.test3.test4', 'test1.test2.test4', 'test1.test2'),
        ['test1.test2.test3', 'test2.test3.test4', 'test1.test2.test4']
      )
    })
  })

  describe("get #root", () => {
    it('return a list of root fields', () => {
      const fieldTraverse = new FieldTraverse('test1', 'test1.test2.test3', 'test2.test3.test4', 'test1.test2.test4', 'test1.test2')
      assert.sameMembers(fieldTraverse.root, ['test1', 'test2'])
    })
  })

  describe("#children", () => {
    it('return a new fieldTraverse with the correct fields', () => {
      const fieldTraverse = new FieldTraverse('test1', 'test1.test2.test3', 'test2.test3.test4', 'test1.test2.test4', 'test1.test2')
      assert.sameMembers(fieldTraverse.children('test1').fields, ['test2.test3', 'test2.test4'])
    })
  })
})
