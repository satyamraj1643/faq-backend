const { Model, DataTypes } = require('sequelize');
const sequelize = require("../config/database");

class FAQ extends Model { }

FAQ.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        question_en: {
            type: DataTypes.TEXT,
        },
        question_hi: {
            type: DataTypes.TEXT
        },
        question_bn: {
            type: DataTypes.TEXT
        },
        question_original: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        answer_en: {
            type: DataTypes.TEXT,
        },
        answer_hi: {
            type: DataTypes.TEXT,
        },
        answer_bn: {
            type: DataTypes.TEXT,
        },
        answer_original: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        original_language: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [['en', 'hi', 'bn']]
            }
        }
    },
    {
        sequelize,
        modelName: "FAQ",
        tableName: "faqs",
        timestamps: true,
        indexes: [
            {
                fields: ['original_language']
            }
        ]
    }
);

module.exports = FAQ;