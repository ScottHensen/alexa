/* Dead Show */

'use strict'

const Alexa       = require('alexa-sdk')
const APP_ID      = "amzn1.ask.skill.805dbbe6-3395-4772-b33e-d14823a264eb"
const SKILL_NA    = "Dead Show"
const MSG_PLAY    = "Now playing:  a not-so-random show"  // {{ audioData.title }}
const MSG_PAUSE   = "Pausing"
const MSG_RESUME  = "Resuming"
const MSG_STOP    = "Later"
const MSG_HELP    = "You can ask me to play a show."
const PROMPT_HELP = "What do you want me to play?"

var stateEventHandlers = {
    'LaunchRequest': function () {
        this.emit('GetFact')
    },
    'PlayIntent': function () {
        this.emit('PlayShow')
    },
    'PlayShow': function () {
        //this.emit(':tell', MSG_PLAY)
        //controller.play.call(this, this.t('WELCOME_MSG', { skillName: audioData.title } ));
        controller.play.call(this, MSG_PLAY);
    },
    'AMAZON.PauseIntent': function () {
        this.emit('AMAZON.StopIntent')    // TODO:  FIX
      //this.emit(':tell', MSG_PAUSE)
    },
    'AMAZON.ResumeIntent': function () {
        this.emit(':tell', MSG_RESUME)    // TODO:  FIX?
    },
    'AMAZON.CancelIntent': function () {
        this.emit('AMAZON.StopIntent')
      //this.emit(':tell', MSG_STOP)
    },
    'AMAZON.StopIntent': function () {
        controller.stop.call(this, MSG_STOP)
      //this.emit(':tell', MSG_STOP)
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', MSG_HELP, PROMPT_HELP)
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
    'PlaybackFailed': function () {
        console.log('Playback Failed : %j', this.event.request.error)
        this.response.audioPlayerClearQueue('CLEAR_ENQUEUED')
        this.emit(':responseReady')
    }
}

// TODO: url & image
var audioData = {
    title: 'Dead Show',
    subtitle: 'Streaming Grateful Dead Concert Tapes',
    cardContent: "Recorded by our beautiful brothers and sisters; housed in the Internet Archives",
    // url: 'https://archive.org/details/gd1994-07-27.AKG451.Darby.119474.Flac1644&autoplay=1'
    url: 'https://archive.org/download/gd1994-07-27.AKG451.Darby.119474.Flac1644/gd1994-07-27.AKG451.t11.ogg&autoplay=1',
    image: {
        largeImageUrl: 'https://s3-eu-west-1.amazonaws.com/alexa.maxi80.com/assets/alexa-artwork-1200.png',
        smallImageUrl: 'https://s3-eu-west-1.amazonaws.com/alexa.maxi80.com/assets/alexa-artwork-720.png'
    }
}

var controller = function () {
    return {
        play: function (text) {
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */

            if (canThrowCard.call(this)) {
                var cardTitle   = audioData.subtitle;
                var cardContent = audioData.cardContent;
                var cardImage   = audioData.image;
                this.response.cardRenderer(cardTitle, cardContent, cardImage);
            }

            this.response.speak(text).audioPlayerPlay('REPLACE_ALL', audioData.url, audioData.url, null, 0);
            this.emit(':responseReady');
        },
        stop: function (text) {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.speak(text).audioPlayerStop();
            this.emit(':responseReady');
        }
    }
}();

function canThrowCard() {
    /*
     * To determine when can a card should be inserted in the response.
     * In response to a PlaybackController Request (remote control events) we cannot issue a card,
     * Thus adding restriction of request type being "IntentRequest".
     */
    if (this.event.request.type === 'IntentRequest' || this.event.request.type === 'LaunchRequest') {
        return true;
    } else {
        return false;
    }
}

exports.handler = function (event, context) {
    const skill = Alexa.handler(event, context)

    //TODO: Add appId validation
    //skill.appId = APP_ID

    skill.registerHandlers(stateEventHandlers, audioEventHandlers)
    skill.execute()
}
