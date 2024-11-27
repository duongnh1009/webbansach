const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    email: {
        type: String,
    },

    password: {
        type: String,
    },

    fullName: {
        type: String,
    },

    role: {
        type: String,
        default: "Member"
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    },

    isLocked: { 
        type: Boolean, 
        default: false 
    },    
}, {
    timestamps: true
});

const userModel = mongoose.model("Users", userSchema);
module.exports = userModel;
