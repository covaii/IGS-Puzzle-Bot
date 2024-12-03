const fs = require('fs');
const sharp = require('sharp');

class GoBoardImageBuilder {
    constructor(size = 19) {
        this.size = size;
        this.boardSize = 600; // pixels
        this.margin = 60; // Increased margin to accommodate labels
        this.gridSize = (this.boardSize - 2 * this.margin) / (this.size - 1);
    }

    // Convert SGF coordinate (e.g., "aa") to x,y coordinates
    sgfToCoords(sgf) {
        if (!sgf || sgf.length !== 2) return null;
        const x = sgf.charCodeAt(0) - 'a'.charCodeAt(0);
        const y = sgf.charCodeAt(1) - 'a'.charCodeAt(0);
        return { x, y };
    }

    // Convert x,y coordinates to SGF coordinate
    coordsToSgf(x, y) {
        return String.fromCharCode('a'.charCodeAt(0) + x) + 
               String.fromCharCode('a'.charCodeAt(0) + y);
    }

    calculateBoundingBox(stones, padding = 2) {
        if (stones.length === 0) return null;

        // Convert all SGF positions to x,y coordinates
        const positions = stones.map(stone => this.sgfToCoords(stone.pos));

        // Always include top-left corner (0,0) in the bounding box
        let minX = 0;  // Changed to always start from 0
        let minY = 0;  // Changed to always start from 0
        
        // Find max coordinates
        let maxX = Math.max(...positions.map(pos => pos.x));
        let maxY = Math.max(...positions.map(pos => pos.y));

        // Add padding (only to max values since min values are fixed at 0)
        maxX = Math.min(this.size - 1, maxX + padding);
        maxY = Math.min(this.size - 1, maxY + padding);

        return { minX, maxX, minY, maxY };
    }

    async saveAsPNG(stones = [], outputPath = 'goboard.png', padding = 2) {
        const svgContent = this.generateSVG(stones, padding);
        try {
            await sharp(Buffer.from(svgContent))
                .png()
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
                    quality: 90,
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
        if (!box) return this.generateFullBoardSVG(stones); // Fallback to full board if no stones

        // Calculate dimensions for the cropped view
        const width = box.maxX - box.minX + 1;
        const height = box.maxY - box.minY + 1;
        const svgWidth = width * this.gridSize + 2 * this.margin;
        const svgHeight = height * this.gridSize + 2 * this.margin;

        const svgContent = [];
        
        // SVG header with calculated dimensions
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
        
        // Coordinate labels for the cropped section
        this.addCroppedCoordinateLabels(svgContent, box);
        
        // Star points that fall within the cropped area
        const starPoints = this.getStarPoints();
        starPoints.forEach(([x, y]) => {
            if (x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY) {
                const px = this.margin + (x - box.minX) * this.gridSize;
                const py = this.margin + (y - box.minY) * this.gridSize;
                svgContent.push(`<circle cx="${px}" cy="${py}" r="3" fill="black"/>`);
            }
        });
        
        // Stones
        stones.forEach(({pos, color}) => {
            const coords = this.sgfToCoords(pos);
            const px = this.margin + (coords.x - box.minX) * this.gridSize;
            const py = this.margin + (coords.y - box.minY) * this.gridSize;
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
        
        // Gradients for stones
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

module.exports = {
    GoBoardImageBuilder
}