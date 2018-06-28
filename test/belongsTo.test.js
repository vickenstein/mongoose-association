require('test/specHelper')
const { assert } = require('chai')
const MongooseAssociation = require('index')
const mongoose = require('mongoose')

MongooseAssociation.assign(mongoose.Schema)

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

  describe("#belongsTo", () => {

    it('create an association record on the model', () => {
      assert.isOk(Book.schema.reflections.belongsTo.authorId, 'auto generate correct foreignKey')
      assert.strictEqual(Book.schema.reflections.belongsTo.authorId.localField, 'author', 'auto generate correct virtual localField')
      assert.isOk(Book.schema.reflections.belongsTo.editor_id, 'manually defined correct foreignKey')
      assert.strictEqual(Book.schema.reflections.belongsTo.editor_id.localField, 'editor', 'manually defined correct virtual localField')
    })

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
      assert.strictEqual(bookAuthor._id, author._id)
      assert.isOk(bookEditor)
      assert.strictEqual(bookEditor._id, author._id)
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
  })
})
