/* Dead Show */

'use strict'

const Alexa       = require('alexa-sdk')
const https       = require('https')
const APP_ID      = "amzn1.ask.skill.805dbbe6-3395-4772-b33e-d14823a264eb"
const SKILL_NA    = "Dead Show"
const MSG_PAUSE   = "Pausing"
const MSG_RESUME  = "Resuming"
const MSG_STOP    = "Later"
const MSG_ABORT   = `Woah man, I just got a weird message from beyond.  Not sure what to do about that.`
const MSG_NOT_FND = "I couldn't find anything for "
const MSG_TRY_AGAIN = "Try again."
const MSG_HELP    = "You can ask me to play a show."
const MSG_LIST_HELP = "I didn't hear any search criteria.  I sure don't want to list every show.  Please ask me to list shows in which the band played a particular song, or shows from a particular year or venue."
const PROMPT_HELP = "What do you want me to play?"
const SEARCH_URL  = "https://archive.org/services/search/v1/scrape?fields=dir,title,date,subject,venue,source&sorts=date&q=collection%3A"
const BAND_NA     = "GratefulDead"

//TODO:  this object should be created with search result
var audioData = {
    title: 'Grateful Dead Live at Barton Hall on 1977-05-08',
    subtitle: 'Dead Show',
    cardContent: "Recorded by our beautiful brothers and sisters. \nHoused in the Internet Archives",
    // url: 'https://archive.org/embed/gd1994-07-27.AKG451.Darby.119474.Flac1644&autoplay=1'
    //url: 'https://archive.org/download/gd1994-07-27.AKG451.Darby.119474.Flac1644/gd1994-07-27.AKG451.t11.ogg&autoplay=1',
    tracks: [
        {
            title: 'Tuning',
            url: 'https://archive.org/download/gd1977-05-08.shure57.stevenson.29303.flac16/gd1977-05-08d01t01.ogg'
        },
        {
            title: 'Take a Step Back',
            url: 'https://archive.org/download/gd1977-05-08.shure57.stevenson.29303.flac16/gd1977-05-08d02t03.ogg'
        },
        {
            title: 'St. Stephen',
            url: 'https://archive.org/download/gd1977-05-08.shure57.stevenson.29303.flac16/gd1977-05-08d03t04.ogg'
        }
    ],
    image: {  //TODO: fix these images to size properly
        largeImageUrl: 'https://s3-us-west-2.amazonaws.com/deadco.show/img/grateful-sugar-skull.jpg',
        smallImageUrl: 'https://s3-us-west-2.amazonaws.com/deadco.show/img/grateful-sugar-skull.jpg'
      //smallImageUrl: 'https://s3-us-west-2.amazonaws.com/deadco.show/img/stealyourface_300x300.jpg'
    }
}
var MSG_PLAY    = "Now playing: " + audioData.title
var searchCriteria = ''

