# mongoose-association
A cleaner and faster way to setup mongoose populate with virtual field using normalized associations. This library is build for async await node environment minimum 7.6

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

#### `modelName`
the modelName property for a mongoose model holding the related schema.

#### `foreignKey`
the **schema** property for the relational **reference** typically an mongoose **ObjectID**

#### `localField`
the **model** instance property that holds relational record

### Associations
`mongoose-association` has 4 types of association to relation mongoose schemas.
* `belongsTo`
* `polymorphic`
* `hasOne` `through`
* `hasMany` `through`

#### `belongsTo`
this relation specify the reference lies directly on the schema and related to a **single** model using a `foreignKey`
```javascript
belongsTo(modelName, { localField, foreignKey } = {}, schemaOptions = {}) {

}
```
###### modelName *required*
###### localField *optional*
###### foreignKey *optional*
###### schemaOptions *optional* - for additional mongoose schema feature e.g. { required: true }

#### `polymorphic`
this relation specify the reference lies directly on the schema and related to **multiple** models

#### `hasOne`
this relation specify the reference lies on another schema and it is **unique**

#### `hasMany`
this relation specify the reference lies on another schema and it is **non-unique**

#### `through`
through is used to associate via another document type other than the two document types forming the relation

#### `throughAs`

#### `throughBy`

## Schema Building
Once we have apply the plugin to mongoose, we can start defining some schemas
```javascript
const mongoose = require('mongoose')
const { Schema } = mongoose

const riderSchema = new Schema()
riderSchema.belongsTo('Bike')
riderSchema.belongsTo('Helmet')
```
Right here we have defined a schema for Rider. Using the `belongsTo` method with the model Bike can automatically have the `localField` defined as **bike**, this results in a standard mongoose virtual property **bike** on each instance. **all `mongoose-association` defined virtuals returns a promise** and is designed to function with `await`. A `foreignKey` was also automatically defined as **bikeId**. This will be the auto generated property storing the reference on the databased mongoose document.
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
the reverse definition, is symetrical
**Bike** <= **Rider** => **Helmet**
mongo's limitation on `$lookup` restrict the through relationship to span only across three document types.
```javascript
const registrationSchema = new Schema()
registrationSchema.belongsTo('Car')
registrationSchema.belongsTo('Alien', {
  localField: 'owner'
})
```
Lets visit another scenario that is a bit foreign, where we run an **Alien** **Car** **Registration**. There are two different ways an **Alien** can interact with a **Registration**. One is by assigning the `localField` to be **owner**, which renders the `foreignKey` to be **ownerId**. this allows the **Alien** to be the "owner" of the **Car**.
```
registrationSchema.belongsTo('Alien', {
  localField: 'approver',
  foreignKey: 'approver_id'
})
```
Similarly an **Alien** can also be an **approver** of the registration, and the `foreignKey` can be modified to use snake case **approver_id** or any format prefered.
```javascript
const alienSchema = new Schema()
alienSchema.hasMany('Registration', {
  as: 'owner'
})
```
With this robust system we can declare that each **Alien** may have many **Registration**. by default the `localField` would be the downcase pluralize version of the `modelName`, in this case as **registrations**. We also had to apply **owner** for `as`, otherwise we are unable to distinguish which interaction **Alien** has with the **Registration**
```javascript
alienSchema.hasMany('Registration', {
  localField: 'approvedRegistrations',
  foreignKey: 'approver_id'
})
```
**Alien** can also be the **approver** of **Registration**. This is where we can define that each **Alien** to `hasMany` **approvedRegistrations** using `localField`. The `foreignKey` is specified as **approver_id** to distinguish which interaction. Apply `as` would not work in this case because *approver* will resolve into the incorrect `foriegnKey` *approverId*
```javascript
alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'owner'
})
```
`hasMany` `through` is normally used for many to many relationships. `throughAs` function similarly to `as` in term of its ability to defined the `localField` and `foreignKey` used in the mongo `$lookup`. In this case the **owner** will be used to reference **ownerId**. This relationship will result in the `localField` of **cars**, and using the `foreignKey` of **carId**
```javascript
alienSchema.hasMany('Car', {
  through: 'Registration',
  throughAs: 'approver',
  localField: 'approvedCars'
})
```
Similar to above case of the **cars**, this association stores **approvedCars** `through` **Registration** using the **approver** `localField`.
```javascript
const carSchema = new Schema()
carSchema.hasMany('Registration')
carSchema.hasMany('Alien', {
  through: 'Registration',
  throughBy: 'owner'
})
```
This is reverse `hasMany` relationship coming from **Car**. The relationship to **Alien** is `through` **Registration** `thoughBy` **owner**. In this case the throughAs is auto generated to **car**, where the ambiguity comes from **Alien**, and `throughBy` help define which interaction is intended.
```javascript
const assemblySchema = new Schema()
assemblySchema.polymorphic(['Bike', 'Car'], {
  localField: 'vehicle'
})
assemblySchema.belongsTo('Part')
```
`polymorphic` is last type of relation, and it is most similar of to `belongsTo`, with the exception that more than one model can be associated. A `localField` is required for polymorphic association because `mongoose-association` doesn't pick favors auto generation. Though the `foreignKey` is inferred from the `localField` as **vehicleId**. polymorphic also generates an additional schema property storing the document type `modelName` this property is auto generated using the `foreignKey` as **vehicleIdType**
```javascript
const partSchema = new Schema()
partSchema.hasMany('Assembly')
partSchema.hasMany(['Bike', 'Car'], {
  through: 'Assembly',
  throughBy: 'vehicle'
})
```
A model can also define `hasMany` `through` a `polymorphic` relationship. `throughBy` and `throughAs` perform identical functionality in this scheme.
```javascript
carSchema.hasMany('Assembly')
carSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle'
})

bikeSchema.hasMany('Assembly')
bikeSchema.hasMany('Part', {
  through: 'Assembly',
  throughAs: 'vehicle',
  localField: 'components'
})
```
The reverse `hasMany` relationships that mostly auto generated
```javascript
carSchema.belongsTo('Rating')
bikeSchema.belongsTo('Rating')

const ratingSchema = new Schema()
ratingSchema.polymorphic(['Bike', 'Car'], {
  localField: 'vehicle'
})
ratingSchema.belongsTo('Alien')

alienSchema.hasOne(['Bike', 'Car'], {
  through: 'Rating',
  throughWith: 'vehicle',
  localField: 'ratedVehicle'
})
```
Imaging an alien sweepstakes where each alien may only rate one vehicle. `hasOne` can also define `polymorphic` `through` relationship.
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
```
Make sure the model is defined after all the schema fields. Otherwise the getters and setters on the model instance will miss behave
