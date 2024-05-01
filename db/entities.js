
const { Sequelize, DataTypes } = require('sequelize');


console.log("[SEQUELIZE] Preparing database connection")
const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false
});

module.exports.Menus = sequelize.define(
    'menus',
    {
        // Model attributes are defined here
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        repas: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        plat: {
            type: DataTypes.JSON,
            allowNull: false,
        },
    },
    {
        // Other model options go here
    },
);


module.exports.Subscribers = sequelize.define(
    'subscribers',
    {
        // Model attributes are defined here
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN
        },
        target: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data_midi: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        data_soir: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        // Other model options go here
    },
);


module.exports.sequelize = sequelize;