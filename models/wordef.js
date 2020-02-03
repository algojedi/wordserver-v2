const mongoose = require('mongoose')


const defInfo = mongoose.Schema(
  {
    definition: { type: String, required: true },
    //examples: { type: [{ _id: false, text: String }]}

    examples: [{ type: String }]
  },
  { _id: false }
);

//TODO: combine the two schemas
const wordefSchema = mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId(),
  word: { type: String, required: true },
  type: { type: String, required: true },
  definitions: {type: [defInfo], required: true }
});



module.exports = mongoose.model('Wordef', wordefSchema);
//mongoose will use lowercase plural form of model name for collection name - eg: wordefs