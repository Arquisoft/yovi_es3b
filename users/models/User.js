const mongoose = require("mongoose");

/*De momento solo tenemos el nombre de usuario que introduce y la fecha de creación es una beta por lo que así sera mas
hasta que decidamos si metemos firebase o lo que sea.
*/
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);