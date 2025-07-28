import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import userModel from './user.model.js';

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = userModel(sequelize, DataTypes);

export default db;
