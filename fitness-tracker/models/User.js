const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    activityLevel: { type: Number, required: true },
    goal: { type: String, required: true },
    weightHistory: [{ date: Date, weight: Number }]
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);