# mongoose-association
A cleaner and faster way to setup mongoose populate with virtual field using normalized associations.
This library is built for async await node environment minimum 7.6
This library is built for mongo 3.6, and mongoose version >=4.11.0

## Setup
npm install mongoose-association

```javascript
  const mongoose = require('mongoose')
  require('mongoose-association')(mongoose)
```

## Naming Convention
As mongoose model classes are typically singular thus `mongoose-association` stick to naming models using singular words.
As typically javascript utilize camel casing thus all auto generated naming is done using camel case

## Glossary

#### `foreignModelName`
the modelName property for a mongoose model holding the related schema.

#### `as`
the property on mongoose model instance that holds the related object

#### `with`
for has associations, specify which as property is referenced.

#### `foreignField`
the **schema** property for the relational **reference** typically an mongoose **ObjectID**

#### `localField`
the **model** instance property that holds relational record

#### `through`
through is used to associate via another document type other than the two document types forming the relation

#### `throughAs`
specifies the reference between the through model and associated model.

#### `throughWith`
specifies the reference between the through model and association origin model.

### Associations
`mongoose-association` has 4 types of association to relation mongoose schemas.
* `belongsTo` o ->
* `polymorphic` o =>
* `hasOne` `through` -> o
* `hasMany` `through` ->> o

#### `belongsTo`
this relation specify the reference lies directly on the schema and related to a **single** model using a `foreignField`
```javascript
belongsTo(foreignModelName, { as, localField, foreignField } = {}, schemaOptions = {}) {

}
```
###### foreignModelName *required*
###### as *optional*
###### localField *optional*
###### foreignField *optional*
###### schemaOptions *optional* - for additional mongoose schema feature e.g. { required: true }

#### `polymorphic`
this relation specify the reference lies directly on the schema and related to **multiple** models
```javascript
polymorphic([foreignModelName, ...], { as, localField, foreignField, typeField } = {}, schemaOptions = {}) {

}
```
###### foreignModelName *required* - Array of modelNames
###### as *optional*
###### localField *optional*
###### foreignField *optional*
###### typeField *optional*
###### schemaOptions *optional*

#### `hasOne`
this relation specify the reference lies on another schema and it is **unique**
```javascript
hasOne(foreignModelName, { as, with, localField, foreignField, through, throughAs, throughWith } = {}) {

}
```
###### foreignModelName *required*
###### as *optional*
###### with *optional*
###### through *optional*
###### throughAs *optional*
###### throughWith *optional*

#### `hasMany`
this relation specify the reference lies on another schema and it is **non-unique**
```javascript
hasMany(foreignModelName, { as, with, localField, foreignField, through, throughAs, throughWith } = {}) {

}
```
###### foreignModelName *required*
###### as *optional*
###### with *optional*
###### through *optional*
###### throughAs *optional*
###### throughWith *optional*

