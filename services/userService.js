const axios = require('axios');
const Wordef = require('../models/wordef');
const User = require('../models/user');

class UserService {
  constructor() {
  }

	getUser(id) {
     return User.findOne({ _id: id }).exec();
	}

  addWordToCart = async (word, id) => {
    // ! TODO - add word to user cart 
  }

}

module.exports = UserService
