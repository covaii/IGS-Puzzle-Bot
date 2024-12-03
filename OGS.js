// import fetch from 'node-fetch';
const axios = require("axios"); 

async function getPuzzle(id){
    response = await axios.get("https://online-go.com/api/v1/puzzles/" + id);
    return response;
}




module.exports = {
    getPuzzle
};