## Schema Building
Once we have apply the plugin to mongoose, we can start defining some schemas
```javascript
const mongoose = require('mongoose')
const { Schema } = mongoose

const riderSchema = new Schema()
riderSchema.belongsTo('Bike')
riderSchema.belongsTo('Helmet')
```
Right here we have defined a schema for Rider. Using the `belongsTo` method with the model Bike can automatically have the `localField` defined as **bike**, this results in a standard mongoose virtual property **bike** on each instance. **all `mongoose-association` defined virtuals returns a promise** and is designed to function with `await`. A `localField` was also automatically defined as **bikeId**. This will be the auto generated property storing the reference on the databased mongoose document.
```javascript
const bikeSchema = new Schema()
bikeSchema.hasOne('Rider')
bikeSchema.hasOne('Helmet', {
  through: 'Rider'
})
```
In this weird world each bike only have zero or one **Rider** and **Helmet**. we can now define a reverse relationship using `hasOne` method. Because we know how **Rider** behaves with both **Bike** and **Helmet**. We can infer that a bike can only have zero or one **Helmet**. This inference can only be made `through` the **Rider**
```javascript
const helmetSchema = new Schema()
helmetSchema.hasOne('Rider')
helmetSchema.hasOne('Bike', {
  through: 'Rider'
})
```
mongo's limitation on `$lookup` restrict the through relationship to span only across three document types.
```javascript
const registrationSchema = new Schema()
registrationSchema.belongsTo('Car')
registrationSchema.belongsTo('Alien', {
  as: 'owner'
})
```
Lets visit another scenario that is a bit foreign, where we run an **Alien** **Car** **Registration**. There are two different ways an **Alien** can interact with a **Registration**. One is by assigning the `as` to be **owner**, which renders the `localField` to be **ownerId**. this allows the **Alien** to be the "owner" of the **Car**.
```
registrationSchema.belongsTo('Alien', {
  as: 'approver',
  localField: 'approver_id'
})
```
Similarly an **Alien** can also be an **approver** of the registration, and the `localField` can be modified to use snake case **approver_id** or any format preferred.
```javascript
const alienSchema = new Schema()
alienSchema.hasMany('Registration', {
  as: 'ownedRegistration',
  with: 'owner'
})
```
With this robust system we can declare that each **Alien** may have many **Registration**. by default the `as` would be the downcase pluralize version of the `modelName`, in this case as **registrations**. We also had to apply **owner** for `with`, otherwise we are unable to distinguish which interaction **Alien** has `with` the **Registration**
```javascript
alienSchema.hasMany('Registration', {
  as: 'approvedRegistrations',
  with: 'approver'
})
```
**Alien** can also be the **approver** of **Registration**. This is where we can define that each **Alien** to `hasMany` **approvedRegistrations** using `as`. The `localField` is fetch via the reverse association as **approver_id**.
```javascript
alienSchema.hasMany('Car', {
  through: 'Registration',
  with: 'owner'
})
```
`hasMany` `through` is normally used for many to many relationships. `with` function in reverse of `as` in term of its ability to defined the `localField` and `foreignField` used in the mongo `$lookup`. In this case the **owner** will be used to reference **ownerId**. This relationship will result in the `as` of **cars**, and using the `localField` of **carId**
```javascript
alienSchema.hasMany('Car', {
  through: 'Registration',
  with: 'approver',
  as: 'approvedCars'
})
```
Similar to above case of the **cars**, this association stores **approvedCars** `through` **Registration** using the **approver** for `as`.
```javascript
const carSchema = new Schema()
carSchema.hasOne('Registration')
carSchema.hasOne('Alien', {
  through: 'Registration',
  throughAs: 'owner'
})
```
This is a reverse `hasMany` relationship coming from **Car**. The relationship to **Alien** is `through` **Registration** `thoughAs` **owner**.
```javascript
const assemblySchema = new Schema()
assemblySchema.polymorphic(['Bike', 'Car'], {
  as: 'vehicle'
})
assemblySchema.belongsTo('Part')
```
`polymorphic` is last type of relation, and it is most similar of to `belongsTo`, with the exception that more than one model can be associated. A `as` is required for polymorphic association because `mongoose-association` doesn't pick favors in auto generation. Though the `localField` is inferred from the `as` as **vehicleId**. polymorphic also generates an additional schema property storing the document type `modelName` this property is auto generated using the `foreignField` as **vehicleIdType**
```javascript
const partSchema = new Schema()
partSchema.hasMany('Assembly')
partSchema.hasMany('Bike', {
  through: 'Assembly',
  throughAs: 'vehicle'
})
partSchema.hasMany('Car', {
  through: 'Assembly',
  throughAs: 'vehicle'
})
```
A model can also define `hasMany` `through` a `polymorphic` relationship. `with` perform identical functionality in this scheme.
```javascript
carSchema.hasMany('Assembly', {
  with: 'vehicle'
})
carSchema.hasMany('Part', {
  through: 'Assembly',
  with: 'vehicle'
})

bikeSchema.hasMany('Assembly', {
  with: 'vehicle'
})
bikeSchema.hasMany('Part', {
  through: 'Assembly',
  with: 'vehicle',
  as: 'components'
})
```
The reverse `hasMany` relationships that is mostly auto generated
```javascript
carSchema.hasOne('Rating', {
  with: 'vehicle'
})
bikeSchema.hasOne('Rating', {
  with: 'vehicle'
})

const ratingSchema = new Schema()
ratingSchema.polymorphic(['Bike', 'Car'], {
  as: 'vehicle'
})
ratingSchema.belongsTo('Alien')
ratingSchema.hasOne('Rider', {
  through: 'Bike'
})
riderSchema.hasOne('Rating', {
  through: 'Bike'
})

alienSchema.hasOne('Rating')
alienSchema.hasOne('Car', {
  through: 'Rating',
  throughAs: 'vehicle',
  as: 'ratedCar'
})
```
Make sure the model is defined after all the schema fields. Otherwise the getters and setters on the model instance will miss behave
```javascript
const Rider = mongoose.model('Rider', riderSchema)
const Bike = mongoose.model('Bike', bikeSchema)
const Helmet = mongoose.model('Helmet', helmetSchema)
const registration = mongoose.model('Registration', registrationSchema)
const Alien = mongoose.model('Alien', alienSchema)
const Car = mongoose.model('Car', carSchema)
const Assembly = mongoose.model('Assembly', assemblySchema)
const Part = mongoose.model('Part', partSchema)
const Rating = mongoose.model('Rating', ratingSchema)
const Settings = mongoose.model('Settings', settingsSchema)
```

