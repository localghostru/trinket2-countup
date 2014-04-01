/* Feature list
    - two-sided game, with flipping
    - fireworks on win (at least sound!, one of the main TODOs :))
    v ding on correct click, atata on incorrect
    v green frame on correct click, red on incorrect
    - menu (docking?) --- main TODO
    
    - exclude lightgray tile colors
    - add special character-pause to typed text?
    - add nice (not handcoded) parameter tuning for typedtext
    
    - sound mute icon/code --- second to main TODO
    v winning overlay
    - localstorage? --- most likely one of the main TODOs :)
    - try not counting the time when the game is paused
    - statistics: longest to find number
    - next number on by default --- one of the main TODOs
    
    menu items: restart, last +1, last +5 (or max), last -1, last -5 (or min),
        option to show/hide next number to look for
        option to countdown instead
*/

Main.Playstate = function(game) {};

const D = [ [0, -1], [1, 0], [0, 1], [-1, 0] ];
const LOWEST_COLOR = 64;
const STD_SPACING = Main.width / 60;
const TOP_BAR_HEIGHT = 30;
const PLAY_AREA_WIDTH = Main.width - 4 * STD_SPACING;
const PLAY_AREA_HEIGHT = Main.height - 2 * STD_SPACING - TOP_BAR_HEIGHT;
const MAP_SIZE = [[2, 2], [2, 2], [2, 2], [2, 2], [2, 3], [2, 3], [3, 3], [3, 3], [3, 4], [3, 4],
                  [4, 4], [4, 4], [4, 4], [4, 5], [4, 5], [4, 5], [4, 6], [4, 6], [4, 6], [4, 6],
                  [5, 6], [5, 6], [5, 6], [5, 6], [5, 7], [5, 7], [5, 7], [5, 7], [6, 7], [6, 7],
                  [6, 7], [6, 7], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8],
                  [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8], [6, 8]];


