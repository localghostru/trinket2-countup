/* Feature list
    - two-sided game, with flipping
    - fireworks on win
    - ding on correct click, atata on incorrect
    - green frame on correct click, red on incorrect
    - docking menu
    
    - exclude lightgray tile colors
    - add special character-pause to typed text?
    - add nice (not handcoded) parameter tuning for typedtext
*/

Main.Playstate = function(game) {};

const D = [ [0, -1], [1, 0], [0, 1], [-1, 0] ];
const LOWEST_COLOR = 64;
const PLAY_AREA_WIDTH = 280;
const PLAY_AREA_HEIGHT = 360;
const TOP_BAR_HEIGHT = 30;
const MAP_SIZE = [[2, 2], [2, 2], [2, 2], [2, 2], [2, 3], [2, 3], [3, 3], [3, 3], [3, 4], [3, 4],
                  [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 6], [4, 6], [4, 6], [4, 7],
                  [4, 7], [4, 7], [4, 7], [4, 7], [5, 7], [5, 7], [5, 7], [5, 8], [5, 8], [5, 8],
                  [5, 8], [5, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8],
                  [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8]];

Main.Playstate.prototype = {
    create: function() {
        this.generateLevel();
        
        var underrect = game.add.bitmapData(290, 125);
        underrect.ctx.rect(0, 0, 290, 125);
        underrect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        underrect.ctx.fill();
        var underlay = game.add.sprite((300 - 290) / 2, 5, underrect);
        var menu = game.add.group();
        menu.add(underlay);
        t = new TypedText(30, 10, "  Hello!\nWelcome to CountUp!\nClick on the rectangle\nlabeled with '1'.",
                          {font: '24px Arial', fill:'#ffff20', align:'left'}, true);
        menu.add(t);
    },
    
    update: function() {
    },
    
    render: function() {
    },
    
    generateLevel: function() {
        this.numbers = 3;
        this.columns = MAP_SIZE[this.numbers][0];
        this.rows = MAP_SIZE[this.numbers][1];
        
        this.tm = new TileMap(this.columns, this.rows);
        this.randomizeTiles();
        this.randomizeNumbers();
        
        var cellSpacing = 3;
        var cellSize = Math.min(Math.floor(PLAY_AREA_WIDTH / this.columns), Math.floor(PLAY_AREA_HEIGHT / this.rows)) - cellSpacing;
        var tileMapX = (Main.width - this.columns * (cellSize + cellSpacing)) / 2;
        var tileMapY = TOP_BAR_HEIGHT + (Main.height - TOP_BAR_HEIGHT - this.rows * (cellSize + cellSpacing)) / 2;
        
        this.tm.draw(tileMapX, tileMapY, cellSize, cellSpacing);
    },
    
    randomizeTiles: function() {
        var tilesToMerge = this.columns * this.rows - this.numbers;
        while(tilesToMerge > 0)
            tilesToMerge -= this.tm.extendSomeTile(tilesToMerge);
    },
    
    randomizeNumbers: function() {
        var i, n, untaken = [];
        for(i = 0; i < this.numbers; i++) untaken.push(i + 1);
        for(i = 0; i < this.numbers; i++) {
            nIndex = Math.floor(Math.random() * untaken.length);
            this.tm.tiles[i].attachNumber(untaken[nIndex]);
            untaken.splice(nIndex, 1);
        }
    },
    
    clickedOnTile: function(tileN) {
        if(tileN == 1) {
            console.log ("great!");
        }
    }
}

Tile = function (x, y) {
    this.occupied = [new Phaser.Point(x, y)];
    this.cellsX = 1;
    this.cellsY = 1;
    this.isSingle = true;
};

Tile.prototype = {
    extend: function(dir, tiles) {
        for(var i = 0; i < tiles.length; i++) {
            this.occupied = this.occupied.concat(tiles[i].occupied);
        }
        this.isSingle = false;
        
        // dir 0 = up, 1 = right, 2 = down, 3 = left (i.e. clockwise)
        if(dir % 2 == 0) this.cellsY++;
        else this.cellsX++;
        
        return this;
    },
    
    isOccupying: function(x, y) {
        for(var i = 0; i < this.occupied.length; i++) {
            if(this.occupied[i].x == x && this.occupied[i].y == y)
                return true;
        }
        return false;
    },
    
    getLeftTopXY: function() {
        var x = 999, y = 999;       // Just something bigger than possible grid size
        for(var i = 0; i < this.occupied.length; i++) {
            // Since a tile is rectangular, no checks required.
            if(this.occupied[i].x < x) x = this.occupied[i].x;
            if(this.occupied[i].y < y) y = this.occupied[i].y;
        }
        return new Phaser.Point(x, y);
    }, 
    
    attachNumber: function(n) {
        this.number = n;
    },
    
    draw: function(topX, topY, cellSize, cellSpacing) {
        var myTopCell = this.getLeftTopXY();
        var myTopX = topX + myTopCell.x * (cellSize + cellSpacing);
        var myTopY = topY + myTopCell.y * (cellSize + cellSpacing);
        var myWidth = this.cellsX * cellSize + (this.cellsX - 1) * cellSpacing;
        var myHeight = this.cellsY * cellSize + (this.cellsY - 1) * cellSpacing;
        var myLabelWidth = this.number.toString().length * 13;      // Font size dependent, set up correctly (TODO)
        var myLabelHeight = 20;
        
        var rect = game.add.bitmapData(myWidth, myHeight);
        rect.ctx.rect(0, 0, myWidth, myHeight);
        rect.ctx.fillStyle = 'rgba(' + this.randColor() + ',' + this.randColor() + ',' + this.randColor() + ',1)';
        rect.ctx.fill();
        
        /*rect.beginFill(this.randColor());
        rect.drawRect(0, 0, myWidth, myHeight);
        rect.endFill();*/
        
        this.image = game.add.sprite(myTopX, myTopY, rect);
        
        this.label = game.add.text(myTopX + (myWidth - myLabelWidth) / 2, myTopY + (myHeight - myLabelHeight) / 2,
                                   this.number.toString(),
                                   {font: '24px Arial', fill:'#202020'});
        
        this.image.inputEnabled = true;
        this.image.events.onInputDown.add(this.onClickHandler, this);
    },
    
    randColor: function() {
        return Math.floor(LOWEST_COLOR + Math.random() * (255 - LOWEST_COLOR)); 
    },
    
    onClickHandler: function(item) {
        console.log(this.number);
        console.log(game.state);
        // Either way works, ask on forum
        game.state.states.Playstate.clickedOnTile(this.number);
        game.state.callbackContext.clickedOnTile(this.number);
    }
}

