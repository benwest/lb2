function map ( x, inMin, inMax, outMin, outMax ) {
    return outMin + ( x - inMin ) / ( inMax - inMin ) * ( outMax - outMin );
}

function clamp ( x, min, max ) {
    return Math.min( Math.max( x, min ), max );
}

function lerp ( a, b, t ) {
    return  a + ( b - a ) * t;
}

function tween ( duration, fn ) {
    return new Promise( function ( resolve ) {
        var start = Date.now();
        function tick () {
            var t = clamp( map( Date.now(), start, start + duration, 0, 1 ), 0, 1 );
            fn( t );
            if ( t < 1 ) {
                requestAnimationFrame( tick );
            } else {
                resolve();
            }
        }
        tick();
    });
}

function ease ( t ) {
    return t < 0.5
        ? 4 * t * t * t
        : .5 * Math.pow( 2 * t - 2, 3 ) + 1;
}

function smoothscroll ( to ) {
    var from = window.pageYOffset;
    return tween( Math.abs( to - from ), function ( t ) {
        window.scrollTo( 0, map( ease( t ), 0, 1, from, to ) );
    });
}

function intersects ( element1, element2 ) {
    var rect1 = element1.getBoundingClientRect();
    var rect2 = element2.getBoundingClientRect();
    return !(
        rect2.left > rect1.right ||
        rect2.right < rect1.left ||
        rect2.top > rect1.bottom ||
        rect2.bottom < rect1.top
    );
}

var project = null;
var menuState = 'menu';
var nav = document.querySelector( 'nav' );
var links = Array.from( document.querySelectorAll( 'nav a' ) );

var vh = document.querySelector('.vh');
function resizeNav () {
    nav.style.height = vh.offsetTop + 'px';
}
window.addEventListener( 'resize', resizeNav );
resizeNav();

var thumbnails = document.querySelector('.thumbnails');
var mouse = {
    update: true,
    curr: [ .5, .5 ],
    target: [ .5, .5 ],
};
if ( !( 'ontouchstart' in window ) ) {
    nav.addEventListener( 'mousemove', function ( e ) {
        if ( !mouse.update ) return;
        var rect = nav.getBoundingClientRect();
        mouse.target = [
            ( e.clientX - rect.left ) / window.innerWidth,
            ( e.clientY - rect.top ) / window.innerHeight
        ];
    });
}
function tick () {
    mouse.curr[ 0 ] = lerp( mouse.curr[ 0 ], mouse.target[ 0 ], .1 );
    mouse.curr[ 1 ] = lerp( mouse.curr[ 1 ], mouse.target[ 1 ], .1 );
    var x = map( mouse.curr[ 0 ], 1 / 6, 5 / 6, 0, -66.666 );
    var y = map( mouse.curr[ 1 ], 1 / 6, 5 / 6, 0, -66.666 );
    thumbnails.style.transform = "translate(" + x + "%, " + y + "%)";
    links.forEach( function ( link, i ) {
        link.style.zIndex = intersects( link, thumbnails.children[ i ] ) ? 20 : 0;
    });
    window.requestAnimationFrame( tick );
}
tick();

function showTitle ( smooth ) {
    if ( menuState === 'title' ) return;
    menuState = nav.className = 'title';
    links.forEach( function ( link, i ) {
        if ( i !== project ) link.style.opacity = 0;
    });
    mouse.update = false;
    mouse.target = [
        ( ( project % 3 ) + .5 ) / 3,
        ( Math.floor( project / 3 ) + .5 ) / 3
    ];
    if ( !smooth ) mouse.curr = [ mouse.target[ 0 ], mouse.target[ 1 ] ];
}
function showMenu () {
    if ( menuState === 'menu' ) return;
    menuState = nav.className = 'menu';
    links.forEach( function ( link, i ) {
        link.style.opacity = 1;
    });
    mouse.target = [ .5, .5 ];
    mouse.curr = [ .5, .5 ];
    mouse.update = true;
}

var container = document.querySelector( '.container' );
function loadProject ( id, url ) {
    project = id;
    smoothscroll( window.pageYOffset + nav.getBoundingClientRect().top )
        .then( function () {
            showTitle( true );
            window.scrollTo( 0, 0 );
            return fetch( url )
        })
        .then( function ( response ) { return response.text() } )
        .then( function ( html ) {
            container.innerHTML = html;
            document.body.classList.add( 'project-open' );
        });
}
document.querySelector( '.scroll-down' ).addEventListener( 'click', function () {
    smoothscroll( window.pageYOffset + container.getBoundingClientRect().top );
});

document.addEventListener( 'scroll', function () {
    if ( project === null ) return;
    var st = window.pageYOffset;
    var sh = document.documentElement.scrollHeight - window.innerHeight;
    st > sh / 2 ? showMenu() : showTitle();
    resizeNav();
});

links.forEach( function ( link, i ) {
    link.addEventListener( 'click', function ( e ) {
        e.preventDefault();
        loadProject( i, link.href );
    });
});