var stateEventHandlers = {
    'LaunchRequest': function () {
        this.emit('GetFact')
    },
    'PlayIntent': function () {
        this.emit('PlayShow')
    },
    'PlayShow': function () {
        controller.play.call(this, MSG_PLAY);
    },
    'ListIntent': function () {
        let song  = this.event.request.intent.slots.song.value
        let venue = this.event.request.intent.slots.venue.value
        let year  = this.event.request.intent.slots.showYear.value
        console.log('song:'+song + ', venue:'+venue + ',year:'+year)

        // build search string
        let searchUrl = SEARCH_URL + '(' + BAND_NA + ')'
        // let searchResults = {}
        if ((song === undefined) && (year === undefined) && (venue === undefined)) {
            console.log('error:  no slots')
            this.emit(':ask', MSG_LIST_HELP, PROMPT_HELP)
        }
        if (year !== undefined) {
            searchUrl += ( '%20AND%20(' + year + ')' )
            addToSearchCriteria(year)
        }
        if (venue !== undefined) {
            searchUrl += ( '%20AND%20(' + venue + ')' )
            addToSearchCriteria(venue)
        }
        if (song !== undefined) {
            searchUrl += ( '%20AND%20(' + song + ')' )
            addToSearchCriteria(song)
        }
        console.log(searchUrl)
        var responseItems = {}
        var responseString = ''

        https.get(searchUrl, result => {
            result.on('data', data => {
                //console.log('data = ' + data )
                responseString += data
            })
            result.on('end', () => {
                //console.log('end. = ' + responseString)
                responseItems = JSON.parse(responseString)
                console.log('responseItems = ' + responseItems.toString())
                if ( Object.keys(responseItems).length === 0 ||
                    !Array.isArray(responseItems.items)      ||
                    !responseItems.items.length                )
                    {
                        console.log('search came up empty')
                        let msg = MSG_NOT_FND + song + MSG_TRY_AGAIN
                        this.emit(':tell', msg)
                }
                else {
                    console.log('first show = ' + responseItems.items[0].title)
                    this.emit(':tell', responseItems.items[0].title)
                }
            })
        }).on('error', err => {
            console.log('error: ' + err.message)
        })
    },
    'AMAZON.PauseIntent': function () {
        this.emit('AMAZON.StopIntent')
      //this.emit(':tell', MSG_PAUSE)
    },
    'AMAZON.ResumeIntent': function () {
        controller.play.call(this, MSG_PLAY);  //TODO: fix to find song on pause
      //this.emit(':tell', MSG_RESUME)
    },
    'AMAZON.CancelIntent': function () {
        this.emit('AMAZON.StopIntent')
      //this.emit(':tell', MSG_STOP)
    },
    'AMAZON.StopIntent': function () {
        controller.stop.call(this, MSG_STOP)
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', MSG_HELP, PROMPT_HELP)
    },
    'Unhandled': function() {
        this.emit(':tell', MSG_ABORT);
    }

}

var audioEventHandlers = {
    'PlaybackStarted': function () {
        console.log('Playback Started')
        this.emit(':responseReady')
    },
    'PlaybackStopped': function () {
        console.log('Playback Stopped')
        this.emit(':responseReady')
    },
    'PlaybackNearlyFinished': function () {
        console.log('Playback Nearly Finished: enqueue next song.')
        this.response
            .audioPlayerPlay('ENQUEUE', audioData.tracks[1].url, audioData.tracks[1].url, audioData.tracks[0].url, 0)
        // this.response
        //     .audioPlayerPlay('ENQUEUE', audioData.tracks[2].url, audioData.tracks[2].url, audioData.tracks[1].url, 0)
        this.emit(':responseReady')
    },
    'PlaybackFailed': function () {
        console.log('Playback Failed : %j', this.event.request.error)
        this.response.audioPlayerClearQueue('CLEAR_ENQUEUED')
        this.emit(':responseReady')
    }
}

var controller = function () {
    return {
        play: function (text) {
            if (canInsertCardIntoResponse.call(this)) {
                var cardTitle   = audioData.title;
                var cardContent = audioData.cardContent;
                var cardImage   = audioData.image;
                this.response.cardRenderer(cardTitle, cardContent, cardImage);
            }

            this.response
                .speak(text)
//              .audioPlayerPlay('REPLACE_ALL', audioData.url, audioData.url, null, 0)
                .audioPlayerPlay('REPLACE_ALL', audioData.tracks[0].url, audioData.tracks[0].url, null, 0)
                // .audioPlayerPlay('ENQUEUE', audioData.tracks[1].url, audioData.tracks[1].url, audioData.tracks[0].url, 0)
                // .audioPlayerPlay('ENQUEUE', audioData.tracks[2].url, audioData.tracks[2].url, audioData.tracks[1].url, 0)

            this.emit(':responseReady')
        },
        stop: function (text) {
            this.response.speak(text).audioPlayerStop();
            this.emit(':responseReady');
        }
    }
}();

// var search = function (searchObj) {

//     return searchObj
// }();

function canInsertCardIntoResponse() {
    if (this.event.request.type === 'IntentRequest' || this.event.request.type === 'LaunchRequest') {
        return true;
    } else {
        return false;
    }
}

function addToSearchCriteria(criteria) {
    if (searchCriteria === '') {
        searchCriteria = criteria
    }
    else {
        searchCriteria = searchCriteria + " and " + criteria
    }
}
exports.handler = function (event, context) {
    const skill = Alexa.handler(event, context)

    //TODO: Add appId validation
    //skill.appId = APP_ID

    skill.registerHandlers(stateEventHandlers, audioEventHandlers)
    skill.execute()
}