TileMap = function (cellsX, cellsY) {
    var tile, i, j;
    
    this.cellsX = cellsX;
    this.cellsY = cellsY;
    this.tiles = [];        // Tile list - will shrink as compound tiles are forming
    this.map = [];          // Pointers from (x, y) location to compound tile holding it
    
    for(i = 0; i < cellsY; i++)
        for(j = 0; j < cellsX; j++) {
            tile = new Tile(j, i);
            this.tiles.push(tile);
            this.map.push(tile);
        }
}

TileMap.prototype = {
    extendSomeTile: function(allowedIncrease) {
        var x, y, dir, tile;
        var nextTileX, nextTileY, nextTile, nextTiles;
        var i, okToExtend;
        
        do {
            x = Math.floor(Math.random() * this.cellsX);
            y = Math.floor(Math.random() * this.cellsY);
            dir = Math.floor(Math.random() * 4);
            tile = this.tileAt(x, y);
            
            okToExtend = true;
//            console.log(x, y, dir);
            if(dir % 2 == 0 && tile.cellsX > allowedIncrease ||
               dir % 2 == 1 && tile.cellsY > allowedIncrease) {
                okToExtend = false;
//                console.log("Too big extension - denying");
            }
            else {
                nextTiles = [];
                for(i = 0; i < tile.occupied.length; i++) {
                    nextTileX = tile.occupied[i].x + D[dir][0];
                    nextTileY = tile.occupied[i].y + D[dir][1];
                    
                    if(!this.hasTile(nextTileX, nextTileY)) {
//                        console.log("Some tile in this direction doesn't exist - denying");
                        okToExtend = false;
                        break;
                    }
                    // If (nextTileX, nextTileY) is already a part of my tile, I don't care
                    else if(!tile.isOccupying(nextTileX, nextTileY)) {
                        nextTile = this.tileAt(nextTileX, nextTileY);
                        nextTiles.push(nextTile);
                        
                        // So far, for simplicity, only allowing to "consume" tiles that are single yet.
                        if(!nextTile.isSingle) {
//                            console.log("Can't extend to a non-single tile - denying");
                            okToExtend = false;
                            break;
                        }
                    }
                }
            }
        }
        while(!okToExtend);
            
        // If we came here, then we can extend tile at x, y in direction dir, and add all nextTiles.
        tile.extend(dir, nextTiles);
        for(i = 0; i < nextTiles.length; i++) {
            // Again, implicitly using that to-be-added tiles are single
            this.setTileAt(nextTiles[i].occupied[0].x, nextTiles[i].occupied[0].y, tile);
            var tileI = this.tiles.indexOf(nextTiles[i]);
            this.tiles[tileI] = null;
            this.tiles.splice(tileI, 1);
        }
        
        return nextTiles.length;
    },
    
    hasTile: function(x, y) {
        return (x >= 0 && y >= 0 && x < this.cellsX && y < this.cellsY);
    },

    tileAt: function(x, y) {
        return this.map[y * this.cellsX + x];
    },
        
    setTileAt: function(x, y, tile) {
        this.map[y * this.cellsX + x] = tile;
    },
    
    draw: function(topX, topY, cellSize, cellSpacing) {
        for(var i = 0; i < this.tiles.length; i++)
            this.tiles[i].draw(topX, topY, cellSize, cellSpacing);
    }
        
}

TypedText = function(x, y, text, style, startNow) {
    Phaser.Text.call(this, game, x, y, '', style);
    this.typingSound = game.add.audio('typing', 0.2, false);
    this.unTypedText = text;
    this.typingDelayMin = 40;
    this.typingDelayMax = 100;
    this.delayBeforeCallback = 500;
    if(startNow) {
        this.typing = true;
        this.nextTypeTime = game.time.now;
    }
    else {
        this.typing = false;
    }
}

TypedText.prototype = Object.create(Phaser.Text.prototype);
TypedText.prototype.constructor = TypedText;
TypedText.prototype.update = function() {
    if(!this.typing) return;
    
    if(game.time.now > this.nextTypeTime) {
        if(this.unTypedText == '') {
            // Just finished
            if(this.callback) this.callback(this);
            this.typing = false;
            return;
        }
        
        this.text = this.text + this.unTypedText.charAt(0);
        this.unTypedText = this.unTypedText.slice(1);
        this.nextTypeTime = game.time.now + this.typingDelayMin +
                            Math.random() * (this.typingDelayMax - this.typingDelayMin);
        this.typingSound.play();
        
        if(this.unTypedText == '') this.nextTypeTime += this.delayBeforeCallback;
    }   
}

TypedText.prototype.startTyping = function() {
    this.typing = true;
    this.nextTypeTime = game.time.now;
}

TypedText.prototype.addOnComplete = function(callback) {
    this.callback = callback;
}