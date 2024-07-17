const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    user: String,
    message: String,
    image: String,
    video: String, 
    room : String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);