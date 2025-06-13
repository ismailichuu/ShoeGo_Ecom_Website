import mongoose from "mongoose";

//schema 
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },

    discount: {
        type: String,
        required: true,
    },

    visibility: {
        type: Boolean,
        required: true,
    }
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', categorySchema);

export default Category;