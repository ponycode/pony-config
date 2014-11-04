function Thing(){
    this.config = {};
}

Thing.prototype.set = function( key ){
    this.config[ key ] = true;
};

Thing.prototype.on = function( key ){
    var transientThing = new TransientThing( this );

    transientThing.currentKey = key;
    if( transientThing.config[ key ] === undefined ){
        transientThing.config[ key ] = {};
    }
    return transientThing;
};

function TransientThing( fromThing ){
    Thing.call( this );
    this.config = fromThing.config;
}


TransientThing.prototype.set = function( key ){
    var object;

    if( this.currentKey ){
        object = this.config[this.currentKey];
    }else{
        object = this.config;
    }

    object[ key ] = true;
};

var myThing = new Thing();
myThing.set( 'Hair' );
myThing.on('Cheese').set('Stink');
myThing.set('Beard');

console.log( myThing );

var myOtherThing = new Thing();
myOtherThing.on( 'Toast ').set('Marmalade');
console.log( myOtherThing );
