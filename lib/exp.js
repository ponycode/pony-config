function Thing(){
    this.config = {};
}

Thing.prototype.copy = function(){
    var anotherThing = new Thing();
    anotherThing.config = this.config;
    return anotherThing;
};

//Thing.prototype.set = function( key ){
//    object[ key ] = true;
//};

Thing.prototype.on = function( key ){
    var transientThing = this.copy();

    transientThing.currentKey = key;
    if( transientThing.config[ key ] === undefined ){
        transientThing.config[ key ] = {};
    }
    return transientThing;
};

Thing.prototype.set = function( key ){
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
console.log( myThing );