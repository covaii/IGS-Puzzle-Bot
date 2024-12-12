const fs = require('fs');
const sharp = require('sharp');
const { addUserActiveStone,getUsersActiveStones, getActivePuzzleID,getActiveServerName, removeLastUserStone,checkSolved,
    incrementScore,incrementTries,setSolved
        } = require("./database.js");
const { getInitialStones,getPlayerColor,getMoveTree,getPuzzleAuthor,getPuzzleDiscription } = require('./OGS.js');
const { EmbedBuilder,AttachmentBuilder } = require("discord.js");
const Wgo = require("wgo");

class GoBoardImageBuilder {
    constructor(size = 19) {
        this.size = size;
        this.boardSize = 400; // pixels
        this.margin = 40; // margin for labels
        this.gridSize = (this.boardSize - 2 * this.margin) / (this.size - 1);
    }

    calculateBoundingBox(stones, padding = 1) {
        if (stones.length === 0) return null;

        // Always include top-left corner
        let minX = 0;
        let minY = 0;
        
        // Find max coordinates
        let maxX = Math.max(...stones.map(stone => stone.x));
        let maxY = Math.max(...stones.map(stone => stone.y));

        // Add padding (only to max values since min values are fixed at 0)
        maxX = Math.min(this.size - 1, maxX + padding);
        maxY = Math.min(this.size - 1, maxY + padding);

        return { minX, maxX, minY, maxY };
    }

    async saveAsPNG(stones = [], outputPath = 'goboard.png', padding = 2) {
        const svgContent = this.generateSVG(stones, padding);
        try {
            await sharp(Buffer.from(svgContent))
                .png({
                    compressionLevel: 9,
                    quality: 80
                })
                .toFile(outputPath);
            // console.log(`Board saved as ${outputPath}`);
        } catch (error) {
            console.error('Error converting to PNG:', error);
        }
    }

    async saveAsJPG(stones = [], outputPath = 'goboard.jpg', padding = 2) {
        const svgContent = this.generateSVG(stones, padding);
        try {
            await sharp(Buffer.from(svgContent))
                .jpeg({
                    quality: 80,
                    chromaSubsampling: '4:4:4'
                })
                .toFile(outputPath);
            // console.log(`Board saved as ${outputPath}`);
        } catch (error) {
            console.error('Error converting to JPG:', error);
        }
    }

    generateSVG(stones = [], padding = 2) {
        const box = this.calculateBoundingBox(stones, padding);
        // if (!box) return this.generateFullBoardSVG(stones);

        const width = box.maxX - box.minX + 1;
        const height = box.maxY - box.minY + 1;
        const svgWidth = width * this.gridSize + 2 * this.margin;
        const svgHeight = height * this.gridSize + 2 * this.margin;

        const svgContent = [];
        
        // SVG header
        svgContent.push(`<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`);
        
        // Board background
        svgContent.push(`<rect width="100%" height="100%" fill="#DCB35C"/>`);
        
        // Grid lines
        for (let i = box.minX; i <= box.maxX; i++) {
            const x = this.margin + (i - box.minX) * this.gridSize;
            svgContent.push(`<line 
                x1="${x}" y1="${this.margin}" 
                x2="${x}" y2="${svgHeight - this.margin}" 
                stroke="black" stroke-width="1"/>`);
        }
        for (let i = box.minY; i <= box.maxY; i++) {
            const y = this.margin + (i - box.minY) * this.gridSize;
            svgContent.push(`<line 
                x1="${this.margin}" y1="${y}" 
                x2="${svgWidth - this.margin}" y2="${y}" 
                stroke="black" stroke-width="1"/>`);
        }
        
        // Coordinate labels
        this.addCroppedCoordinateLabels(svgContent, box);
        
        // Star points
        const starPoints = this.getStarPoints();
        starPoints.forEach(([x, y]) => {
            if (x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY) {
                const px = this.margin + (x - box.minX) * this.gridSize;
                const py = this.margin + (y - box.minY) * this.gridSize;
                svgContent.push(`<circle cx="${px}" cy="${py}" r="3" fill="black"/>`);
            }
        });
        
        // Stones
        stones.forEach(({x, y, color}) => {
            const px = this.margin + (x - box.minX) * this.gridSize;
            const py = this.margin + (y - box.minY) * this.gridSize;
            const stoneRadius = this.gridSize * 0.45;
            
            // Stone shadow
            svgContent.push(`<circle cx="${px + 1}" cy="${py + 1}" r="${stoneRadius}" 
                fill="rgba(0,0,0,0.3)"/>`);
            
            // Stone
            const gradient = color === 'black' ? 
                `url(#blackStoneGradient)` : `url(#whiteStoneGradient)`;
            svgContent.push(`<circle cx="${px}" cy="${py}" r="${stoneRadius}" 
                fill="${gradient}"/>`);
        });
        
        // Gradients
        svgContent.push(this.generateGradients());
        
        // Close SVG
        svgContent.push('</svg>');
        
        return svgContent.join('\n');
    }

