const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    id: {
        type: String,
        required: true,
        // unique: true
    }
});

sessionSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Session', sessionSchema);

