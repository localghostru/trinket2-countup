NumberedTile = function (x, y, layer) {
    this.occupied = [new Phaser.Point(x, y)];
    this.cellsX = 1;
    this.cellsY = 1;
    this.layer = layer;
    this.isSingle = true;
};

NumberedTile.prototype = {
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
        this.image.inputEnabled = true;
        this.image.events.onInputDown.add(this.onClickHandler, this);
        
        this.label = game.add.text(myTopX + (myWidth - myLabelWidth) / 2, myTopY + (myHeight - myLabelHeight) / 2,
                                   this.number.toString(),
                                   {font: '24px Arial', fill:'#202020'});
        
        var correctFrameRect = game.add.bitmapData(myWidth + 4, myHeight + 4);
        correctFrameRect.ctx.lineWidth = 4;
        correctFrameRect.ctx.strokeStyle = 'rgba(0,255,0,1)';
        correctFrameRect.ctx.rect(0, 0, myWidth + 4, myHeight + 4);
        correctFrameRect.ctx.stroke();
        this.correctFrame = game.add.sprite(myTopX - 2, myTopY - 2, correctFrameRect);
        this.correctFrame.alpha = 0;
        
        var wrongFrameRect = game.add.bitmapData(myWidth + 4, myHeight + 4);
        wrongFrameRect.ctx.lineWidth = 4;
        wrongFrameRect.ctx.strokeStyle = 'rgba(255,0,0,1)';
        wrongFrameRect.ctx.rect(0, 0, myWidth + 4, myHeight + 4);
        wrongFrameRect.ctx.stroke();
        this.wrongFrame = game.add.sprite(myTopX - 2, myTopY - 2, wrongFrameRect);
        this.wrongFrame.alpha = 0;
        
        this.layer.add(this.image);
        this.layer.add(this.label);
        this.layer.add(this.correctFrame);
        this.layer.add(this.wrongFrame);
    },
    
    randColor: function() {
        return Math.floor(LOWEST_COLOR + Math.random() * (255 - LOWEST_COLOR)); 
    },
    
    correctlyClicked: function() {
        this.correctFrame.alpha = 0;
        game.add.tween(this.correctFrame).to({alpha: 1}, 300, Phaser.Easing.Quadratic.OUT, true, 0, 1, true);
        if(Main.Assets.soundOn) Main.Assets.correctSound.play();
    },
    
    wronglyClicked: function() {
        this.wrongFrame.alpha = 0;
        game.add.tween(this.wrongFrame).to({alpha: 1}, 300, Phaser.Easing.Quadratic.OUT, true, 0, 1, true);
        if(Main.Assets.soundOn) Main.Assets.wrongSound.play();
    },
    
    onClickHandler: function(item) {
        game.state.callbackContext.clickedOnTile(this);
    },
    
    destroy: function() {
        this.image.destroy();
        this.label.destroy();
        this.correctFrame.destroy();
        this.wrongFrame.destroy();
        this.occupied = null;
    }
}

NumberedTileMap = function (layer) {
    this.layer = layer;
}

NumberedTileMap.prototype = {
    initialize: function(cellsX, cellsY) {
        var tile, i, j;
        this.cellsX = cellsX;
        this.cellsY = cellsY;
        this.tiles = [];        // Tile list - will shrink as compound tiles are forming
        this.map = [];          // Pointers from (x, y) location to compound tile holding it
        
        for(i = 0; i < cellsY; i++)
            for(j = 0; j < cellsX; j++) {
                tile = new NumberedTile(j, i, this.layer);
                this.tiles.push(tile);
                this.map.push(tile);
            }
    },
    
    destroy: function() {
        var i;
        
        for(i = 0; i < this.tiles.length; i++) {
            this.tiles[i].destroy();
            this.tiles[i] = null;
        }
        for(i = 0; i < this.map.length; i++) {
            this.map[i] = null;
        }
    },
    
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