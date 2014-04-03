/*
    Text that looks like it is being typed right now.
    Has random delay between keypresses (hardcoded for now.
    Uses sound 'Main.Assets.typingSound'.
    Has to see the 'game' global variable as well as Phaser itself.
*/
    
TypedText = function(x, y, text, style, startNow) {
    Phaser.Text.call(this, game, x, y, '', style);
    this.unTypedText = text;
    this.typingDelayMin = 50;
    this.typingDelayMax = 80;
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
        
        this.setText(this.text + this.unTypedText.charAt(0));
        this.unTypedText = this.unTypedText.slice(1);
        this.nextTypeTime = game.time.now + this.typingDelayMin +
                            Math.random() * (this.typingDelayMax - this.typingDelayMin);
        if(Main.Assets.soundOn) Main.Assets.typingSound.play();
        
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
    this.setText('');
    this.unTypedText = text;
    if(startNow)
        this.startTyping();
    else
        this.typing = false;
}

TypedText.prototype.setOnComplete = function(callback, delay) {
    delay = typeof delay !== 'undefined' ? delay : 0;
    this.callback = callback;
    this.delayBeforeCallback = delay;
}

TypedText.prototype.cancelOnComplete = function() {
    this.callback = null;
}