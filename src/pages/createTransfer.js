const fs = require('fs')
const anchor = require("@project-serum/anchor")
const {v4} = require("uuid");
const data = require('./data.json');

const transferId = v4();

data.projects[2].transfers.push({"id": transferId,});
fs.writeFileSync('./data.json', JSON.stringify(data))   
