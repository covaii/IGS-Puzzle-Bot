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

async function getPuzzleCollectionNamefromID(collectionId){
    try{
        response = await axios.get("https://online-go.com/api/v1/puzzles/collections/" + collectionId);
    }catch(error){
        throw error;
        return;
    }
    const cleanText = response.data.results[0].name.replace(/<(?!br\s*\/?)[^>]+>/g, '');
    return cleanText;
}

async function getPuzzleInfo(puzzleId){
    let info = {};
    try{
        response = await getPuzzle(puzzleId);
    }catch(error){
        throw error;
        return;
    }

    info.collectionName = response.data.collection.name.replace(/<(?!br\s*\/?)[^>]+>/g, '');
    info.author = response.data.owner.username;
    info.description = response.data.puzzle.puzzle_description.replace(/<(?!br\s*\/?)[^>]+>/g, '');
    info.whiteStonesInital = response.data.puzzle.initial_state.white;
    info.blackStonesInital = response.data.puzzle.initial_state.black;
    info.moveTree = response.data.puzzle.move_tree;
    info.boardSize = response.data.puzzle.width;


    const playerColor = response.data.puzzle.initial_player;
    if(playerColor === 'black'){
        info.playerColor = Wgo.Color.BLACK;
    }else{
        info.playerColor = Wgo.Color.WHITE;
    }

    return info;
}



module.exports = {
    getPuzzle,
    getPuzzleCollection,
    getAllPuzzlesInCollection,
    getPuzzleCollection,
    getPuzzleCollectionNamefromID,
    getPuzzleInfo
};