    addCroppedCoordinateLabels(svgContent, box) {
        const letters = 'ABCDEFGHJKLMNOPQRST'; // Skip 'I' as per Go convention
        
        // Add column labels (letters)
        for (let i = box.minX; i <= box.maxX; i++) {
            const x = this.margin + (i - box.minX) * this.gridSize;
            // Top labels
            svgContent.push(`<text x="${x}" y="${this.margin - 20}" 
                text-anchor="middle" font-size="16">${letters[i]}</text>`);
            // Bottom labels
            svgContent.push(`<text x="${x}" y="${(box.maxY - box.minX + 1) * this.gridSize + this.margin + 30}" 
                text-anchor="middle" font-size="16">${letters[i]}</text>`);
        }
        
        // Add row labels (numbers)
        for (let i = box.minY; i <= box.maxY; i++) {
            const y = this.margin + (i - box.minY) * this.gridSize;
            const label = this.size - i;
            // Left labels
            svgContent.push(`<text x="${this.margin - 20}" y="${y + 6}" 
                text-anchor="end" font-size="16">${label}</text>`);
            // Right labels
            svgContent.push(`<text x="${(box.maxX - box.minX + 1) * this.gridSize + this.margin + 20}" y="${y + 6}" 
                text-anchor="start" font-size="16">${label}</text>`);
        }
    }

    getStarPoints() {
        if (this.size === 19) {
            return [[3,3], [3,9], [3,15], 
                    [9,3], [9,9], [9,15], 
                    [15,3], [15,9], [15,15]];
        } else if (this.size === 13) {
            return [[3,3], [3,9], [6,6], [9,3], [9,9]];
        } else if (this.size === 9) {
            return [[2,2], [2,6], [4,4], [6,2], [6,6]];
        }
        return [];
    }
    
    generateGradients() {
        return `
            <defs>
                <radialGradient id="blackStoneGradient">
                    <stop offset="0%" stop-color="#505050"/>
                    <stop offset="80%" stop-color="#000000"/>
                </radialGradient>
                <radialGradient id="whiteStoneGradient">
                    <stop offset="0%" stop-color="#FFFFFF"/>
                    <stop offset="80%" stop-color="#E0E0E0"/>
                </radialGradient>
            </defs>
        `;
    }
}



async function runBoard(client,userId,addStone = ""){
    //simulate the board then return the stones

    if(addStone !== ""){
        await addUserActiveStone(client,userId,addStone);
    }


    const puzzleID = await getActivePuzzleID(client,userId);
    const inititalStones = await getInitialStones(puzzleID);

    const playerColor = await getPlayerColor(puzzleID);
    const moveTree = await getMoveTree(puzzleID);

    const userStones = await getUsersActiveStones(client,userId);

    const response = await simulateMove(inititalStones.whiteStonesInital,inititalStones.blackStonesInital,
        userStones,playerColor,moveTree
    )

    //only happens when a move was invalid
    if(response == false){
        removeLastUserStone(client,userId);
        return "Invalid Move"
    }else if(response.incorrect != undefined && response.incorrect == true){
        if(await checkSolved(client,userId) == false){
            incrementTries(client,userId);
        }
    }else if(response.correct != undefined && response.correct == true){
        if(await checkSolved(client,userId) == false){
            setSolved(client,userId,true);
            incrementScore(client,userId);
        }
    }

    return response
}

