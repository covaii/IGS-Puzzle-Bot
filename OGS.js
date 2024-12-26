// import fetch from 'node-fetch';
const axios = require("axios"); 
const Wgo = require("wgo");

async function getPuzzle(id){
    response = await axios.get("https://online-go.com/api/v1/puzzles/" + id);
    return response;
}

async function getPuzzleCollection(name = ""){
    name = encodeURIComponent(name);
    response = await axios.get("https://online-go.com/api/v1/puzzles/collections?name=" + name);
    return response
}

async function getAllPuzzlesInCollection(collectionId){
    let i = 1;
    let puzzles = [];
    let response = {};
    do{
        response = await axios.get("https://online-go.com/api/v1/puzzles?collection=" + collectionId + "&page_size=50&page=" + i);
        puzzles.push(... response.data.results);
        i++;
    }while(response.data.count > (50 * (i- 1)));
    return puzzles;
}

async function getInitialStones(puzzleID){
    try{
        response = await getPuzzle(puzzleID);
    }catch(error){
        throw error;
        return;
    }

    whiteStonesInital = response.data.puzzle.initial_state.white;
    blackStonesInital = response.data.puzzle.initial_state.black;

    return {whiteStonesInital, blackStonesInital};
}

async function getPlayerColor(puzzleID){
    try{
        response = await getPuzzle(puzzleID);
    }catch(error){
        throw error;
        return;
    }

    const playerColor = response.data.puzzle.initial_player;
    if(playerColor === 'black'){
        return Wgo.Color.BLACK;
    }else{
        return Wgo.Color.WHITE;
    }
}

async function getMoveTree(puzzleID){
    try{
        response = await getPuzzle(puzzleID);
    }catch(error){
        throw error;
        return;
    }

    return response.data.puzzle.move_tree;
}

async function getPuzzleAuthor(puzzleID){
    try{
        response = await getPuzzle(puzzleID);
    }catch(error){
        throw error;
        return;
    }

    return response.data.owner.username;
}

async function getPuzzleDiscription(puzzleID){
    try{
        response = await getPuzzle(puzzleID);
    }catch(error){
        throw error;
        return;
    }

    return response.data.puzzle.puzzle_description;
}






module.exports = {
    getPuzzle,
    getInitialStones,
    getPlayerColor,
    getMoveTree,
    getPuzzleAuthor,
    getPuzzleDiscription,
    getPuzzleCollection,
    getAllPuzzlesInCollection
};