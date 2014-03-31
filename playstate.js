/* Feature list
    - two-sided game, with flipping
    - fireworks on win
    v ding on correct click, atata on incorrect
    v green frame on correct click, red on incorrect
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
        this.gameIsOn = false;
        this.generateLevel();
        
        var topRect = game.add.bitmapData(290, 65);
        topRect.ctx.rect(0, 0, 290, 65);
        topRect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        topRect.ctx.fill();
        this.topUnderlay = game.add.sprite(-300, 5, topRect);
        this.topText = new TypedText(30, 10, "\tHello!\nWelcome to CountUp!",
                          {font: '24px Arial', fill:'#ffff20', align:'left'}, false);
        game.add.existing(this.topText);
        game.add.tween(this.topUnderlay).to({x: 5}, 500, Phaser.Easing.Cubic.In, true).
            onComplete.add(function() { game.state.callbackContext.topText.startTyping(); });
        
        var btmRect = game.add.bitmapData(290, 40);
        btmRect.ctx.rect(0, 0, 290, 40);
        btmRect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        btmRect.ctx.fill();
        this.btmUnderlay = game.add.sprite(300, 355, btmRect);
        this.btmText = new TypedText(10, 365, "Click on the '1' rectangle.",
                          {font: '20px Arial', fill:'#ffff20', align:'left'}, false);
        game.add.existing(this.btmText);
        game.add.tween(this.btmUnderlay).to({x: 5}, 500, Phaser.Easing.Cubic.In, true);
        this.topText.addOnComplete(function () { game.state.callbackContext.btmText.startTyping(); }, 200);
        this.btmText.addOnComplete(function () {
            game.state.callbackContext.gameIsOn = true;
            game.add.tween(game.state.callbackContext.topUnderlay).to({y: -70}, 500, Phaser.Easing.Cubic.Out, true);
            game.add.tween(game.state.callbackContext.topText).to({y: -65}, 500, Phaser.Easing.Cubic.Out, true);
            // add menu here 
        }, 200);
        
        var menuBtnRect = game.add.bitmapData(50, 25);
        menuBtnRect.ctx.lineWidth = 1;
        menuBtnRect.ctx.strokeStyle = 'rgba(64,64,64,1)';
        menuBtnRect.ctx.rect(0, 0, 80, 30);
        menuBtnRect.ctx.stroke();
        menuBtnRect.ctx.beginPath();
        menuBtnRect.ctx.rect(1, 1, 80 - 3, 30 - 3);
        menuBtnRect.ctx.fillStyle = 'rgba(255,255,192,1)';
        menuBtnRect.ctx.fill();
        var menuBtnLabel = game.add.text(4, 4, "Menu", {font: 'bold 16px Arial', fill:'#000'});
        
        this.menuButton = game.add.group();
        this.menuButton.create(0, 0, menuBtnRect);
        this.menuButton.add(menuBtnLabel);
        this.menuButton.x = 10;
        this.menuButton.y = 5;
        //this.menuButton.visible = false;
    },
    
    update: function() {
    },
    
    render: function() {
    },
    
    generateLevel: function() {
        this.numbers = 3;
        this.nextExpected = 1;
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
    
    clickedOnTile: function(tile) {
        if(!this.gameIsOn) return;
        
        if(tile.number == this.nextExpected) {
            
            if(this.nextExpected == 1)
                this.btmText.setNewText("Great! Now the '2' one.", true);
            else if(this.nextExpected == 2)
                this.btmText.setNewText("Right. The last one, please.", true);
            else if(this.nextExpected == 3)
                this.btmText.setNewText("Now you know how to play!", true);
            
            this.nextExpected++;
            tile.correctlyClicked();
        }
        else
            tile.wronglyClicked();
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
        rect.ctx.lineWidth = 1;
        rect.ctx.strokeStyle = 'rgba(64,64,64,1)';
        rect.ctx.rect(0, 0, myWidth, myHeight);
        rect.ctx.stroke();
        rect.ctx.beginPath();
        rect.ctx.rect(1, 1, myWidth - 2, myHeight - 2);
        rect.ctx.fillStyle = 'rgba(' + this.randColor() + ',' + this.randColor() + ',' + this.randColor() + ',1)';
        rect.ctx.fill();
        
        this.image = game.add.sprite(myTopX, myTopY, rect);
        
        this.label = game.add.text(myTopX + (myWidth - myLabelWidth) / 2, myTopY + (myHeight - myLabelHeight) / 2,
                                   this.number.toString(),
                                   {font: '24px Arial', fill:'#202020'});
        
        this.image.inputEnabled = true;
        this.image.events.onInputDown.add(this.onClickHandler, this);
        
        var wrongFrameRect = game.add.bitmapData(myWidth + 4, myHeight + 4);
        wrongFrameRect.ctx.lineWidth = 4;
        wrongFrameRect.ctx.strokeStyle = 'rgba(255,0,0,1)';
        wrongFrameRect.ctx.rect(0, 0, myWidth + 4, myHeight + 4);
        wrongFrameRect.ctx.stroke();
        this.wrongFrame = game.add.sprite(myTopX - 2, myTopY - 2, wrongFrameRect);
        this.wrongFrame.alpha = 0;
        
        var correctFrameRect = game.add.bitmapData(myWidth + 4, myHeight + 4);
        correctFrameRect.ctx.lineWidth = 4;
        correctFrameRect.ctx.strokeStyle = 'rgba(0,255,0,1)';
        correctFrameRect.ctx.rect(0, 0, myWidth + 4, myHeight + 4);
        correctFrameRect.ctx.stroke();
        this.correctFrame = game.add.sprite(myTopX - 2, myTopY - 2, correctFrameRect);
        this.correctFrame.alpha = 0;
    },
    
    randColor: function() {
        return Math.floor(LOWEST_COLOR + Math.random() * (255 - LOWEST_COLOR)); 
    },
    
    correctlyClicked: function() {
        game.add.tween(this.correctFrame).to({alpha: 1}, 300, Phaser.Easing.Quadratic.OUT, true, 0, 1, true);
        Main.Assets.correctSound.play();
    },
    
    wronglyClicked: function() {
        game.add.tween(this.wrongFrame).to({alpha: 1}, 300, Phaser.Easing.Quadratic.OUT, true, 0, 1, true);
        Main.Assets.wrongSound.play();
    },
    
    onClickHandler: function(item) {
        // Either way works, ask on forum
        //game.state.states.Playstate.clickedOnTile(this.number);
        //game.state.callbackContext.clickedOnTile(this.number);
        game.state.callbackContext.clickedOnTile(this);
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
            if(dir % 2 == 0 && tile.cellsX > allowedIncrease ||
               dir % 2 == 1 && tile.cellsY > allowedIncrease) {
                okToExtend = false;
            }
            else {
                nextTiles = [];
                for(i = 0; i < tile.occupied.length; i++) {
                    nextTileX = tile.occupied[i].x + D[dir][0];
                    nextTileY = tile.occupied[i].y + D[dir][1];
                    
                    if(!this.hasTile(nextTileX, nextTileY)) {
                        okToExtend = false;
                        break;
                    }
                    // If (nextTileX, nextTileY) is already a part of my tile, I don't care
                    else if(!tile.isOccupying(nextTileX, nextTileY)) {
                        nextTile = this.tileAt(nextTileX, nextTileY);
                        nextTiles.push(nextTile);
                        
                        // So far, for simplicity, only allowing to "consume" tiles that are single yet.
                        if(!nextTile.isSingle) {
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
    this.unTypedText = text;
    this.typingDelayMin = 40;
    this.typingDelayMax = 100;
    if(startNow) 
        this.startTyping();
    else
        this.typing = false;
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
        Main.Assets.typingSound.play();
        
        if(this.unTypedText == '' && this.callback)
            this.nextTypeTime += this.delayBeforeCallback;
    }   
}

TypedText.prototype.startTyping = function() {
    this.typing = true;
    this.nextTypeTime = game.time.now;
}

TypedText.prototype.setNewText = function(text, startNow) {
    startNow = typeof startNow !== 'undefined' ? startNow : false;
    // Ideally it should have a third parameter defining it we should wait for the current text to end typing. TODO for the future.
    this.text = '';
    this.unTypedText = text;
    if(startNow)
        this.startTyping();
    else
        this.typing = false;
}

TypedText.prototype.addOnComplete = function(callback, delay) {
    delay = typeof delay !== 'undefined' ? delay : 0;
    this.callback = callback;
    this.delayBeforeCallback = delay;
}