Main.Playstate.prototype = {
    create: function() {
        this.gameIsOn = false;
        this.tutorialIsOn = true;
        this.numbers = 3;
        this.tileLayer = game.add.group();
        this.tm = new NumberedTileMap(this.tileLayer);
        this.generateLevel();
        
        this.menuBar = game.add.group();
        var menuBtnRect = game.add.bitmapData(Main.width / 6, TOP_BAR_HEIGHT - STD_SPACING);
        menuBtnRect.ctx.lineWidth = 2;
        menuBtnRect.ctx.strokeStyle = 'rgba(64,64,64,1)';
        menuBtnRect.ctx.rect(0, 0, menuBtnRect.width, menuBtnRect.height);
        menuBtnRect.ctx.stroke();
        menuBtnRect.ctx.beginPath();
        menuBtnRect.ctx.rect(1, 1, menuBtnRect.width - 3, menuBtnRect.height - 3);
        menuBtnRect.ctx.fillStyle = 'rgba(192,255,192,1)';
        menuBtnRect.ctx.fill();
        var menuBtnLabel = game.add.text(4, 4, "Menu", {font: 'bold 16px Arial', fill:'#000'});
        this.menuButton = game.add.group();
        this.menuButton.create(0, 0, menuBtnRect);
        this.menuButton.add(menuBtnLabel);
        this.menuButton.x = (Main.width -  PLAY_AREA_WIDTH) / 2;
        this.menuButton.y = STD_SPACING;
        
        this.timePassedLabel = game.add.text(90, 9, "Time passed: ", {font: 'bold 16px Arial', fill:'#000'});
        
        this.menuBar.add(this.menuButton);
        this.menuBar.add(this.timePassedLabel);
        
        this.menuBar.x = this.menuBar.y = 0;
        this.menuBar.visible = false;
        
        
        this.levelWonOverlay = game.add.group();
        var levelWonRect = game.add.bitmapData(Main.width - 2 * STD_SPACING, 193);
        levelWonRect.ctx.rect(0, 0, levelWonRect.width, levelWonRect.height);
        levelWonRect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        levelWonRect.ctx.fill();
        var levelWonTitleLabel = game.add.text(levelWonRect.width / 2, 25, "Congratulations!", 
                                               {font: 'bold 22pt Arial', fill:'#ffffff'});
        this.levelWonTimeLabel = game.add.text(levelWonRect.width / 2, 70, "Done in",
                                               {font: '20pt Arial', fill:'#ffffff'});
        levelWonTitleLabel.anchor.setTo(0.5);
        this.levelWonTimeLabel.anchor.setTo(0.5);

        var btnRect = game.add.bitmapData(Main.width - 2 * STD_SPACING, 30);
        btnRect.ctx.lineWidth = 1;
        btnRect.ctx.strokeStyle = 'rgba(192,192,192,1)';
        btnRect.ctx.rect(-1, 0, btnRect.width + 2, btnRect.height);
        btnRect.ctx.stroke();
        btnRect.ctx.beginPath();
        btnRect.ctx.rect(1, 1, btnRect.width - 2, btnRect.height - 2);
        btnRect.ctx.fillStyle = 'rgba(96,96,96,0.75)';
        btnRect.ctx.fill();
        var btn1 = game.add.sprite(0, 100, btnRect);
        var btn2 = game.add.sprite(0, 131, btnRect);
        var btn3 = game.add.sprite(0, 162, btnRect);
        btn1.inputEnabled = btn2.inputEnabled = btn3.inputEnabled = true;
        btn1.events.onInputDown.add(this.startAgain, this);
        btn2.events.onInputDown.add(this.startNext, this);
        btn3.events.onInputDown.add(this.startFiveHigher, this);
        //TODO: check if next and +5 are avaiable
        //this.image.inputEnabled = true;
        //this.image.events.onInputDown.add(this.onClickHandler, this);
        var btn1Text = game.add.text(btnRect.width / 2, btnRect.height / 2 + 100, "Play once again",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn1Text.anchor.setTo(0.5);
        var btn2Text = game.add.text(btnRect.width / 2, btnRect.height / 2 + 131, "Play next number",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn2Text.anchor.setTo(0.5);
        var btn3Text = game.add.text(btnRect.width / 2, btnRect.height / 2 + 162, "Play 5 higher",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn3Text.anchor.setTo(0.5);
        
        this.levelWonOverlay.create(0, 0, levelWonRect);
        this.levelWonOverlay.add(levelWonTitleLabel);
        this.levelWonOverlay.add(this.levelWonTimeLabel);
        this.levelWonOverlay.add(btn1);
        this.levelWonOverlay.add(btn2);
        this.levelWonOverlay.add(btn3);
        this.levelWonOverlay.add(btn1Text);
        this.levelWonOverlay.add(btn2Text);
        this.levelWonOverlay.add(btn3Text);
        
        this.levelWonOverlay.x = 5;
        this.levelWonOverlay.y = -200;
        this.levelWonOverlay.visible = false;
        
        
        this.helloOverlay = game.add.group();
        var topRect = game.add.bitmapData(Main.width - 2 * STD_SPACING, 65);
        topRect.ctx.rect(0, 0, topRect.width, topRect.height);
        topRect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        topRect.ctx.fill();
        this.topText = new TypedText(4 * STD_SPACING, STD_SPACING,
                                    "\t\tHello!\nWelcome to CountUp!",
                                    {font: '18pt Arial', fill:'#ffff20', align:'left'}, false);
        this.helloOverlay.create(0, 0, topRect);
        this.helloOverlay.add(this.topText);
        this.helloOverlay.x = -Main.width;
        this.helloOverlay.y = STD_SPACING;
        
        game.add.tween(this.helloOverlay).to({x: STD_SPACING}, 500, Phaser.Easing.Cubic.In, true).
            onComplete.add(function() { game.state.callbackContext.topText.startTyping(); });
        
        this.tutorialOverlay = game.add.group();
        var btmRect = game.add.bitmapData(Main.width - 2 * STD_SPACING, 35);
        btmRect.ctx.rect(0, 0, btmRect.width, btmRect.height);
        btmRect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        btmRect.ctx.fill();
        
        this.btmText = new TypedText(STD_SPACING * 2, STD_SPACING, "Click on the first rectangle.",
                          {font: '16pt Arial', fill:'#ffff20', align:'left'}, false);
        this.tutorialOverlay.create(0, 0, btmRect);
        this.tutorialOverlay.add(this.btmText);
        this.tutorialOverlay.x = Main.width;
        this.tutorialOverlay.y = Main.height - btmRect.height - STD_SPACING;
        
        game.add.tween(this.tutorialOverlay).to({x: STD_SPACING}, 500, Phaser.Easing.Cubic.In, true);
        this.topText.setOnComplete(function () { 
            game.state.states[game.state.current].btmText.startTyping();            
        });
        this.btmText.setOnComplete(function (thisText) {
            game.state.callbackContext.runGame();
            game.state.callbackContext.menuBar.visible = true;            
            game.add.tween(game.state.callbackContext.helloOverlay).to({y: -70}, 500, Phaser.Easing.Cubic.Out, true);
            game.add.tween(game.state.callbackContext.topText).to({y: -65}, 500, Phaser.Easing.Cubic.Out, true);
            thisText.cancelOnComplete();
        });
       
    },
    
    update: function() {
        if(!this.gameIsOn) return;
        this.timePassedLabel.setText("Time passed: " + Math.round((game.time.now - this.startTime) / 1000));
    },
    
    render: function() {
    },
    
    runGame: function() {
        if(this.levelWonOverlay.getAt(0).inCamera) {
            game.add.tween(this.levelWonOverlay).to({y: -200}, 300, Phaser.Easing.Cubic.Out, true);
        }
        this.nextExpected = 1;
        this.startTime = game.time.now;
        this.timePassed = 0;
        this.gameIsOn = true;
    },
    
    startAgain: function() {
        this.generateLevel(true);
        this.runGame();
    },
    
    startNext: function() {
        this.numbers++;
        if(this.numbers >= MAP_SIZE.length) this.numbers = MAP_SIZE.length - 1;
        this.generateLevel(true);
        this.runGame();
    },
    
    startPrev: function() {
        this.numbers--;
        if(this.numbers < 3) this.numbers = 3;
        this.generateLevel(true);
        this.runGame();
    },
    
    startFiveHigher: function() {
        this.numbers += 5;
        if(this.numbers >= MAP_SIZE.length) this.numbers = MAP_SIZE.length - 1;
        this.generateLevel(true);
        this.runGame();
    },
    
    startFiveLower: function() {
        this.numbers -= 5;
        if(this.numbers < 3) this.numbers = 3;
        this.generateLevel(true);
        this.runGame();
    },
        
    generateLevel: function(destroyOld) {
        this.columns = MAP_SIZE[this.numbers][0];
        this.rows = MAP_SIZE[this.numbers][1];
        
        if(destroyOld) this.tm.destroy();
        this.tm.initialize(this.columns, this.rows);
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
            
            if(this.tutorialIsOn) {
                if(this.nextExpected == 1)
                    this.btmText.setNewText("Great! Now the second one.", true);
                else if(this.nextExpected == 2)
                    this.btmText.setNewText("Right. The last one, please.", true);
                else if(this.nextExpected == 3) {
                    this.btmText.setNewText("Now you know how to play!", true);
                    this.btmText.setOnComplete(function (thisText) {
                            game.add.tween(game.state.callbackContext.tutorialOverlay).
                                to({y: Main.height + 10}, 500, Phaser.Easing.Cubic.Out, true);
                            thisText.cancelOnComplete();
                        }, 1000);
                    this.tutorialIsOn = false;   
                }
            }
            
            this.nextExpected++;
            tile.correctlyClicked();
            
            if(tile.number == this.numbers) {
            // Done!
                this.gameIsOn = false;
                
                var winTime = Math.round((game.time.now - this.startTime) / 1000)
                
                this.levelWonTimeLabel.setText("Done in " + winTime +
                                               " second" + ((winTime > 1)?"s":"") + "!");
                
                this.levelWonOverlay.y = -200;
                this.levelWonOverlay.visible = true;
                game.add.tween(this.levelWonOverlay).to({y: 100}, 300, Phaser.Easing.Cubic.Out, true);
            }
        }
        else {
            tile.wronglyClicked();
        }
    }
}

