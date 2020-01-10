const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  cart:  [  { type: Schema.Types.ObjectId, ref: 'Wordef' } ]
  
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

