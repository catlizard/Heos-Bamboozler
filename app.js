// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { app, BrowserWindow } = require('electron'); 
const heos = require('heos-api'); 
const { volume_level, play_state } = heos.constants; 
let volumeSlider, vol, playing; 
window.$ = window.jQuery = require('jquery');

window.onload = function () {
    var canvas = document.getElementById('ultraCanvas');
    volumeSlider = document.getElementById('volumeRange'); 
    vol = document.getElementById('currentVolume');

    getInitialVol(); 
    getCurrentlyPlaying(); 
    checkPlayState(); 

    setInterval(function() {
        getCurrentlyPlaying()
    }, 5000); 

    var calcVolume = debounce(() => {
        setVolume(volumeSlider.value);
        vol.innerText = volumeSlider.value; 
    }, 50);

    $(volumeSlider).on('input', calcVolume); 

    $('#bamboozleTheme').click(function() {
        if($(this).is(':checked')) {
            $('html').addClass('bamboozle');     
            $('#volumeRange').addClass('super-bamboozle'); 
        } else {
            $('html').removeClass('bamboozle');     
            $('#volumeRange').removeClass('super-bamboozle'); 
        }
         
    }); 

    $('.btn-prev').on('click', function() {
        heos.discoverAndCreateConnection()
            .then(connection =>
                heos.commands.player.get_players(connection)
                    .then(players => players.payload[0])
                    .then(player =>
                        heos.commands.player.play_previous(
                            connection,
                            player.pid,
                        )
                ).then(bamboozle => {
                    getCurrentlyPlaying();
                })
            ); 
    }); 

    $('.btn-pause').on('click', function () {
        var _this = this; 
        var newState; 
        playing = !playing; 

        if(playing) {
            newState = play_state.play; 
        } else {
            newState = play_state.pause; 
        }

        switch (newState) {
            case 'play':
                $(_this).html('<i class="fa fa-pause"></i>')
                playing = true;
                break;

            default:
                $(_this).html('<i class="fa fa-play"></i>')
                playing = false;
                break;
        }

        heos.discoverAndCreateConnection()
            .then(connection =>
                heos.commands.player.get_players(connection)
                    .then(players => players.payload[0])
                    .then(player =>
                        heos.commands.player.set_play_state(
                            connection,
                            player.pid,
                            newState
                        )
                ).then(bamboozle => {
                    getCurrentlyPlaying();
                })
            );
    }); 

    $('.btn-next').on('click', function () {
        heos.discoverAndCreateConnection()
            .then(connection =>
                heos.commands.player.get_players(connection)
                    .then(players => players.payload[0])
                    .then(player =>
                        heos.commands.player.play_next(
                            connection,
                            player.pid,
                        )
                    ).then(bamboozle => {
                        getCurrentlyPlaying(); 
                    })
            ); 
    }); 
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function checkPlayState() {
    heos.discoverAndCreateConnection()
        .then(connection =>
            heos.commands.player.get_players(connection)
                .then(players => players.payload[0])
                .then(player =>
                    heos.commands.player.get_play_state(
                        connection,
                        player.pid,
                    )
                )
                .then(playState => {
                    switch (playState.message.state) {
                        case 'play':
                            $('.btn-pause').html('<i class="fa fa-pause"></i>')
                            playing = true;
                            break;

                        default:
                            $('.btn-pause').html('<i class="fa fa-play"></i>')
                            playing = false;
                            break;
                    }
                })
        );
}

function getCurrentlyPlaying() {
    heos.discoverAndCreateConnection()
        .then(connection =>
            heos.commands.player.get_players(connection)
                .then(players => players.payload[0])
                .then(player =>
                    heos.commands.player.get_now_playing_media(
                        connection,
                        player.pid,
                        null
                    )
                ).then(media => {
                    $('.now-playing').html(media.payload.artist + ' – ' + media.payload.song ); 
                })
        ); 
}

function getInitialVol() {
    heos.discoverAndCreateConnection()
        .then(connection =>
            heos.commands.player.get_players(connection)
                .then(players => players.payload[0])
                .then(player =>
                    heos.commands.player.get_volume(
                        connection,
                        player.pid
                    )
                ).then(volume => {
                    setDisplayVolume(volume.message.level); 
                })
        ); 
}

function setDisplayVolume(volume) {
    vol.innerText = volume; 
    volumeSlider.value = volume; 
}

function setVolume(vol) {
    heos.discoverAndCreateConnection()
        .then(connection =>
            heos.commands.player.get_players(connection)
                .then(players => players.payload[0]) 
                .then(player => 
                    heos.commands.player.set_volume(
                        connection,
                        player.pid,
                        volume_level(vol)
                    )
                )
            )
}