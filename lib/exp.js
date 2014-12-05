function Thing(){
    this.config = {};
}

/* Thing implements a set method, which knows about context */
Thing.prototype.set = function( key ){
    var object;
    var value;

    if( this.context && this.context.key ){
        object = this.config[this.context.key];
    }else{
        object = this.config;
    }

    if( this.context && this.context.value ){
        value = this.context.value;
    }else
    {
        value = true;
    }

    object[ key ] = value;
};

/* Create a contextual proxy for original thing, with context */
Thing.prototype.createContextualThing = function(){
    var contextualThing = new Thing();
    contextualThing.parent = this.parent || this;
    contextualThing.context = contextualThing.parent.context || {};
    contextualThing.config = this.config;
    return contextualThing;
};


/* On is a context changing command.  Setup a thing with a context */
Thing.prototype.on = function( key ){

    var contextualThing = this.createContextualThing();
    contextualThing.context.key = key;
    var config = contextualThing.parent.config;
    if( config[ key ] === undefined ){
        config[ key ] = {};
    }
    return contextualThing;
};

/* Using is a context changing command.  Setup a thing with a context */
Thing.prototype.using = function( value ){
    var contextualThing = this.createContextualThing();
    contextualThing.context.value = value;
    return contextualThing;
};

var myThing = new Thing();
myThing.using('Brown').set( 'Hair' );
myThing.on('Cheese').using('Gorgonzola').set('Stink');
myThing.set('Beard');

console.log( myThing );

var myOtherThing = new Thing();
myOtherThing.on( 'Toast ').set('Marmalade');
console.log( myOtherThing );
