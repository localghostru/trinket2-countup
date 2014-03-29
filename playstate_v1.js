Main.Playstate = function(game) {};

Main.Playstate.prototype = {
    create: function() {
        this.field = game.add.graphics(10, 10);
        this.tileSize = 57;
        this.tileSpace = 3;
        
        this.randomizeTiles(5, 3, 11);
    },
    
    update: function() {
    },
    
    render: function() {
    },
    
    randomizeTiles: function(xSize, ySize, numbers) {
        var partitionCount = (xSize - 1) * ySize + (ySize - 1) * xSize;
        //var junctionCount = (xSize - 1) * (ySize - 1);
        var doubleTiles = xSize * ySize - numbers;
        
        var freeNumbers = [];
        var freePartitions = [];
        //var freeJunctions = [];
        var i, j;
        
        for(i = 0; i < numbers; i++) freeNumbers.push(i);
        for(i = 0; i < partitionCount; i++) freePartitions.push(i);
        
        for(i = 0; i < doubleTiles; i++) {
            var p = Math.floor(Math.random() * freePartitions.length);
            var n = Math.floor(Math.random() * freeNumbers.length);
            var rowSize = xSize - 1 + xSize;
            var pNumWithinRow = freePartitions[p] % rowSize;
            var tileXSize, tileYSize;
                        
            if(pNumWithinRow < xSize - 1) {
                tileXSize = 2;
                tileYSize = 1;
            } else {
                tileXSize = 1;
                tileYSize = 2;
            }
            
            this.createCompoundTile(this.partitionToLeftTopTilePos(freePartitions[p], xSize, ySize),
                                    tileXSize, tileYSize,
                                    freeNumbers[n]);
            
            var toRemove = this.partitionNeighbours(freePartitions[p], xSize, ySize);
            freePartitions.splice(p, 1);
            for(j = 0; j < toRemove.length; j++) {
                var neighP = freePartitions.indexOf(toRemove[j]);
                if(neighP != -1) {
                    freePartitions.splice(neighP, 1);
                }
            }
            freeNumbers.splice(n, 1);
        }
    },
    
    partitionToLeftTopTilePos: function(partNum, xSize, ySize) {
        var rowSize = xSize - 1 + xSize;
        var row = Math.floor(partNum / rowSize);
        var partNumWithinRow = partNum % rowSize;
        // For xSize = 4 we should return 0, 1, 2, then again 0, 1, 2, 3.
        var col = (partNumWithinRow < xSize - 1) ? partNumWithinRow : (partNumWithinRow - (xSize - 1));
        return new Phaser.Point(col, row);
    },
    
    partitionNeighbours: function(partNum, xSize, ySize) {
        var rowSize = xSize - 1 + xSize;
        var row = Math.floor(partNum / rowSize);
        var partNumWithinRow = partNum % rowSize;
        var neighbours = [];
        
        if(partNumWithinRow < xSize - 1) {
            if(partNumWithinRow > 0) neighbours.push(partNum - 1);
            if(partNumWithinRow < (xSize - 2)) neighbours.push(partNum + 1);
            if(row > 0) {
                neighbours.push(partNum - xSize);
                neighbours.push(partNum - (xSize - 1));
            }
            if(row < ySize - 1) {
                neighbours.push(partNum + (xSize - 1));
                neighbours.push(partNum + xSize);
            }
        }
        else {
            if(row > 0) neighbours.push(partNum - rowSize);
            if(row < ySize - 2) neighbours.push(partNum + rowSize);
            if(partNumWithinRow > xSize - 1) {
                neighbours.push(partNum - xSize);
                neighbours.push(partNum + xSize - 1);
            }
            if(partNumWithinRow < rowSize - 1) {
                neighbours.push(partNum - (xSize - 1));
                neighbours.push(partNum + xSize);
            }
        }
        
        return neighbours;
    },
    
    createCompoundTile: function(leftTopTile, xSize, ySize, number) {
        this.field.beginFill(Math.random()*0xffffff);
        this.field.drawRect(leftTopTile.x * (this.tileSize + this.tileSpace), 
                            leftTopTile.y * (this.tileSize + this.tileSpace),
                            xSize * this.tileSize + (xSize - 1) * this.tileSpace,
                            ySize * this.tileSize + (ySize - 1) * this.tileSpace);
        this.field.endFill();
    }
}