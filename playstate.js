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
        
        this.createMenuBar();
        this.createOverlays();
        this.initializeInterface();
    },
    
    update: function() {
        if(!this.gameIsOn) return;
        this.timePassedLabel.setText("Time: " + Math.round((game.time.now - this.startTime) / 1000));
    },
    
    render: function() {
    },
    
    runGame: function() {
        if(this.levelWonOverlay.getAt(0).inCamera) {
            game.add.tween(this.levelWonOverlay).to({y: -200}, 300, Phaser.Easing.Cubic.Out, true);
        }
        this.nextExpected = 1;
        this.findNumberLabel.setText("Find #1");
        this.startTime = game.time.now;
        this.timePassed = 0;
        this.gameIsOn = true;
    },
    
    startLevel: function(number) {
        this.numbers = number;
        if(this.numbers < 3) this.numbers = 3;
        else if(this.numbers >= MAP_SIZE.length) this.numbers = MAP_SIZE.length - 1;
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
                this.findNumberLabel.setText("Done");
            }
            else {
                this.findNumberLabel.setText("Find #" + this.nextExpected);
            }
        }
        else {
            tile.wronglyClicked();
        }
    },
    
    // Interface creation functions
    createPlate: function(width, height) {
        var underrect = game.add.bitmapData(width, height);
        underrect.ctx.rect(0, 0, underrect.width, underrect.height);
        underrect.ctx.fillStyle = 'rgba(40,40,40,0.85)';
        underrect.ctx.fill();
        underrect.ctx.beginPath();
        underrect.ctx.lineWidth = 2;
        underrect.ctx.strokeStyle = 'rgba(0,0,0,1)';
        underrect.ctx.rect(0, 0, underrect.width, underrect.height);
        underrect.ctx.stroke();
        
        return underrect;
    },
    
    createWideButton: function(yPosition, clickHandler) {
        // Creates a button of a very specific kind, suitable for menu and level won overlays.
        var btnRect = game.add.bitmapData(Main.width - 2 * STD_SPACING, 30);
        btnRect.ctx.lineWidth = 1;
        btnRect.ctx.strokeStyle = 'rgba(192,192,192,1)';
        btnRect.ctx.rect(-1, 0, btnRect.width + 2, btnRect.height);
        btnRect.ctx.stroke();
        btnRect.ctx.beginPath();
        btnRect.ctx.rect(1, 1, btnRect.width - 2, btnRect.height - 2);
        btnRect.ctx.fillStyle = 'rgba(96,96,96,0.75)';
        btnRect.ctx.fill();
        
        var button = game.add.sprite(0, yPosition, btnRect);
        button.inputEnabled = true;
        button.events.onInputDown.add(clickHandler, this);
        
        return button;
    },
    
    createMenuBar: function() {
        this.menuBar = game.add.group();
        
        var menuBarBitmapData = game.add.bitmapData(Main.width, TOP_BAR_HEIGHT);
        menuBarBitmapData.ctx.rect(0, 0, menuBarBitmapData.width, menuBarBitmapData.height);
        menuBarBitmapData.ctx.fillStyle = 'rgba(128,128,128,1)';
        menuBarBitmapData.ctx.fill();
        menuBarBitmapData.ctx.beginPath();
        menuBarBitmapData.ctx.lineWidth = 1;
        menuBarBitmapData.ctx.strokeStyle = 'rgba(224,224,224,1)';
        menuBarBitmapData.ctx.moveTo(0, 1);
        menuBarBitmapData.ctx.lineTo(Main.width / 3, 1);
        menuBarBitmapData.ctx.lineTo(Main.width / 3, TOP_BAR_HEIGHT);
        menuBarBitmapData.ctx.lineTo(Main.width * 2 / 3, TOP_BAR_HEIGHT);
        menuBarBitmapData.ctx.lineTo(Main.width * 2 / 3, 1);
        menuBarBitmapData.ctx.lineTo(Main.width, 1);
        menuBarBitmapData.ctx.stroke();
        
        this.menuBar.create(0, 0, menuBarBitmapData);
        
        this.findNumberLabel = game.add.text(Main.width / 6, TOP_BAR_HEIGHT / 2,
                                             "Find #", {font: 'bold 16px Arial', fill:'#000'});
        this.findNumberLabel.anchor.setTo(0.5);
        var menuBtnLabel = game.add.text(Main.width / 2, TOP_BAR_HEIGHT / 2, "Menu",
                                         {font: 'bold 16px Arial', fill:'#ffff90'});
        menuBtnLabel.anchor.setTo(0.5);
        this.timePassedLabel = game.add.text(Main.width * 5 / 6, TOP_BAR_HEIGHT / 2,
                                             "Time: ", {font: 'bold 16px Arial', fill:'#000'});
        this.timePassedLabel.anchor.setTo(0.5);
        
        this.menuBar.add(this.findNumberLabel);
        this.menuBar.add(menuBtnLabel);
        this.menuBar.add(this.timePassedLabel);
        
        this.menuBar.x = this.menuBar.y = 0;
        this.menuBar.visible = false;
    },
    
    createOverlays: function() {
        
        // Create top overlay with hello message.
        this.helloOverlay = game.add.group();
        this.helloOverlay.create(0, 0, this.createPlate(Main.width - 2 * STD_SPACING, 65));
        
        this.topText = new TypedText(4 * STD_SPACING, STD_SPACING,
                                    "\t\tHello!\nWelcome to CountUp!",
                                    {font: '18pt Arial', fill:'#ffff20', align:'left'}, false);
        this.helloOverlay.add(this.topText);
        
        this.helloOverlay.x = -Main.width;
        this.helloOverlay.y = STD_SPACING;
        
        // Create bottom overlay with tutorial hints.
        this.tutorialOverlay = game.add.group();
        this.tutorialOverlay.create(0, 0, this.createPlate(Main.width - 2 * STD_SPACING, 35));
        
        this.btmText = new TypedText(STD_SPACING * 2, STD_SPACING, "Click on the first rectangle.",
                          {font: '16pt Arial', fill:'#ffff20', align:'left'}, false);
        this.tutorialOverlay.add(this.btmText);
        
        this.tutorialOverlay.x = Main.width;
        this.tutorialOverlay.y = Main.height - 35 - STD_SPACING;
        
        // Create interlevel overlay for winning the game level
        this.levelWonOverlay = game.add.group();
        this.levelWonOverlay.create(0, 0, this.createPlate(Main.width - 2 * STD_SPACING, 193));
        
        var levelWonTitleLabel = game.add.text((Main.width - 2 * STD_SPACING) / 2, 25, "Congratulations!", 
                                               {font: 'bold 22pt Arial', fill:'#ffffff'});
        levelWonTitleLabel.anchor.setTo(0.5);
        this.levelWonTimeLabel = game.add.text((Main.width - 2 * STD_SPACING) / 2, 70, "Done in",
                                               {font: '20pt Arial', fill:'#ffffff'});        
        this.levelWonTimeLabel.anchor.setTo(0.5);
        
        //TODO: check if next and +5 are avaiable
        //this.image.inputEnabled = true;
        //this.image.events.onInputDown.add(this.onClickHandler, this);
        var btn1Text = game.add.text((Main.width - 2 * STD_SPACING) / 2, 15 + 100, "Play once again",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn1Text.anchor.setTo(0.5);
        var btn2Text = game.add.text((Main.width - 2 * STD_SPACING) / 2, 15 + 131, "Play next number",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn2Text.anchor.setTo(0.5);
        var btn3Text = game.add.text((Main.width - 2 * STD_SPACING) / 2, 15 + 162, "Play 5 higher",
                                     {font: 'bold 14pt Arial', fill:'#ffffff'});
        btn3Text.anchor.setTo(0.5);
        
        var btn1 = this.createWideButton(100, function() { this.startLevel(this.numbers); });
        var btn2 = this.createWideButton(131, function() { this.startLevel(this.numbers + 1); });
        var btn3 = this.createWideButton(162, function() { this.startLevel(this.numbers + 5); });
        
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
    },
    
    initializeInterface: function () {
        // Moves created overlays onto screen. This also launches the text typing on completion.
        game.add.tween(this.helloOverlay).to({x: STD_SPACING}, 500, Phaser.Easing.Cubic.In, true).
            onComplete.add(function() { game.state.callbackContext.topText.startTyping(); });
        game.add.tween(this.tutorialOverlay).to({x: STD_SPACING}, 500, Phaser.Easing.Cubic.In, true);
        
        // Starts bottom text typing and runs first game.
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
    }
}

