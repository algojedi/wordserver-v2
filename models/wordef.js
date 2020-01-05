const mongoose = require('mongoose')

const wordefSchema = mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  //id is a long string that mongoose uses internally
  word: { type: String, required: true },
  definition: { type: String, required: true },
  type: { type: String, required: true },
  examples: { type: [{ _id: false, text: String }], required: true }
});

module.exports = mongoose.model('Wordef', wordefSchema);
//mongoose will use lowercase plural form of model name for collection name - eg: wordefs