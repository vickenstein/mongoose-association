require('test/specHelper')
const { assert } = require('chai')
const _ = require('lodash')
const mongoose = require('mongoose')

const BookSchema = new mongoose.Schema()
BookSchema.belongsTo('Author')
BookSchema.belongsTo('Author', {
  localField: 'editor',
  foreignKey: 'editor_id'
})
const Book = mongoose.model('Book', BookSchema)

const AuthorSchema = new mongoose.Schema()
const Author = mongoose.model('Author', AuthorSchema)

describe("assign association class", () => {
  describe("#reflections", () => {
    it('create an association record on the model', () => {
      assert.isOk(_.get(Book, 'schema.reflections.belongsTo.indexedByForeignKey.authorId'), 'auto generate correct foreignKey')
      assert.strictEqual(_.get(Book, 'schema.reflections.belongsTo.indexedByForeignKey.authorId').localField, 'author', 'auto generate correct virtual localField')
      assert.isOk(_.get(Book, 'schema.reflections.belongsTo.indexedByForeignKey.editor_id'), 'manually defined correct foreignKey')
      assert.strictEqual(_.get(Book, 'schema.reflections.belongsTo.indexedByForeignKey.editor_id').localField, 'editor', 'manually defined correct virtual localField')
    })
  })
  describe("#belongsTo", () => {
    it('create a mongoose object with objectId as association', async () => {
      const author = await new Author().save()
      const book = await new Book({
        authorId: author._id,
        editor_id: author._id
      }).save()
      assert.strictEqual(book.authorId, author._id)
      assert.strictEqual(book.editor_id, author._id)
    })

    it('create a mongoose object with object as association', async () => {
      const author = await new Author().save()
      const book = await new Book({
        authorId: author,
        editor_id: author
      }).save()
      assert.strictEqual(book.authorId, author._id)
      assert.strictEqual(book.editor_id, author._id)
    })

    it('create a mongoose object with objectId as association on reflection field', async () => {
      const author = await new Author().save()
      const book = await new Book({
        author: author._id,
        editor: author._id
      }).save()
      assert.strictEqual(book.authorId, author._id)
      assert.strictEqual(book.editor_id, author._id)
      let bookAuthor = await book.author
      let bookEditor = await book.editor
      assert.isOk(bookAuthor)
      assert.strictEqual(bookAuthor._id.toString(), author._id.toString())
      assert.isOk(bookEditor)
      assert.strictEqual(bookEditor._id.toString(), author._id.toString())
    })

    it('create a mongoose object with object as association on reflection field', async () => {
      const author = await new Author().save()
      const book = await new Book({
        author: author,
        editor: author
      }).save()
      assert.strictEqual(book.authorId, author._id)
      assert.strictEqual(book.editor_id, author._id)
      let bookAuthor = await book.author
      let bookEditor = await book.editor
      assert.isOk(bookAuthor)
      assert.strictEqual(bookAuthor._id, author._id)
      assert.isOk(bookEditor)
      assert.strictEqual(bookEditor._id, author._id)
    })

    it('find and populate association', async () => {
      const count = 5
      const author = await new Author().save()
      for (let i = 0; i < count; i++) {
        const book = await new Book({
          author: author,
          editor: author
        }).save()
      }
      const foundBooks = await Book.find().populateAssociation('author', 'editor')
      let mongooseRequestCount = mongoose.requestCount
      let bookAuthor = await foundBooks[0].author
      let bookEditor = await foundBooks[0].editor
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
      const foundBook = await Book.findOne().populateAssociation('author', 'editor')
      mongooseRequestCount = mongoose.requestCount
      bookAuthor = await foundBooks[0].author
      bookEditor = await foundBooks[0].editor
      assert.strictEqual(mongooseRequestCount, mongoose.requestCount)
    })
  })
})
