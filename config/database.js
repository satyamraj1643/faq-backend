const {Sequelize} = require("sequelize")

const sequelize = new Sequelize({
    username: "admin",
    password: "satyamraj",
    database: "faq_development",
    host: "db-faq.c7akcuuy4ref.ap-south-1.rds.amazonaws.com",
    dialect: "mysql",
    port: 3306,
    logging: false,
});

module.exports = sequelize