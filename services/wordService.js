const axios = require('axios');
const Wordef = require('../models/wordef');

class WordService {
  constructor() {
    this.API_URL =
      'https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/';
  }

  // TODO: don't need this if getwordpartanddefinitions is more modular
  getWordFromDb = async (word) => {
    return Wordef.findOne({ word });
  }

  getWordPartAndDefinitions = async (word) => {
    const replyFromDB = await Wordef.findOne({ word }); // returns null if no matches
    if (replyFromDB) {
      const { part, definitions } = replyFromDB
      return { part, definitions }
    }
    // word not found in db, therefore query api...
    const replyFromApi = await this.fetchWordData(word);

    // store reference in DB for 'caching'
    if (replyFromApi) {
      this.addWordToDB(replyFromApi); 
      const { part, definitions } = replyFromApi
      return { part, definitions };
    }
    console.log('error in api lookup...');
    return null;
  };

  addWordToDB = ({ word, part, definitions }) => {
    try {
      const wordDef = new Wordef({
        word,
        part,
        definitions,
      });
      wordDef.save();
    } catch (error) {
      // TODO: throw error
      console.error(error);
    }
  };

  fetchWordData = async (word) => {
    let wordObject = {};

    try {
      wordObject = await axios.get(this.API_URL + word, {
        headers: {
          app_id: process.env.APP_ID,
          app_key: process.env.API_KEY,
        },
      });
    } catch (err) {
      console.log('error when fetching word from api: ', err.message);
      return null;
    }
    if ('error' in wordObject) {
      console.log('error when fetching word from api');
      //console.log(wordObject.error);
      return null;
    }

    //first object in lexicalEntries array contains word definitions and examples
    const wordInfo = wordObject.data.results[0].lexicalEntries[0];
    const definitions = []; // for storing 1+ definitions of a word
    let examplesPerDef = []; // there could be multiple examples for each word definition
    wordInfo.entries[0].senses
      .filter((data) => 'examples' in data) //remove entries with no examples
      .forEach((def) => {
        def.examples.forEach((ex) => examplesPerDef.push(ex.text)); //extract string from object
        definitions.push({
          definition: def.definitions[0],
          examples: [...examplesPerDef],
        });
        examplesPerDef = [];
      });

    const part = wordInfo.lexicalCategory.text;
    return { word, part, definitions };
  };
}

module.exports = WordService;