async function simulateMove(inititalWhiteStones,inititalBlackStones
    ,playerPastMoves = [],playerColor,moveTree){
    
    //Wgo handles x y coords backwards so we swap them when we place the stone
    const game = new Wgo.Game(19,"ko");
    for(let i = 0;i < inititalWhiteStones.length; i=i+2){
        const coord = sgfToCoords(inititalWhiteStones[i] + inititalWhiteStones[i+1]);
        game.addStone(coord.y,coord.x,Wgo.Color.WHITE);
    }

    for(let i = 0;i < inititalBlackStones.length; i=i+2){
        const coord = sgfToCoords(inititalBlackStones[i] + inititalBlackStones[i+1]);
        game.addStone(coord.y,coord.x,Wgo.Color.BLACK);
    }

    //We want to pass if the playerColor dose not match the turn otherwise we will be putting down the wrong color
    if(game.turn != playerColor){
        game.pass();
    }

    if(playerPastMoves === undefined || playerPastMoves.length == 0){
        return game.positionStack[0];
    }

    let state = {};

    //add Players moves
    for (let move of playerPastMoves){
        const coord = sgfToCoords(move);
        state = game.play(coord.y,coord.x);//have to do play instead of add so it simulates captures

        //state is false if move is invalid
        if(state == false){
            return false
        }

        moveTree = getMoveBranch(coord.x,coord.y,moveTree);

        if (moveTree.text != undefined){
            const cleanText = moveTree.text.replace(/<(?!br\s*\/?)[^>]+>/g, '');
            state.text = cleanText;
        }


        if (moveTree === "Incorrect"){
            state.incorrect = true;
            return state;
        }

        if(moveTree.correct_answer != undefined && moveTree.correct_answer == true){
            state.correct = true;
            return state;
        }

        if(moveTree.wrong_answer != undefined && moveTree.wrong_answer == true){
            state.incorrect = true;
            return state;
        }

        //TODO: Some puzzles support multiple responces, this works but dose not store which option
        //it took so it causes it to mess up in future placements
        
        //move up the moveTree for the response
        // if(moveTree.branches.length > 1){
        //     const branch = Math.floor(Math.random() * moveTree.branches.length);
        //     moveTree = moveTree.branches[branch];
        // }else{
            moveTree = moveTree.branches[0];
        // }
        


        state = game.play(moveTree.y,moveTree.x);
        //save the reponse move so we can use it when talking to the player
        state.response_move = {x : moveTree.x, y : moveTree.y};

        if (moveTree.text != undefined){
            const cleanText = moveTree.text.replace(/<(?!br\s*\/?)[^>]+>/g, '');
            state.text = cleanText;
        }

        if(moveTree.correct_answer != undefined && moveTree.correct_answer === true){
            state.correct = true;
            return state;
        }

        if(moveTree.wrong_answer != undefined && moveTree.wrong_answer === true){
            state.incorrect = true;
            return state;
        }

    }
    return state;
}

//Trim the move tree to just the move the player takes
function getMoveBranch(playerXcoord,playerYcoord,moveTree){
    for (move of moveTree.branches){
        if(move.x == playerXcoord && move.y == playerYcoord){
            return move;
        }
    }
    //if player places anywhere not in the move tree its incorrect
    return "Incorrect";
}




//for testing
function printBoard(array) {
    if (array.length !== 361) {
        console.log("Array must be exactly 361 elements");
        return;
    }

    for (let row = 0; row < 19; row++) {
        let line = '';
        for (let col = 0; col < 19; col++) {
            const index = row * 19 + col;
            // Pad each number to be 2 characters wide (including space)
            line += (array[index] >= 0 ? ' ' : '') + array[index] + ' ';
        }
        console.log(line.trim());
    }
}


    // Convert SGF coordinate (e.g., "aa") to x,y coordinates
function sgfToCoords(sgf) {
    if (!sgf || sgf.length !== 2) return null;
    const x = sgf.charCodeAt(0) - 'a'.charCodeAt(0);
    const y = sgf.charCodeAt(1) - 'a'.charCodeAt(0);
    return { x, y };
}

function wgoGridToImageStones(grid = []){
    if (grid.length !== 361) {
        console.log("Array must be exactly 361 elements");
        return;
    }

    stones = []

    for (let row = 0; row < 19; row++) {
        let line = '';
        for (let col = 0; col < 19; col++) {
            if (grid[row * 19 + col] == 0){
                continue;
            }else if(grid[row * 19 + col] == 1){
                stones.push({x : col, y : row, color: 'black'})
            }else{
                stones.push({x : col, y : row, color: 'white'})
            }
        }
    }
    return stones;

}

function standardNotationToSGF(coord){
    if (!coord || coord.length < 2) {
        return null;
    }
    
    // Split into column letter and row number
    const col = coord[0].toUpperCase();
    const row = parseInt(coord.slice(1));
    
    // Convert column: A->a, B->b, etc.
    // Note: SGF skips 'i' to avoid confusion
    let sgfCol = String.fromCharCode(col.charCodeAt(0) - 'A'.charCodeAt(0) + 'a'.charCodeAt(0));
    if (col.charCodeAt(0) >= 'I'.charCodeAt(0)) {
        sgfCol = String.fromCharCode(sgfCol.charCodeAt(0) - 1);
    }

    
    // Convert row: SGF counts from bottom-up, a=1
    // For 19x19 board, row 19 = 'a', row 1 = 's'
    const sgfRow = String.fromCharCode('s'.charCodeAt(0) - row + 1);
    
    return sgfCol + sgfRow;
}

function coordsToStandard(x, y, boardSize = 19) {
    // Convert x coordinate (0-18) to letter (A-T, skipping I)
    let col = String.fromCharCode('A'.charCodeAt(0) + x);
    if (x >= 8) { // Adjust for skipping 'I'
        col = String.fromCharCode(col.charCodeAt(0) + 1);
    }
    
    // Convert y coordinate (0-18) to board position (19-1)
    // Since 0,0 is top left, we subtract y from boardSize
    const row = boardSize - y;
    
    return `${col}${row}`;
}

module.exports = {
    runBoard,
    GoBoardImageBuilder,
    sgfToCoords,
    wgoGridToImageStones,
    standardNotationToSGF,
    coordsToStandard
}