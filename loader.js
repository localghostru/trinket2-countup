Main = { width: 300, height: 400 };

Main.Loader = function(game) {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#c0c0c0';
    },
    
    create: function() {
        game.state.start('Playstate');
    }
}

