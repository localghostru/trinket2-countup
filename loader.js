Main = { width: 300, height: 400 };

Main.Loader = function(game) {};

Main.Assets = {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#d0d0d0';
        game.load.audio('typing', 'assets/sounds/typing.ogg');
        game.load.audio('correct', 'assets/sounds/ding3.ogg');
        game.load.audio('wrong', 'assets/sounds/wrong4.ogg');
    },
    
    create: function() {
        Main.Assets.correctSound = game.add.audio('correct', 0.4, false);
        Main.Assets.wrongSound = game.add.audio('wrong', 0.4, false);
        Main.Assets.typingSound = game.add.audio('typing', 0.2, false);
        
        game.state.start('Playstate');
    }
}

