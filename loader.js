Main = { width: 300, height: 400 };

Main.Loader = function(game) {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#c0c0c0';
        game.load.audio('typing', 'assets/sounds/typing.ogg');
    },
    
    create: function() {
        game.state.start('Playstate');
    }
}

