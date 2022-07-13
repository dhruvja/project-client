const fs = require('fs')
const anchor = require("@project-serum/anchor")
const {v4} = require("uuid");
const data = require('./data.json');

const projectId = v4();

data.projects.push({"id": projectId, "transfers": []});
fs.writeFileSync('./data.json', JSON.stringify(data))   
