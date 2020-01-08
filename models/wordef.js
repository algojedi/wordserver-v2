const mongoose = require('mongoose')


const defInfo = mongoose.Schema({
  definition: { type: String, required: true },
  examples: { type: [{ _id: false, text: String }]}
  
}, { _id: false })


const wordefSchema = mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId(),
  //id is a long string that mongoose uses internally
  // _id: String,
  word: { type: String, required: true },
  type: { type: String, required: true },
  definitions: {type: [defInfo], required: true }
});



module.exports = mongoose.model('Wordef', wordefSchema);
//mongoose will use lowercase plural form of model name for collection name - eg: wordefs