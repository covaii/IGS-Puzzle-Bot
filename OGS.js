// import fetch from 'node-fetch';
const axios = require("axios"); 

async function getPuzzle(id){
    try{
        response = await axios.get("https://online-go.com/api/v1/puzzles/" + id);
    }catch(error){
        console.error("Error fetching puzzle:", error);
        return null;
    }
    return response;
}




module.exports = {
    getPuzzle
};