## Persisting Relationship
creating records with relationship
```javascript
const bike = await new Bike().save()
const helmet = await new Helment().save()
const rider = await new Rider({
  bike,
  helmet
}).save()
```
updating relationship on record
```javascript
const anotherBike = await new Bike().save()
rider.bike = anotherBike
await rider.save()
```
working with polymorphic relationship
```javascript
const bike = await new Bike().save()
const rating = await new Rating({
  vehicle: bike
}).save()
const car = await new Car().save()
rating.vehicle = car
rating.save()
```
## Populating Association
from the object itself
```javascript
const rider = await Rider.findOne() // request count 1
rider.populateAssociation('bike.rating', 'helmet') // request count 4
const bike = await rider.bike // request count 4
const helmet = await rider.helmet // request count 4
const rating = await bike.rating // request count 4
```
from the model
```javascript
const rider = await Rider.findOne() // request count 1
Rider.populateAssociation(bike, 'bike.rating', 'helmet') // request count 4
const bike = await rider.bike // request count 4
const helmet = await rider.helmet // request count 4
const rating = await bike.rating // request count 4
```
from the query is slightly more efficient allows for further optimization
```javascript
const rider = await Rider.findOne().populateAssociation('bike.rating', 'helmet') // request count 2
const bike = await rider.bike // request count 2
const helmet = await rider.helmet // request count 2
const rating = await bike.rating // request count 2
```
## Fetching From New Query Instead of Cache
```javascript
const rider = await Rider.findOne().populateAssociation('bike.rating', 'helmet') // request count 2
const bike = await rider.fetchBike() // request count 3
const sameBike = await rider.fetchBike().populateAssociation('rating') // request count 4
const rating = await sameBike.rating // request count 4
```
unsetting association cache
```javascript
const rider = await Rider.findOne().populateAssociation('bike.rating', 'helmet') // request count 2
const bike = await rider.unsetBike().bike // request count 3
```
helper methods to do more meta programming
```javascript
const rider = await Rider.findOne().populateAssociation('bike.rating', 'helmet') // request count 2
const bike = await rider.fetch('bike') // request count 3
const sameBike = await rider.unset('bike').bike // request count 4
const anotherSameBike = await rider.unset().bike // request count 5
