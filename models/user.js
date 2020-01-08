const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  cart:  [  { type: Schema.Types.ObjectId, ref: 'Wordef' } ]
        //wordId: { type: String, ref: 'Wordef', required: true },
      
  
  // cart: {
  //   words: [
  //     {
  //       wordId: { type: Schema.Types.ObjectId, ref: 'Wordef' },
  //       //wordId: { type: String, ref: 'Wordef', required: true },
  //     }
  //   ]
  // }
});


module.exports = mongoose.model('User', userSchema);

